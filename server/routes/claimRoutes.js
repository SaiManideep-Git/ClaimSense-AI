const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const Claim = require('../models/Claim');
const Employee = require('../models/Employee');
const Policy = require('../models/Policy');
const { uploadFile } = require('../services/fileStorage');
const { extractDocumentData } = require('../services/llmService');
const { adjudicateClaim } = require('../services/rulesEngine');
// Multer in-memory storage for handling uploads before streaming to Cloudinary or saving locally
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'prescription', maxCount: 1 },
  { name: 'bill', maxCount: 1 },
  { name: 'reports', maxCount: 5 }
]);

/**
 * @route   POST /api/claims/submit
 * @desc    Submit new claim, run AI extraction, run policy rules, save to DB
 */
router.post('/submit', upload, async (req, res) => {
  try {
    const {
      memberId,
      memberName,
      treatmentDate,
      claimAmount,
      hospital,
      cashlessRequest,
      memberJoinDate,
      previousClaimsSameDay,
      testCaseId // If testing specific mock inputs
    } = req.body;

    // Validate base inputs
    if (!memberId || !memberName || !treatmentDate || !claimAmount) {
      return res.status(400).json({ error: 'Missing required fields: memberId, memberName, treatmentDate, claimAmount' });
    }

    // A. Eligibility Check: Member Covered (MEMBER_NOT_COVERED)
    const employee = await Employee.findOne({ memberId });
    if (!employee || employee.status !== 'Active') {
      const ruleResult = {
        decision: 'REJECTED',
        approvedAmount: 0,
        deductions: { copay: 0, networkDiscount: 0, limitExceeded: 0, excludedItemsDetails: [] },
        rejectedItems: [],
        rejectionReasons: ['MEMBER_NOT_COVERED'],
        flags: [],
        notes: `Claimant with Member ID ${memberId} is not registered or covered under TechCorp policy records.`,
        nextSteps: 'Please verify your member ID or contact your HR administrator.',
        confidenceScore: 1.0
      };
      
      const newClaim = new Claim({
        claimId: `CLM_${Math.floor(100000 + Math.random() * 900000)}`,
        memberId,
        memberName,
        treatmentDate: new Date(treatmentDate),
        claimAmount: Number(claimAmount),
        hospital,
        cashlessRequest: cashlessRequest === 'true' || cashlessRequest === true,
        status: 'rejected',
        adjudication: ruleResult
      });
      await newClaim.save();
      console.log(`[Claim Submission] Saved claim ${newClaim.claimId} with decision: REJECTED (MEMBER_NOT_COVERED)`);
      return res.status(201).json(newClaim);
    }

    // A2. Fetch Policy Guidelines from DB
    const policy = await Policy.findOne({ policyId: employee.policyId });
    if (!policy) {
      return res.status(500).json({ error: 'Linked corporate Policy not found in database registry.' });
    }

    // B. Use Join Date from Employee Registry database
    const joinDateToUse = employee.joinDate;
    console.log(`[Claim Submission] Retieved joining date for ${memberId}: ${joinDateToUse}`);

    // C. Duplicate Claim Check (DUPLICATE_CLAIM)
    const duplicate = await Claim.findOne({
      memberId,
      treatmentDate: new Date(treatmentDate),
      claimAmount: Number(claimAmount),
      status: { $ne: 'rejected' }
    });

    if (duplicate) {
      const ruleResult = {
        decision: 'REJECTED',
        approvedAmount: 0,
        deductions: { copay: 0, networkDiscount: 0, limitExceeded: 0, excludedItemsDetails: [] },
        rejectedItems: [],
        rejectionReasons: ['DUPLICATE_CLAIM'],
        flags: [],
        notes: `A claim for the same treatment date (${treatmentDate}) and amount (₹${claimAmount}) has already been submitted (Claim ID: ${duplicate.claimId}).`,
        nextSteps: 'Please do not submit the same invoice twice. If you have distinct treatments on the same day, make sure their bill details vary.',
        confidenceScore: 1.0
      };

      const newClaim = new Claim({
        claimId: `CLM_${Math.floor(100000 + Math.random() * 900000)}`,
        memberId,
        memberName,
        treatmentDate: new Date(treatmentDate),
        claimAmount: Number(claimAmount),
        hospital,
        cashlessRequest: cashlessRequest === 'true' || cashlessRequest === true,
        status: 'rejected',
        adjudication: ruleResult
      });
      await newClaim.save();
      console.log(`[Claim Submission] Saved claim ${newClaim.claimId} with decision: REJECTED (DUPLICATE_CLAIM)`);
      return res.status(201).json(newClaim);
    }

    const claimContext = {
      memberId,
      memberName,
      treatmentDate,
      claimAmount: Number(claimAmount),
      hospital,
      cashlessRequest: cashlessRequest === 'true' || cashlessRequest === true,
      memberJoinDate: joinDateToUse,
      previousClaimsSameDay: Number(previousClaimsSameDay || 0),
      testCaseId
    };

    console.log(`[Claim Submission] Processing claim for ${memberName} (${memberId}), amount: ₹${claimAmount}`);

    // Files mapping
    const prescriptionFile = req.files?.['prescription']?.[0];
    const billFile = req.files?.['bill']?.[0];
    const reportFiles = req.files?.['reports'] || [];

    // Check if at least one file was uploaded
    if (!prescriptionFile && !billFile) {
      return res.status(400).json({ error: 'Missing document files. Upload at least a prescription or a bill.' });
    }

    // 1. Upload files to Storage (Cloudinary or local)
    const uploadedDocs = {
      prescription: null,
      bill: null,
      reports: []
    };

    if (prescriptionFile) {
      const result = await uploadFile(prescriptionFile);
      uploadedDocs.prescription = { url: result.url, filename: result.filename };
    }
    if (billFile) {
      const result = await uploadFile(billFile);
      uploadedDocs.bill = { url: result.url, filename: result.filename };
    }
    for (const file of reportFiles) {
      const result = await uploadFile(file);
      uploadedDocs.reports.push({ url: result.url, filename: result.filename });
    }

    // 2. Multi-document structured data extraction
    let prescriptionExtracted = {};
    let billExtracted = {};

    if (prescriptionFile) {
      prescriptionExtracted = await extractDocumentData(prescriptionFile, 'prescription', claimContext);
      uploadedDocs.prescription.extractedText = JSON.stringify(prescriptionExtracted);
    }
    if (billFile) {
      billExtracted = await extractDocumentData(billFile, 'bill', claimContext);
      uploadedDocs.bill.extractedText = JSON.stringify(billExtracted);
    }

    // 3. Aggregate Extracted Data
    const medicinesCombined = Array.from(new Set([
      ...(prescriptionExtracted.medicines || []),
      ...(billExtracted.medicines || [])
    ]));

    const testsCombined = Array.from(new Set([
      ...(prescriptionExtracted.tests || []),
      ...(billExtracted.tests || [])
    ]));

    const proceduresCombined = Array.from(new Set([
      ...(prescriptionExtracted.procedures || []),
      ...(billExtracted.procedures || [])
    ]));

    const aggregatedData = {
      patientName: prescriptionExtracted.patientName || billExtracted.patientName || memberName,
      hospitalName: billExtracted.hospitalName || prescriptionExtracted.hospitalName || hospital || '',
      doctorName: prescriptionExtracted.doctorName || billExtracted.doctorName || '',
      doctorReg: prescriptionExtracted.doctorReg || billExtracted.doctorReg || '',
      consultationDate: billExtracted.consultationDate || prescriptionExtracted.consultationDate || treatmentDate,
      prescriptionDate: prescriptionExtracted.consultationDate || null,
      billDate: billExtracted.consultationDate || null,
      claimAmount: Number(billExtracted.claimAmount || claimAmount),
      consultationFee: Number(billExtracted.consultationFee || prescriptionExtracted.consultationFee || 0),
      medicines: medicinesCombined,
      tests: testsCombined,
      procedures: proceduresCombined,
      diagnosis: prescriptionExtracted.diagnosis || billExtracted.diagnosis || 'OPD Consultation',
      claimType: prescriptionExtracted.claimType || billExtracted.claimType || 'OPD'
    };

    // D. Fetch YTD Approved Amount for Annual Limit check
    const claimYear = new Date(treatmentDate).getFullYear();
    const startOfYear = new Date(`${claimYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${claimYear}-12-31T23:59:59.999Z`);

    let ytdApprovedAmount = 0;
    try {
      const pastClaims = await Claim.find({
        memberId,
        status: { $in: ['approved', 'partial'] },
        treatmentDate: { $gte: startOfYear, $lte: endOfYear }
      });
      ytdApprovedAmount = pastClaims.reduce((sum, c) => sum + (c.adjudication.approvedAmount || 0), 0);
      console.log(`[Claim Submission] YTD approved amount for member ${memberId}: ₹${ytdApprovedAmount}`);
    } catch (dbErr) {
      console.error('[Claim Submission] Error fetching YTD approved amount:', dbErr.message);
    }

    claimContext.ytdApprovedAmount = ytdApprovedAmount;

    // 4. Run Policy Rules Engine
    const ruleResult = adjudicateClaim(claimContext, aggregatedData, policy);

    // 5. Store claim record in database
    const newClaim = new Claim({
      claimId: `CLM_${Math.floor(100000 + Math.random() * 900000)}`,
      memberId,
      memberName,
      treatmentDate: new Date(treatmentDate),
      claimAmount: Number(claimAmount),
      hospital: aggregatedData.hospitalName || hospital,
      cashlessRequest: claimContext.cashlessRequest,
      documents: uploadedDocs,
      extractedData: aggregatedData,
      adjudication: ruleResult,
      status: ruleResult.decision.toLowerCase() === 'partial' ? 'partial' : ruleResult.decision.toLowerCase()
    });

    await newClaim.save();
    console.log(`[Claim Submission] Saved claim ${newClaim.claimId} with decision: ${ruleResult.decision}`);

    res.status(201).json(newClaim);
  } catch (err) {
    console.error('[Claim Submission Error]:', err);
    res.status(500).json({ error: 'Failed to process claim submission', details: err.message });
  }
});

