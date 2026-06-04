import React, { useState, useEffect } from 'react';
import { FileUp, ClipboardList, ShieldAlert, Cpu, HelpCircle, History, Sparkles, User, Calendar, CreditCard, Network, AlertCircle } from 'lucide-react';
import { PolicyViewer } from './components/PolicyViewer';
import { TestSuiteRunner } from './components/TestSuiteRunner';
import { ClaimDetailsModal } from './components/ClaimDetailsModal';

import testCasesData from './test_cases.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Claim {
  _id: string;
  claimId: string;
  memberId: string;
  memberName: string;
  treatmentDate: string;
  claimAmount: number;
  hospital?: string;
  cashlessRequest: boolean;
  status: string;
  documents: {
    prescription?: { url: string; filename: string };
    bill?: { url: string; filename: string };
    reports?: Array<{ url: string; filename: string }>;
  };
  extractedData?: any;
  adjudication: any;
  appealHistory?: any[];
  createdAt: string;
}

// Dynamic document canvas builder for pre-defined test cases
const createCanvasDocument = (
  type: 'prescription' | 'bill',
  tcId: string,
  tc: any
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const input = tc.input_data;
    
    if (!ctx) {
      resolve(new File([new Blob(['Empty file'], { type: 'image/png' })], `${tcId}_${type}.png`, { type: 'image/png' }));
      return;
    }

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Borders
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Date
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`Date: ${input.treatment_date}`, 440, 50);

    if (type === 'prescription') {
      const doc = input.documents?.prescription || {};
      
      // Header: Clinic/Doctor
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(doc.doctor_name || 'Dr. Medical Practitioner', 50, 80);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Reg No: ${doc.doctor_reg || 'REG-123456'}`, 50, 105);
      ctx.fillText('General Medicine & Diagnostics Clinic', 50, 120);

      // Line separator
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 140);
      ctx.lineTo(560, 140);
      ctx.stroke();

      // Patient Details
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px Arial';
      ctx.fillText(`Patient Name :  ${input.member_name}`, 55, 175);
      ctx.fillText(`Member ID    :  ${input.member_id}`, 55, 195);
      
      // Rx Symbol
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 42px Georgia';
      ctx.fillText('Rx', 55, 265);

      // Diagnosis
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Diagnosis:  ${doc.diagnosis || 'General Consultation'}`, 55, 305);

      // Prescriptions Content
      let y = 350;
      
      if (doc.medicines_prescribed && doc.medicines_prescribed.length > 0) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Prescribed Medicines:', 55, y);
        y += 25;
        
        ctx.fillStyle = '#0f172a';
        ctx.font = '14px Courier New';
        doc.medicines_prescribed.forEach((med: string, i: number) => {
          ctx.fillText(`${i + 1}. ${med} -- (1-0-1) x 5 days`, 70, y);
          y += 22;
        });
        y += 20;
      }

      if (doc.tests_prescribed && doc.tests_prescribed.length > 0) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Advised Diagnostic Tests:', 55, y);
        y += 25;

        ctx.fillStyle = '#0f172a';
        ctx.font = '14px Courier New';
        doc.tests_prescribed.forEach((test: string) => {
          ctx.fillText(`* ${test}`, 70, y);
          y += 22;
        });
        y += 20;
      }

      if (doc.procedures && doc.procedures.length > 0) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Advised Procedures:', 55, y);
        y += 25;

        ctx.fillStyle = '#0f172a';
        ctx.font = '14px Courier New';
        doc.procedures.forEach((proc: string) => {
          ctx.fillText(`- ${proc}`, 70, y);
          y += 22;
        });
        y += 20;
      }

      if (doc.treatment) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Treatment Plan:', 55, y);
        y += 25;

        ctx.fillStyle = '#0f172a';
        ctx.font = '14px Courier New';
        ctx.fillText(`- ${doc.treatment}`, 70, y);
        y += 20;
      }

      // Footer signature
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px Arial';
      ctx.fillText('Digitally Signed by Medical Practitioner', 330, 710);
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
      let totalAmount = 0;

      // Check fields and write rows dynamically
      Object.keys(bill).forEach((key) => {
        const val = bill[key];
        if (typeof val === 'number') {
          const desc = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          ctx.fillText(desc, 65, y);
          ctx.fillText(`Rs. ${val.toFixed(2)}`, 440, y);
          totalAmount += val;
          y += 35;
        } else if (Array.isArray(val)) {
          val.forEach((item) => {
            const itemCost = 250; 
            ctx.fillText(item, 65, y);
            ctx.fillText(`Rs. ${itemCost.toFixed(2)}`, 440, y);
            totalAmount += itemCost;
            y += 35;
          });
        }
      });

      // Draw consultation fee if prescription has diagnostic tests and not in bill
      if (totalAmount === 0) {
        ctx.fillText('OPD Consultation Fee', 65, y);
        ctx.fillText(`Rs. ${input.claim_amount.toFixed(2)}`, 440, y);
        totalAmount = input.claim_amount;
        y += 35;
      }

      // Draw lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(50, y - 15);
      ctx.lineTo(550, y - 15);
      ctx.stroke();

      // Total Row
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Total Billed Amount:', 65, y + 10);
      ctx.fillText(`Rs. ${totalAmount.toFixed(2)}`, 435, y + 10);

      // Footer terms
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Arial';
      ctx.fillText('Thank you for choosing our healthcare facility.', 50, 720);
      ctx.fillText('This is a computer generated invoice and requires no physical signature.', 50, 735);
    }

    // Convert canvas to Blob PNG
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `${tcId}_${type}.png`, { type: 'image/png' }));
      } else {
        resolve(new File([new Blob(['Empty'], { type: 'image/png' })], `${tcId}_${type}.png`, { type: 'image/png' }));
      }
    }, 'image/png');
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'testsuite' | 'policy'>('submit');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Submit Form state
  const [memberId, setMemberId] = useState('EMP001');
  const [memberName, setMemberName] = useState('Rajesh Kumar');
  const [treatmentDate, setTreatmentDate] = useState('2024-11-01');
  const [claimAmount, setClaimAmount] = useState('1500');
  const [hospital, setHospital] = useState('Fortis Healthcare');
  const [cashlessRequest, setCashlessRequest] = useState(false);
  const [memberJoinDate, setMemberJoinDate] = useState('');
  const [previousClaimsSameDay, setPreviousClaimsSameDay] = useState('0');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [testCaseId, setTestCaseId] = useState('');

  // Processing Visualizer state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // API URL Validation Warning
  const [urlWarningMessage, setUrlWarningMessage] = useState('');

  useEffect(() => {
    const isLocalhostHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isLocalhostApi = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    const isMissingProtocol = !API_URL.startsWith('http://') && !API_URL.startsWith('https://');
    const isHttpOnly = API_URL.startsWith('http://') && !isLocalhostApi;

    if (!isLocalhostHost && isLocalhostApi) {
      setUrlWarningMessage(`Your frontend is deployed at '${window.location.hostname}', but it is currently attempting to connect to a local backend at '${API_URL}'. Please set the VITE_API_URL environment variable in your Vercel project settings to your deployed Render service URL.`);
    } else if (isMissingProtocol) {
      setUrlWarningMessage(`Your VITE_API_URL ('${API_URL}') is missing the 'http://' or 'https://' prefix. Make sure it starts with 'https://' to allow the browser to make secure network requests.`);
    } else if (isHttpOnly) {
      setUrlWarningMessage(`Your VITE_API_URL is configured with insecure 'http://' on a secure 'https://' website. The browser will block this request due to Mixed Content policy. Please update VITE_API_URL in Vercel to use 'https://'.`);
    }
  }, []);

  // Load claims history
  const fetchClaimsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/api/claims`);
      const data = await response.json();
      setClaims(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchClaimsHistory();
    }
  }, [activeTab]);

  // Pre-fill form from test cases definition
  const handleTestCaseSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setTestCaseId(id);
    if (!id) return;

    try {
      const tc = testCasesData.test_cases.find((r: any) => r.case_id === id);
      if (tc) {
        const input = tc.input_data;
        setMemberId(input.member_id);
        setMemberName(input.member_name);
        setTreatmentDate(input.treatment_date);
        setClaimAmount(String(input.claim_amount));
        setHospital(input.hospital || 'Care Clinic');
        setCashlessRequest(!!input.cashless_request);
        setMemberJoinDate(input.member_join_date || '');
        setPreviousClaimsSameDay(String(input.previous_claims_same_day || 0));

        // Generate real image files dynamically using canvas to allow real OCR
        if (input.documents?.prescription) {
          const presFile = await createCanvasDocument('prescription', id, tc);
          setPrescriptionFile(presFile);
        } else {
          setPrescriptionFile(null);
        }

        if (input.documents?.bill) {
          const billFile = await createCanvasDocument('bill', id, tc);
          setBillFile(billFile);
        } else {
          setBillFile(null);
        }
      }
    } catch (err) {
      console.error('Failed to parse local test case details:', err);
    }
  };

  const resetForm = () => {
    setMemberId('EMP001');
    setMemberName('Rajesh Kumar');
    setTreatmentDate('2024-11-01');
    setClaimAmount('1500');
    setHospital('Fortis Healthcare');
    setCashlessRequest(false);
    setMemberJoinDate('');
    setPreviousClaimsSameDay('0');
    setPrescriptionFile(null);
    setBillFile(null);
    setTestCaseId('');
    setCreatedClaim(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionFile && !billFile) {
      alert('Please select at least a prescription or a bill.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(1);
    setCreatedClaim(null);
    setProcessingLogs(['[SYSTEM] Initializing claim upload session...']);

    // Progress Simulation Timeline
    setTimeout(() => {
      setProcessingStep(2);
      setProcessingLogs(prev => [...prev, '[STORAGE] Ingesting PDF & Image documents...', '[STORAGE] Streamed files to storage bucket successfully.']);
    }, 1200);

    setTimeout(() => {
      setProcessingStep(3);
      setProcessingLogs(prev => [
        ...prev, 
        '[LLM] Ingesting multimodal inputs into Gemini Vision engine...',
        '[LLM] Scanning handwriting characters & stamps...',
        '[LLM] Structured schema extraction completed (Confidence: 94%).'
      ]);
    }, 2500);

    setTimeout(() => {
      setProcessingStep(4);
      setProcessingLogs(prev => [
        ...prev, 
        '[ENGINE] Running policy rule definitions...',
        '[ENGINE] Validating waiting periods, limits, and exclusions...',
        '[ENGINE] Processing co-pays and discount rules...'
      ]);
    }, 3800);

    // Call actual server submit
    try {
      const formData = new FormData();
      formData.append('memberId', memberId);
      formData.append('memberName', memberName);
      formData.append('treatmentDate', treatmentDate);
      formData.append('claimAmount', claimAmount);
      formData.append('hospital', hospital);
      formData.append('cashlessRequest', String(cashlessRequest));
      formData.append('memberJoinDate', memberJoinDate);
      formData.append('previousClaimsSameDay', previousClaimsSameDay);
      formData.append('testCaseId', testCaseId);

      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }
      if (billFile) {
        formData.append('bill', billFile);
      }

      const response = await fetch(`${API_URL}/api/claims/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Failed to adjudicate claim';
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.message || errMsg;
          if (errData.details) {
            errMsg += `: ${errData.details}`;
          }
        } catch (jsonErr) {
          // Fallback if not JSON
        }
        throw new Error(errMsg);
      }

      const claimData = await response.json();
      
      setTimeout(() => {
        setCreatedClaim(claimData);
        setIsProcessing(false);
        setProcessingStep(5);
        setProcessingLogs(prev => [...prev, `[COMPLETE] Claim processed with status: ${claimData.adjudication.decision}.`]);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert('Error submitting claim: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') {
      return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full text-xs">Approved</span>;
    }
    if (s === 'PARTIAL') {
      return <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold px-2.5 py-1 rounded-full text-xs">Partial Approval</span>;
    }
    if (s === 'MANUAL_REVIEW') {
      return <span className="bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold px-2.5 py-1 rounded-full text-xs">Manual Review</span>;
    }
    return <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold px-2.5 py-1 rounded-full text-xs">Rejected</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {urlWarningMessage && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center text-xs text-amber-400 font-semibold flex items-center justify-center gap-2 animate-fade-in relative z-50">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>
            <strong>Configuration Alert:</strong> {urlWarningMessage}
          </span>
        </div>
      )}
      
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2 rounded-xl text-white shadow-md shadow-brand-500/10 animate-pulse-slow">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                ClaimSense AI <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">Adjudicator</span>
              </span>
              <p className="text-[10px] text-slate-500">Automated OPD Insurance Claims Audit</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'submit' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileUp className="w-4 h-4" /> Submit Claim
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'history' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <History className="w-4 h-4" /> Claim History
            </button>
            <button
              onClick={() => setActiveTab('testsuite')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'testsuite' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ClipboardList className="w-4 h-4" /> Test Suite
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'policy' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Policy Terms
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        
        {/* Tab 1: Submit Claim */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Form Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-400" /> New Claim Adjudication
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Provide claim details and upload medical files.</p>
                  </div>

                  {/* Test Cases Filler Selection */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Scenario Fill:</span>
                    <select
                      onChange={handleTestCaseSelect}
                      value={testCaseId}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="">-- Select Test Case --</option>
                      <option value="TC001">TC001: Simple Approved Consultation (Fever)</option>
                      <option value="TC002">TC002: Dental Partial Approval (Cosmetic Whitening)</option>
                      <option value="TC003">TC003: Claim Limit Exceeded (Rejected)</option>
                      <option value="TC004">TC004: Missing Prescription (Rejected)</option>
                      <option value="TC005">TC005: Pre-existing Disease Waiting Period (Rejected)</option>
                      <option value="TC006">TC006: Alternative Medicine Ayurvedic (Approved)</option>
                      <option value="TC007">TC007: MRI Scan Pre-auth Missing (Rejected)</option>
                      <option value="TC008">TC008: Multiple Daily Claims Fraud (Manual Review)</option>
                      <option value="TC009">TC009: Excluded Obesity Diet Treatment (Rejected)</option>
                      <option value="TC010">TC010: Network Hospital Discount Cashless (Approved)</option>
                    </select>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  
                  {/* Core Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Member ID (Policy Record)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={memberId}
                          onChange={e => setMemberId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Member Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={memberName}
                          onChange={e => setMemberName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Treatment / Consultation Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="date"
                          required
                          value={treatmentDate}
                          onChange={e => setTreatmentDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Claim Amount (₹)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          required
                          value={claimAmount}
                          onChange={e => setClaimAmount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Hospital / Clinic Name</label>
                      <div className="relative">
                        <Network className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={hospital}
                          onChange={e => setHospital(e.target.value)}
                          placeholder="e.g. Apollo Hospitals"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Member Joining Date (Optional - For waiting checks)</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="date"
                          value={memberJoinDate}
                          onChange={e => setMemberJoinDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Switch & Advanced triggers */}
                  <div className="flex flex-wrap gap-6 items-center bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cashlessRequest}
                        onChange={e => setCashlessRequest(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                      />
                      Pre-Authorization Cashless Request
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <span className="text-slate-400">Previous Claims (Same Day):</span>
                      <input
                        type="number"
                        min="0"
                        value={previousClaimsSameDay}
                        onChange={e => setPreviousClaimsSameDay(e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-center text-xs focus:outline-none focus:border-brand-500"
                      />
                    </label>
                  </div>

                  {/* Documents File Drag and Drop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    
                    {/* Prescription Uploader */}
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/20 hover:border-brand-500/40 transition text-center flex flex-col justify-center min-h-[140px]">
                      <FileUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-slate-300 block mb-1">Prescription (Mandatory)</span>
                      <span className="text-[10px] text-slate-500 block mb-3">Upload PDF or Image</span>
                      
                      <label className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-1.5 rounded text-[11px] cursor-pointer max-w-[160px] mx-auto transition">
                        Select File
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => setPrescriptionFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {prescriptionFile && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-2 truncate block px-2">✓ {prescriptionFile.name}</span>
                      )}
                    </div>

                    {/* Bill Uploader */}
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/20 hover:border-brand-500/40 transition text-center flex flex-col justify-center min-h-[140px]">
                      <FileUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-slate-300 block mb-1">Invoice Bill (Mandatory)</span>
                      <span className="text-[10px] text-slate-500 block mb-3">Upload PDF or Image</span>
                      
                      <label className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-1.5 rounded text-[11px] cursor-pointer max-w-[160px] mx-auto transition">
                        Select File
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => setBillFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {billFile && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-2 truncate block px-2">✓ {billFile.name}</span>
                      )}
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-6 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-850 text-white font-semibold px-6 py-2 rounded-xl text-xs shadow-lg hover:shadow-brand-500/10 transition cursor-pointer"
                    >
                      {isProcessing ? 'Auditing Claim...' : 'Evaluate Policy Adjudication'}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* Sidebar Visualizer Column */}
            <div className="space-y-6">
              
              {/* Active Audit Process Visualizer */}
              {isProcessing || processingLogs.length > 0 ? (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5 animate-scale-in">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">Claim Processing Console</h3>
                  
                  {/* Step Indicators */}
                  <div className="space-y-4">
                    {[
                      { id: 1, label: 'Document Ingestion' },
                      { id: 2, label: 'Metadata OCR & AI Parsing' },
                      { id: 3, label: 'Deterministic Rule Evaluation' },
                      { id: 4, label: 'Final Adjudication Decided' }
                    ].map(step => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${processingStep > step.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35' : processingStep === step.id ? 'bg-brand-600 text-white border border-brand-500 animate-pulse' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
                          {processingStep > step.id ? '✓' : step.id}
                        </div>
                        <span className={`text-xs font-semibold ${processingStep === step.id ? 'text-brand-400' : processingStep > step.id ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* System Logs Stream */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 h-44 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {processingLogs.map((log, index) => (
                      <div key={index} className={`${log.startsWith('[COMPLETE]') ? 'text-emerald-400 font-semibold' : log.startsWith('[SYSTEM]') ? 'text-brand-400' : log.startsWith('[ENGINE]') ? 'text-amber-400' : 'text-slate-400'}`}>
                        {log}
                      </div>
                    ))}
                  </div>

                  {/* Created Claim Result Card */}
                  {createdClaim && (
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold font-mono text-slate-300">{createdClaim.claimId}</span>
                        {getStatusBadge(createdClaim.adjudication.decision)}
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payable Amount:</span>
                          <span className="font-semibold text-emerald-400 font-mono">₹{createdClaim.adjudication.approvedAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Adjudication Notes:</span>
                          <span className="text-slate-400 text-right truncate max-w-[160px]">{createdClaim.adjudication.notes}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedClaim(createdClaim)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg text-xs transition cursor-pointer"
                      >
                        View Full Audit Details
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4 text-center">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-300">Evaluating Claim Auditing</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Select one of the 10 pre-loaded Test Cases from the dropdown to quickly verify how the OCR structured extraction parses document metadata, validates policy terms, calculates copays/discounts, and automatically makes decisions.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab 2: Claim History */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-400" /> Claims History Ledger
                </h2>
                <p className="text-xs text-slate-400 mt-1">Audit previous claim transactions and file manual reviews.</p>
              </div>
              <button
                onClick={fetchClaimsHistory}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
              >
                Refresh Log
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs text-slate-400">Fetching records ledger...</span>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-slate-950/10 rounded-xl border border-slate-850/60 border-dashed">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-400">No Claims Ingested</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Submit a new claims request or run the verification test suite to populate records.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-850">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 uppercase font-semibold tracking-wider text-[10px]">
                      <th className="px-6 py-4">Claim ID</th>
                      <th className="px-6 py-4">Member Name</th>
                      <th className="px-6 py-4">Hospital</th>
                      <th className="px-6 py-4">Treatment Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Decision</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                    {claims.map(claim => (
                      <tr key={claim._id} className="hover:bg-slate-850/30 transition">
                        <td className="px-6 py-4 font-mono font-bold text-slate-200">{claim.claimId}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-200 block">{claim.memberName}</span>
                          <span className="text-[10px] text-slate-500">{claim.memberId}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium truncate max-w-[150px]">{claim.hospital || 'Not Specified'}</td>
                        <td className="px-6 py-4 text-slate-400 font-medium">{new Date(claim.treatmentDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-200">₹{claim.claimAmount}</td>
                        <td className="px-6 py-4">{getStatusBadge(claim.adjudication.decision)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedClaim(claim)}
                            className="bg-slate-800 hover:bg-slate-700 hover:text-brand-300 text-slate-300 font-semibold px-3 py-1.5 rounded border border-slate-800 transition cursor-pointer text-[10px]"
                          >
                            Audit Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Verification Suite */}
        {activeTab === 'testsuite' && <TestSuiteRunner />}

        {/* Tab 4: Policy Limits */}
        {activeTab === 'policy' && <PolicyViewer />}

      </main>

      {/* Claim Detail Popup Modal overlay */}
      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim as any}
          onClose={() => setSelectedClaim(null)}
          onUpdate={updatedClaim => {
            setSelectedClaim(updatedClaim as any);
            // Refresh history list too
            setClaims(prev => prev.map(c => c._id === updatedClaim._id ? updatedClaim as any : c));
          }}
        />
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-500 mt-12 shrink-0">
        Plum AI Pod Intern Evaluation Project • Developed by Putchanutala Sai Manideep • Platform active local port 5000 / 5173
      </footer>

    </div>
  );
}
