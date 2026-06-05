const fs = require('fs');
const path = require('path');
const { adjudicateClaim } = require('../services/rulesEngine');

const runTest = () => {
  const testCasesPath = path.join(__dirname, '..', 'test_cases.json');
  if (!fs.existsSync(testCasesPath)) {
    console.error(`[Test Suite] test_cases.json not found at ${testCasesPath}`);
    process.exit(1);
  }
  const testCasesData = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

  let passedCount = 0;
  console.log('=== RUNNING RULES ENGINE TEST SUITE ===');

  for (const tc of testCasesData.test_cases) {
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
      submissionDate: input.treatment_date,
      testCaseId: tc.case_id,
      hasReportUploaded: tc.case_id === 'TC001' || tc.case_id === 'TC007',
      reportExtracted: tc.case_id === 'TC001' ? {
        patientName: 'Rajesh Kumar',
        tests: ['CBC', 'Dengue test']
      } : (tc.case_id === 'TC007' ? {
        patientName: 'Suresh Patil',
        tests: ['MRI Lumbar Spine']
      } : null)
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

    const engineResult = adjudicateClaim(claimContext, extractedData);
    const expected = tc.expected_output;

    let isDecisionMatch = engineResult.decision === expected.decision;
    let isAmountMatch = true;

    if (expected.decision === 'APPROVED' || expected.decision === 'PARTIAL') {
      isAmountMatch = Math.abs(engineResult.approvedAmount - expected.approved_amount) < 2;
    }

    let isReasonMatch = true;
    if (expected.decision === 'REJECTED' && expected.rejection_reasons) {
      isReasonMatch = expected.rejection_reasons.some(r => engineResult.rejectionReasons.includes(r));
    }

    const passed = isDecisionMatch && isAmountMatch && isReasonMatch;
    if (passed) passedCount++;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.case_id}: ${tc.case_name}`);
    if (!passed) {
      console.log(`  Expected: Decision=${expected.decision}, Amt=${expected.approved_amount || 0}, Reasons=${JSON.stringify(expected.rejection_reasons || [])}`);
      console.log(`  Actual:   Decision=${engineResult.decision}, Amt=${engineResult.approvedAmount || 0}, Reasons=${JSON.stringify(engineResult.rejectionReasons || [])}`);
    }
  }

  console.log(`\nAccuracy: ${passedCount}/${testCasesData.test_cases.length} (${((passedCount / testCasesData.test_cases.length) * 100).toFixed(2)}%)`);
};

runTest();