/**
 * @route   GET /api/claims
 * @desc    Fetch claim history
 */
router.get('/', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims history', details: err.message });
  }
});

/**
 * @route   GET /api/claims/:id
 * @desc    Fetch claim details
 */
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claim details', details: err.message });
  }
});

/**
 * @route   POST /api/claims/:id/appeal
 * @desc    Trigger appeal manual review workflow
 */
router.post('/:id/appeal', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Appeal reason is required.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    claim.status = 'manual_review';
    claim.adjudication.decision = 'MANUAL_REVIEW';
    claim.adjudication.notes = `Claim appealed by member. Appeal reason: "${reason}". Escalated for auditor review.`;
    claim.appealHistory.push({
      reason,
      status: 'pending',
      reviewerNotes: 'Under appeal audit.'
    });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process claim appeal', details: err.message });
  }
});

/**
 * @route   POST /api/test-suite
 * @desc    Execute pre-defined test cases against the rules engine and return comparisons
 */
router.get('/test-suite/run', async (req, res) => {
  try {
    let testCasesPath = path.join(__dirname, '../../plum_intern_assignment/test_cases.json');
    if (!fs.existsSync(testCasesPath)) {
      testCasesPath = path.join(__dirname, '../test_cases.json');
    }
    if (!fs.existsSync(testCasesPath)) {
      testCasesPath = path.join(__dirname, 'test_cases.json');
    }
    const testCasesData = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
    
    const results = [];
    let passedCount = 0;

    for (const tc of testCasesData.test_cases) {
      const startTime = process.hrtime();
      
      // Simulate aggregated extracted data from case prescription and bill
      const input = tc.input_data;
      const prescription = input.documents?.prescription || {};
      const bill = input.documents?.bill || {};

      const claimContext = {
        memberId: input.member_id,
        memberName: input.member_name,
        treatmentDate: input.treatment_date,
        claimAmount: input.claim_amount,
        hospital: input.hospital || '',
        cashlessRequest: input.cashless_request || false,
        memberJoinDate: input.member_join_date || null,
        previousClaimsSameDay: input.previous_claims_same_day || 0,
        testCaseId: tc.case_id
      };

      const extractedData = {
        patientName: input.member_name,
        hospitalName: input.hospital || "",
        doctorName: prescription.doctor_name || "",
        doctorReg: prescription.doctor_reg || "",
        consultationDate: input.treatment_date,
        claimAmount: input.claim_amount,
        consultationFee: bill.consultation_fee || 0,
        medicines: prescription.medicines_prescribed || [],
        tests: prescription.tests_prescribed || bill.test_names || [],
        procedures: prescription.procedures || (prescription.treatment ? [prescription.treatment] : []),
        diagnosis: prescription.diagnosis || '',
        claimType: prescription.procedures ? 'Dental' : (prescription.treatment ? 'Alternative' : 'OPD')
      };

      // Run rules engine
      const engineResult = adjudicateClaim(claimContext, extractedData);

      const endTime = process.hrtime(startTime);
      const elapsedMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

      // Verify alignment with expected output
      const expected = tc.expected_output;
      
      let isDecisionMatch = engineResult.decision === expected.decision;
      let isAmountMatch = true;

      if (expected.decision === 'APPROVED' || expected.decision === 'PARTIAL') {
        // Allow minor float differences
        isAmountMatch = Math.abs(engineResult.approvedAmount - expected.approved_amount) < 2;
      }

      // Check rejection reason if rejected
      let isReasonMatch = true;
      if (expected.decision === 'REJECTED' && expected.rejection_reasons) {
        isReasonMatch = expected.rejection_reasons.some(r => engineResult.rejectionReasons.includes(r));
      }

      const passed = isDecisionMatch && isAmountMatch && isReasonMatch;
      if (passed) passedCount++;

      results.push({
        caseId: tc.case_id,
        caseName: tc.case_name,
        description: tc.description,
        input: tc.input_data,
        expected: expected,
        actual: {
          decision: engineResult.decision,
          approvedAmount: engineResult.approvedAmount,
          deductions: engineResult.deductions,
          rejectionReasons: engineResult.rejectionReasons,
          notes: engineResult.notes
        },
        passed,
        elapsedMs
      });
    }

    res.json({
      summary: {
        totalCases: testCasesData.test_cases.length,
        passedCases: passedCount,
        failedCases: testCasesData.test_cases.length - passedCount,
        accuracyPercentage: ((passedCount / testCasesData.test_cases.length) * 100).toFixed(2)
      },
      results
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run test suite', details: err.message });
  }
});

/**
 * @route   GET /api/claims/employee/:memberId
 * @desc    Fetch employee details and linked policy rules with YTD calculations
 */
router.get('/employee/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const employee = await Employee.findOne({ memberId });
    if (!employee) {
      return res.status(404).json({ error: `Employee profile with ID ${memberId} not found in database registry.` });
    }

    const policy = await Policy.findOne({ policyId: employee.policyId });
    if (!policy) {
      return res.status(404).json({ error: `Linked corporate Policy ${employee.policyId} not found.` });
    }

    // Calculate YTD Approved Amount for Annual Limit check
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    let ytdApprovedAmount = 0;
    try {
      const pastClaims = await Claim.find({
        memberId,
        status: { $in: ['approved', 'partial'] },
        treatmentDate: { $gte: startOfYear, $lte: endOfYear }
      });
      ytdApprovedAmount = pastClaims.reduce((sum, c) => sum + (c.adjudication.approvedAmount || 0), 0);
    } catch (dbErr) {
      console.error('[Employee API] Error fetching YTD approved amount:', dbErr.message);
    }

    res.json({
      success: true,
      employee,
      policy,
      ytdApprovedAmount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employee record', details: err.message });
  }
});

module.exports = router;

