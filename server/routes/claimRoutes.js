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
      preAuthId,
      submissionDate,
      testCaseId
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

    // We will initialize file structures first, then compute fraud check queries,
    // and then construct claimContext below.

    console.log(`[Claim Submission] Processing claim for ${memberName} (${memberId}), amount: ₹${claimAmount}`);

    // Files mapping
    const prescriptionFile = req.files?.['prescription']?.[0];
    const billFile = req.files?.['bill']?.[0];
    const reportFiles = req.files?.['reports'] || [];

    // Check if at least one file was uploaded
    if (!prescriptionFile && !billFile) {
      return res.status(400).json({ error: 'Missing document files. Upload at least a prescription or a bill.' });
    }

    // Generate claim ID early for rules engine
    const generatedClaimId = `CLM_${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate same-day claims automatically from database
    let actualSameDayClaims = 0;
    try {
      const targetDate = new Date(treatmentDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      actualSameDayClaims = await Claim.countDocuments({
        memberId,
        treatmentDate: { $gte: startOfDay, $lte: endOfDay }
      });
      console.log(`[Claim Submission] Auto-detected ${actualSameDayClaims} claims for same treatment date: ${treatmentDate}`);
    } catch (dbErr) {
      console.error('[Claim Submission] Error calculating same-day claims count:', dbErr.message);
    }

    // Fraud check 1: Unusually high frequency of claims (> 3 in last 7 days or > 5 in last 30 days)
    let claimsInLast7Days = 0;
    let claimsInLast30Days = 0;
    try {
      const now = new Date();
      const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      claimsInLast7Days = await Claim.countDocuments({ memberId, createdAt: { $gte: startOf7Days } });
      claimsInLast30Days = await Claim.countDocuments({ memberId, createdAt: { $gte: startOf30Days } });
    } catch (err) {
      console.error('[Claim Submission] Error counting claims frequency:', err.message);
    }

    // Fraud check 2: Multiple claims from same provider on same day
    let providerSameDayClaims = 0;
    try {
      if (hospital) {
        const startOfDay = new Date(treatmentDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(treatmentDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        providerSameDayClaims = await Claim.countDocuments({
          hospital: new RegExp(`^${hospital.trim()}$`, 'i'),
          treatmentDate: { $gte: startOfDay, $lte: endOfDay }
        });
      }
    } catch (err) {
      console.error('[Claim Submission] Error counting provider same day claims:', err.message);
    }

    // Fraud check 3: Duplicate bills across different dates
    let duplicateBillDifferentDate = false;
    try {
      if (claimAmount && hospital) {
        const duplicateDiffDate = await Claim.findOne({
          memberId,
          claimAmount: Number(claimAmount),
          hospital: new RegExp(`^${hospital.trim()}$`, 'i'),
          treatmentDate: { $ne: new Date(treatmentDate) },
          status: { $ne: 'rejected' }
        });
        if (duplicateDiffDate) {
          duplicateBillDifferentDate = true;
        }
      }
    } catch (err) {
      console.error('[Claim Submission] Error checking duplicate bills diff dates:', err.message);
    }

    // Fraud check 4: Suspicious alterations based on filenames
    let hasSuspiciousAlterations = false;
    const suspiciousKeywords = ['edit', 'alter', 'modify', 'photoshop', 'forged', 'fake', 'hacked', 'patch'];
    const checkSuspicious = (filename) => {
      if (!filename) return false;
      return suspiciousKeywords.some(kw => filename.toLowerCase().includes(kw));
    };
    if (prescriptionFile && checkSuspicious(prescriptionFile.originalname)) {
      hasSuspiciousAlterations = true;
    }
    if (billFile && checkSuspicious(billFile.originalname)) {
      hasSuspiciousAlterations = true;
    }
    for (const file of reportFiles) {
      if (checkSuspicious(file.originalname)) {
        hasSuspiciousAlterations = true;
      }
    }

    const claimContext = {
      claimId: generatedClaimId,
      memberId,
      memberName,
      treatmentDate,
      claimAmount: Number(claimAmount),
      hospital,
      cashlessRequest: cashlessRequest === 'true' || cashlessRequest === true,
      memberJoinDate: joinDateToUse,
      previousClaimsSameDay: actualSameDayClaims,
      claimsInLast7Days,
      claimsInLast30Days,
      providerSameDayClaims,
      duplicateBillDifferentDate,
      hasSuspiciousAlterations,
      memberGender: employee.gender,
      memberAge: employee.age,
      preAuthId: preAuthId || '',
      submissionDate: submissionDate || null,
      testCaseId: testCaseId || null
    };

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
    let reportExtracted = {};

    if (prescriptionFile) {
      prescriptionExtracted = await extractDocumentData(prescriptionFile, 'prescription', claimContext);
      uploadedDocs.prescription.extractedText = JSON.stringify(prescriptionExtracted);
    }
    if (billFile) {
      billExtracted = await extractDocumentData(billFile, 'bill', claimContext);
      uploadedDocs.bill.extractedText = JSON.stringify(billExtracted);
    }
    if (reportFiles.length > 0) {
      try {
        reportExtracted = await extractDocumentData(reportFiles[0], 'report', claimContext);
        if (uploadedDocs.reports && uploadedDocs.reports[0]) {
          uploadedDocs.reports[0].extractedText = JSON.stringify(reportExtracted);
        }
        console.log('[Claim Submission] Successfully extracted data from diagnostic report:', reportExtracted);
      } catch (reportErr) {
        console.error('[Claim Submission] Error extracting from report file:', reportErr.message);
      }
    }

    // Assign report variables to claimContext for the rules engine
    claimContext.hasReportUploaded = reportFiles.length > 0;
    claimContext.reportExtracted = reportExtracted;

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
      claimId: generatedClaimId,
      memberId,
      memberName,
      treatmentDate: new Date(treatmentDate),
      claimAmount: Number(claimAmount),
      hospital: aggregatedData.hospitalName || hospital,
      cashlessRequest: claimContext.cashlessRequest,
      preAuthId: claimContext.preAuthId,
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

// Test suite run endpoint disabled per user request

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
    let claimYear = policy.effectiveDate ? new Date(policy.effectiveDate).getFullYear() : 2024;
    if (req.query.treatmentDate) {
      const parsedDate = new Date(req.query.treatmentDate);
      if (!isNaN(parsedDate.getTime())) {
        claimYear = parsedDate.getFullYear();
      }
    }
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

/**
 * @route   GET /api/claims/employees/all
 * @desc    Fetch all employees in the directory
 */
router.get('/employees/all', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ memberId: 1 });
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee directory', details: err.message });
  }
});

/**
 * @route   POST /api/claims/employees/create
 * @desc    Register a new employee
 */
router.post('/employees/create', async (req, res) => {
  try {
    const { memberId, name, joinDate, age, gender } = req.body;
    if (!memberId || !name || !joinDate) {
      return res.status(400).json({ error: 'Missing required employee fields: memberId, name, joinDate' });
    }

    const existing = await Employee.findOne({ memberId });
    if (existing) {
      return res.status(400).json({ error: `Employee with ID ${memberId} already exists in registry.` });
    }

    const newEmployee = new Employee({
      memberId,
      name,
      joinDate: new Date(joinDate),
      policyId: "PLUM_OPD_2024",
      status: "Active",
      age: Number(age) || undefined,
      gender: gender || undefined
    });

    await newEmployee.save();
    res.status(201).json({ success: true, employee: newEmployee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register employee', details: err.message });
  }
});

/**
 * @route   PUT /api/claims/employees/:memberId/status
 * @desc    Toggle employee status between Active and Terminated
 */
router.put('/employees/:memberId/status', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Terminated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Active or Terminated.' });
    }

    const employee = await Employee.findOne({ memberId });
    if (!employee) {
      return res.status(404).json({ error: `Employee ${memberId} not found.` });
    }

    employee.status = status;
    await employee.save();

    res.json({ success: true, employee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee status', details: err.message });
  }
});

/**
 * @route   PUT /api/claims/:id/adjudicate
 * @desc    Allow manual admin override of claim adjudication outcome
 */
router.put('/:id/adjudicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, approvedAmount, notes } = req.body;

    if (!decision || !['APPROVED', 'REJECTED', 'PARTIAL', 'MANUAL_REVIEW'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Must be APPROVED, REJECTED, PARTIAL, or MANUAL_REVIEW.' });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    claim.status = decision.toLowerCase() === 'partial' ? 'partial' : decision.toLowerCase();
    claim.adjudication.decision = decision;
    claim.adjudication.approvedAmount = Number(approvedAmount) || 0;
    claim.adjudication.notes = `[AUDITOR OVERRIDE]: ${notes || 'Claim manually reviewed and updated by admin.'} (Original: ${claim.adjudication.notes || ''})`;
    claim.adjudication.confidenceScore = 1.0;

    // Sync snake_case fields as well
    claim.adjudication.claim_id = claim.claimId;
    claim.adjudication.approved_amount = claim.adjudication.approvedAmount;
    claim.adjudication.rejection_reasons = claim.adjudication.rejectionReasons;
    claim.adjudication.confidence_score = 1.0;
    claim.adjudication.next_steps = decision === 'APPROVED' || decision === 'PARTIAL'
      ? `Manual override: Reimbursement of ₹${claim.adjudication.approvedAmount} authorized by auditor.`
      : 'Manual override: Claim rejected upon auditor audit.';
    claim.adjudication.nextSteps = claim.adjudication.next_steps;

    if (claim.appealHistory && claim.appealHistory.length > 0) {
      const lastAppeal = claim.appealHistory[claim.appealHistory.length - 1];
      if (lastAppeal.status === 'pending') {
        lastAppeal.status = decision.toLowerCase() === 'rejected' ? 'rejected' : 'approved';
        lastAppeal.reviewerNotes = notes || 'Manually adjudicated by administrator.';
      }
    }

    await claim.save();
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjudicate claim manually', details: err.message });
  }
});

module.exports = router;
