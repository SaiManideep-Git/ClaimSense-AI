const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const testCasesPath = path.join(__dirname, '../test_cases.json');
const samplesDir = path.join(__dirname, '../../client/public/samples');

if (!fs.existsSync(testCasesPath)) {
  console.error(`Error: test_cases.json not found at ${testCasesPath}`);
  process.exit(1);
}

if (!fs.existsSync(samplesDir)) {
  console.log(`Creating samples directory at ${samplesDir}`);
  fs.mkdirSync(samplesDir, { recursive: true });
}

const testCasesData = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

const drawDocument = (type, tcId, tc) => {
  const canvas = createCanvas(600, 800);
  const ctx = canvas.getContext('2d');
  const input = tc.input_data || {};

  // Base background: clean premium card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Subtle background texture/borders
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 592, 792);

  if (type === 'prescription') {
    const pres = input.documents?.prescription || {};

    // Rx Logo / Clinic Header
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(input.hospital || 'Care Clinic & Diagnostics', 50, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`DOCTOR REG NO: ${pres.doctor_reg || 'KA/45678/2015'}`, 50, 95);

    ctx.fillStyle = '#475569';
    ctx.font = '12px Arial';
    ctx.fillText(`PH: +91 9876543210`, 420, 95);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 115);
    ctx.lineTo(560, 115);
    ctx.stroke();

    // Patient / Doctor Metadata
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`DOCTOR: ${pres.doctor_name || 'Dr. Sharma'}`, 55, 145);
    ctx.fillText(`DATE: ${input.treatment_date || '2026-06-05'}`, 400, 145);

    ctx.font = '13px Arial';
    ctx.fillStyle = '#334155';
    ctx.fillText(`PATIENT: ${input.member_name} (Member ID: ${input.member_id})`, 55, 175);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 195);
    ctx.lineTo(560, 195);
    ctx.stroke();

    // Diagnosis
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('DIAGNOSIS & CLINICAL SYMPTOMS:', 55, 230);
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(pres.diagnosis || 'Viral fever', 65, 260);

    // Rx Section
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Rx', 55, 315);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('PRESCRIPTION / TREATMENT PLAN:', 95, 310);

    let y = 350;
    ctx.font = '13px Courier New';
    ctx.fillStyle = '#334155';

    if (pres.medicines_prescribed) {
      pres.medicines_prescribed.forEach((med) => {
        ctx.fillText(`• ${med} - 1 Tab twice daily for 5 days`, 65, y);
        y += 30;
      });
    }

    if (pres.procedures) {
      pres.procedures.forEach((proc) => {
        ctx.fillText(`• Procedure: ${proc} (performed under aseptic precaution)`, 65, y);
        y += 30;
      });
    }

    if (pres.tests_prescribed) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px Arial';
      ctx.fillText('RECOMMENDED LAB/DIAGNOSTIC CHECKS:', 55, y + 10);
      y += 40;
      ctx.font = '13px Courier New';
      ctx.fillStyle = '#475569';
      pres.tests_prescribed.forEach((test) => {
        ctx.fillText(`- ${test} (Fast-track laboratory referral)`, 65, y);
        y += 28;
      });
    }

    // Footnote
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 11px Arial';
    ctx.fillText('Please follow up in case symptoms persist.', 50, 715);
    ctx.fillText('This prescription is digitally authenticated by the registered consultant.', 50, 730);

    // Sign-off signature line
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(350, 710);
    ctx.lineTo(540, 710);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 12px Arial';
    ctx.fillText('Consultant Signature & Stamp', 350, 730);

  } else if (type === 'report') {
    const pres = input.documents?.prescription || {};
    const tests = pres.tests_prescribed || (input.documents?.bill?.test_names) || ['Diagnostic Tests'];

    // Header: Diagnostics Logo
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Care Diagnostics & Lab Center', 50, 75);
    
    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial';
    ctx.fillText('NABL Accredited Laboratory | ISO 9001:2015 Certified', 50, 100);

    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 115);
    ctx.lineTo(560, 115);
    ctx.stroke();

    // Patient Details
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px Arial';
    ctx.fillText(`Patient Name :  ${input.member_name}`, 55, 145);
    ctx.fillText(`Member ID    :  ${input.member_id}`, 55, 165);
    ctx.fillText(`Date of Test :  ${input.treatment_date || '2026-06-05'}`, 380, 145);
    ctx.fillText(`Report Status:  FINAL`, 380, 165);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 185);
    ctx.lineTo(560, 185);
    ctx.stroke();

    // Lab observations header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('LABORATORY REVIEWS & INVESTIGATION RESULTS', 55, 220);

    // Table Headers
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 240, 500, 30);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 240, 500, 30);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('TEST NAME / PARAMETER', 65, 260);
    ctx.fillText('OBSERVED VALUE', 260, 260);
    ctx.fillText('REFERENCE RANGE / REMARK', 400, 260);

    // Rows
    let y = 305;
    ctx.font = '13px Courier New';
    ctx.fillStyle = '#1e293b';

    tests.forEach((testName) => {
      ctx.fillText(testName, 65, y);
      
      let val = 'Normal';
      let ref = 'Negative / Clear';
      if (testName.toLowerCase().includes('cbc')) {
        val = 'Hb 13.8 g/dL';
        ref = '12.0 - 16.0 g/dL';
      } else if (testName.toLowerCase().includes('dengue')) {
        val = 'NS1 Positive';
        ref = 'Negative (Borderline)';
      } else if (testName.toLowerCase().includes('mri')) {
        val = 'L4-L5 Bulge';
        ref = 'Normal spinal alignment';
      }

      ctx.fillText(val, 260, y);
      ctx.fillText(ref, 400, y);
      y += 35;
    });

    // Sign-off
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 12px Arial';
    ctx.fillText('Certified Pathologist Signature', 330, 710);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(330, 700);
    ctx.lineTo(540, 700);
    ctx.stroke();

  } else {
    // Bill/Invoice Generation
    const bill = input.documents?.bill || {};

    // Header: Hospital / Invoice
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(input.hospital || 'Care Clinic & General Hospital', 50, 80);
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Tax Invoice / Bill Statement', 50, 105);

    // Line separator
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 130);
    ctx.lineTo(560, 130);
    ctx.stroke();

    // Bill Info
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.fillText(`Patient Name :  ${input.member_name}`, 55, 160);
    ctx.fillText(`Member ID    :  ${input.member_id}`, 55, 180);
    ctx.fillText(`Invoice No   :  INV-${Math.floor(100000 + Math.random() * 900000)}`, 55, 200);
    ctx.fillText(`Date         :  ${input.treatment_date || '2026-06-05'}`, 380, 160);

    // Table Headers
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 230, 500, 30);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 230, 500, 30);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Line Item / Description', 65, 250);
    ctx.fillText('Amount (INR)', 440, 250);

    // Table Rows
    ctx.font = '13px Courier New';
    ctx.fillStyle = '#0f172a';
    let y = 295;
    let calculatedSubtotal = 0;

    // Summary fields list to avoid rendering them in line item rows
    const summaryKeys = ['subtotal', 'cgst', 'sgst', 'net_payable', 'tax', 'gst', 'total_amount', 'total'];

    // Check fields and write rows dynamically
    Object.keys(bill).forEach((key) => {
      if (summaryKeys.includes(key.toLowerCase())) {
        return;
      }

      if (key === 'diagnostic_tests' && bill.test_names) {
        return;
      }

      const val = bill[key];
      if (typeof val === 'number') {
        const desc = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        ctx.fillText(desc, 65, y);
        ctx.fillText(`Rs. ${val.toFixed(2)}`, 440, y);
        calculatedSubtotal += val;
        y += 35;
      } else if (Array.isArray(val)) {
        const totalArrayCost = Number(bill.diagnostic_tests || 500);
        const itemCost = totalArrayCost / val.length;
        
        val.forEach((item) => {
          ctx.fillText(item, 65, y);
          ctx.fillText(`Rs. ${itemCost.toFixed(2)}`, 440, y);
          calculatedSubtotal += itemCost;
          y += 35;
        });
      }
    });

    // Default Consultation Fee fallback
    if (calculatedSubtotal === 0) {
      const fallbackCost = Number(input.claim_amount || 1500);
      ctx.fillText('OPD Consultation Fee', 65, y);
      ctx.fillText(`Rs. ${fallbackCost.toFixed(2)}`, 440, y);
      calculatedSubtotal = fallbackCost;
      y += 35;
    }

    // Draw line before totals
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(50, y - 15);
    ctx.lineTo(550, y - 15);
    ctx.stroke();

    // Read summary totals or compute them
    const printedSubtotal = Number(bill.subtotal || calculatedSubtotal);
    const printedCgst = bill.cgst !== undefined ? Number(bill.cgst) : 0;
    const printedSgst = bill.sgst !== undefined ? Number(bill.sgst) : 0;
    const printedNetPayable = bill.net_payable !== undefined ? Number(bill.net_payable) : (printedSubtotal + printedCgst + printedSgst);

    // Print Totals Section at the bottom in aligned fashion
    ctx.fillStyle = '#475569';
    ctx.font = '13px Courier New';
    
    ctx.fillText('Subtotal:', 300, y);
    ctx.fillText(`Rs. ${printedSubtotal.toFixed(2)}`, 440, y);
    y += 25;

    if (printedCgst > 0 || printedSgst > 0) {
      ctx.fillText('CGST:', 300, y);
      ctx.fillText(`Rs. ${printedCgst.toFixed(2)}`, 440, y);
      y += 25;
      ctx.fillText('SGST:', 300, y);
      ctx.fillText(`Rs. ${printedSgst.toFixed(2)}`, 440, y);
      y += 25;
    }

    // Draw final line before net payable
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(300, y - 12);
    ctx.lineTo(550, y - 12);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText('Net Payable:', 300, y);
    ctx.fillText(`Rs. ${printedNetPayable.toFixed(2)}`, 435, y);

    // Footer terms
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Arial';
    ctx.fillText('Thank you for choosing our healthcare facility.', 50, 720);
    ctx.fillText('This is a computer generated invoice and requires no physical signature.', 50, 735);
  }

  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const filename = `${tcId}_${capitalizedType}.png`;
  const filePath = path.join(samplesDir, filename);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated and saved: ${filename}`);
};

const run = () => {
  console.log('=== STARTING SAMPLE IMAGE GENERATION ===');
  let count = 0;
  for (const tc of testCasesData.test_cases) {
    const id = tc.case_id;
    const input = tc.input_data;
    
    if (input.documents?.prescription) {
      drawDocument('prescription', id, tc);
      count++;
    }

    if (input.documents?.bill) {
      drawDocument('bill', id, tc);
      count++;
    }

    // Auto-generate reports if needed
    const hasTests = 
      (input.documents?.prescription?.tests_prescribed && input.documents.prescription.tests_prescribed.length > 0) ||
      (input.documents?.bill?.test_names && input.documents.bill.test_names.length > 0);
    
    if (hasTests) {
      drawDocument('report', id, tc);
      count++;
    }
  }
  console.log(`=== SUCCESSFULLY GENERATED ${count} MOCK DOCUMENT IMAGES ===`);
};

run();
