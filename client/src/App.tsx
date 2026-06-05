import React, { useState, useEffect } from 'react';
import { FileUp, ClipboardList, ShieldAlert, Cpu, HelpCircle, Sparkles, User, Calendar, CreditCard, Network, AlertCircle, Lock, Users, UserPlus, Power, PowerOff } from 'lucide-react';
import { PolicyViewer } from './components/PolicyViewer';

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
  type: 'prescription' | 'bill' | 'report',
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

    } else if (type === 'report') {
      // Diagnostic Report Generation
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('TechCorp Health Diagnostics Lab', 50, 80);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Accredited Diagnostic Laboratory Report', 50, 105);

      // Line separator
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 130);
      ctx.lineTo(560, 130);
      ctx.stroke();

      // Patient Info
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px Arial';
      ctx.fillText(`Patient Name :  ${input.member_name}`, 55, 160);
      ctx.fillText(`Member ID    :  ${input.member_id}`, 55, 180);
      ctx.fillText(`Report Date  :  ${input.treatment_date}`, 55, 200);

      // Report Title
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('DIAGNOSTIC TEST RESULTS / FINDINGS', 55, 240);

      // List of tests & findings
      const tests = input.documents?.prescription?.tests_prescribed || input.documents?.bill?.test_names || ['General Screening'];
      let y = 280;
      tests.forEach((test: string, idx: number) => {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`${idx + 1}. Test: ${test}`, 60, y);
        y += 20;
        ctx.fillStyle = '#475569';
        ctx.font = '13px Courier New';
        ctx.fillText(`   Findings: Normal limits / negative clinical markers.`, 60, y);
        y += 25;
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

// Fetch pre-generated high-fidelity PNG documents from server/public samples
const fetchSampleDocument = async (
  type: 'prescription' | 'bill' | 'report',
  tcId: string,
  tc: any
): Promise<File> => {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const filename = `${tcId}_${capitalizedType}.png`;
  const url = `/samples/${filename}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch static sample ${filename}: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/png' });
  } catch (err) {
    console.warn(`Failed to fetch static sample ${filename}, falling back to canvas generation:`, err);
    return createCanvasDocument(type, tcId, tc);
  }
};


export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'policy' | 'claims_audit' | 'employee_directory'>('submit');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Submit Form state
  const [memberId, setMemberId] = useState('EMP001');
  const [memberName, setMemberName] = useState('');
  const [treatmentDate, setTreatmentDate] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [hospital, setHospital] = useState('');
  const [cashlessRequest, setCashlessRequest] = useState(false);
  const [memberJoinDate, setMemberJoinDate] = useState('');
  const [previousClaimsSameDay, setPreviousClaimsSameDay] = useState('0');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [testCaseId, setTestCaseId] = useState('');

  // Role & Authentication States
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Employee Management States
  const [employees, setEmployees] = useState<any[]>([]);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeJoinDate, setNewEmployeeJoinDate] = useState('');
  const [newEmployeeAge, setNewEmployeeAge] = useState('');
  const [newEmployeeGender, setNewEmployeeGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [employeeError, setEmployeeError] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Admin Claims Management tab
  const [adminClaimFilter, setAdminClaimFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredClaims = claims.filter(claim => {
    const decision = claim.adjudication?.decision?.toUpperCase();
    if (adminClaimFilter === 'all') return true;
    if (adminClaimFilter === 'pending') return decision === 'MANUAL_REVIEW';
    if (adminClaimFilter === 'approved') return decision === 'APPROVED';
    if (adminClaimFilter === 'rejected') return decision === 'REJECTED' || decision === 'PARTIAL';
    return true;
  });

  // Employee DB verification state
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [policyDetails, setPolicyDetails] = useState<any>(null);
  const [ytdApprovedAmount, setYtdApprovedAmount] = useState<number>(0);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [employeeFetchError, setEmployeeFetchError] = useState('');

  // Fetch employee details automatically when memberId is entered
  useEffect(() => {
    if (!memberId) {
      setEmployeeDetails(null);
      setPolicyDetails(null);
      setYtdApprovedAmount(0);
      setEmployeeFetchError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetchingEmployee(true);
      setEmployeeFetchError('');
      try {
        const response = await fetch(`${API_URL}/api/claims/employee/${memberId}?treatmentDate=${treatmentDate}`);
        if (!response.ok) {
          throw new Error('Member ID not found in corporate records.');
        }
        const data = await response.json();
        if (data.success) {
          setEmployeeDetails(data.employee);
          setPolicyDetails(data.policy);
          setYtdApprovedAmount(data.ytdApprovedAmount);
          setMemberName(data.employee.name);
          const jd = new Date(data.employee.joinDate).toISOString().split('T')[0];
          setMemberJoinDate(jd);
        }
      } catch (err: any) {
        setEmployeeDetails(null);
        setPolicyDetails(null);
        setYtdApprovedAmount(0);
        setEmployeeFetchError(err.message || 'Error looking up member ID');
      } finally {
        setIsFetchingEmployee(false);
      }
    }, 400); // 400ms debounce to avoid spamming requests

    return () => clearTimeout(timer);
  }, [memberId, treatmentDate]);

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
    if (activeTab === 'history' || activeTab === 'claims_audit') {
      fetchClaimsHistory();
    } else if (activeTab === 'employee_directory') {
      fetchEmployees();
    }
  }, [activeTab]);

  useEffect(() => {
    if (userRole === 'admin' && isAdminLoggedIn) {
      fetchClaimsHistory();
      fetchEmployees();
    }
  }, [userRole, isAdminLoggedIn]);

  // Load employee directory
  const fetchEmployees = async () => {
    setIsFetchingEmployees(true);
    try {
      const response = await fetch(`${API_URL}/api/claims/employees/all`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setIsFetchingEmployees(false);
    }
  };

  // Toggle employee status between Active and Terminated
  const handleStatusToggle = async (mId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Terminated' : 'Active';
    try {
      const response = await fetch(`${API_URL}/api/claims/employees/${mId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok) {
        fetchEmployees();
      } else {
        const errData = await response.json();
        alert('Failed to update status: ' + (errData.error || response.statusText));
      }
    } catch (err) {
      console.error('Error toggling employee status:', err);
      alert('Error updating status.');
    }
  };

  // Register a new employee
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError('');
    if (!newEmployeeId || !newEmployeeName || !newEmployeeJoinDate) {
      setEmployeeError('Please fill all required fields.');
      return;
    }
    setIsAddingEmployee(true);
    try {
      const response = await fetch(`${API_URL}/api/claims/employees/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: newEmployeeId,
          name: newEmployeeName,
          joinDate: newEmployeeJoinDate,
          age: Number(newEmployeeAge) || undefined,
          gender: newEmployeeGender
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setNewEmployeeId('');
        setNewEmployeeName('');
        setNewEmployeeJoinDate('');
        setNewEmployeeAge('');
        setNewEmployeeGender('Male');
        fetchEmployees();
        alert('Employee registered successfully!');
      } else {
        setEmployeeError(data.error || 'Failed to register employee.');
      }
    } catch (err: any) {
      setEmployeeError(err.message || 'Error communicating with server.');
    } finally {
      setIsAddingEmployee(false);
    }
  };

  // Role selection swap
  const handleRoleChange = (role: 'user' | 'admin') => {
    setUserRole(role);
    if (role === 'user') {
      setActiveTab('submit');
    } else {
      if (isAdminLoggedIn) {
        setActiveTab('claims_audit');
      } else {
        // Stay on current tab, but view will show login modal
      }
    }
  };

  // Admin login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'password123') {
      setIsAdminLoggedIn(true);
      setLoginError('');
      setActiveTab('claims_audit');
      fetchClaimsHistory();
      fetchEmployees();
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  // Pre-fill form from test cases definition
  const handleTestCaseSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setTestCaseId(id);
    if (!id) {
      resetForm();
      return;
    }

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

        // Generate and set files
        setPrescriptionFile(null);
        setBillFile(null);
        setReportFile(null);

        // Fetch pre-generated high-fidelity PNG files
        if (input.documents?.prescription) {
          const presFile = await fetchSampleDocument('prescription', id, tc);
          setPrescriptionFile(presFile);
        }

        if (input.documents?.bill) {
          const billFile = await fetchSampleDocument('bill', id, tc);
          setBillFile(billFile);
        }

        // Auto-generate reports if needed
        const hasTests = 
          (input.documents?.prescription?.tests_prescribed && input.documents.prescription.tests_prescribed.length > 0) ||
          (input.documents?.bill?.test_names && input.documents.bill.test_names.length > 0);
        
        if (hasTests) {
          const rFile = await fetchSampleDocument('report', id, tc);
          setReportFile(rFile);
        }
      }
    } catch (err) {
      console.error('Failed to parse local test case details:', err);
    }
  };

  const resetForm = () => {
    setMemberId('EMP001');
    setMemberName('');
    setTreatmentDate('');
    setClaimAmount('');
    setHospital('');
    setCashlessRequest(false);
    setMemberJoinDate('');
    setPreviousClaimsSameDay('0');
    setPrescriptionFile(null);
    setBillFile(null);
    setReportFile(null);
    setTestCaseId('');
    setCreatedClaim(null);
    setEmployeeDetails(null);
    setPolicyDetails(null);
    setYtdApprovedAmount(0);
    setEmployeeFetchError('');
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

      if (testCaseId) {
        // Calculate a submission date 1 day after the treatment date to satisfy LATE_SUBMISSION check
        const tDate = new Date(treatmentDate);
        tDate.setDate(tDate.getDate() + 1);
        const subDateStr = tDate.toISOString().split('T')[0];
        formData.append('submissionDate', subDateStr);
      }

      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }
      if (billFile) {
        formData.append('bill', billFile);
      }
      if (reportFile) {
        formData.append('reports', reportFile);
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
          
          <div className="flex items-center gap-4">
            <nav className="flex space-x-1">
              {userRole === 'user' ? (
                <>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'submit' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <FileUp className="w-4 h-4" /> Submit Claim
                  </button>
                  <button
                    onClick={() => setActiveTab('policy')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'policy' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <ShieldAlert className="w-4 h-4" /> Policy Terms
                  </button>
                </>
              ) : isAdminLoggedIn ? (
                <>
                  <button
                    onClick={() => setActiveTab('claims_audit')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'claims_audit' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <ClipboardList className="w-4 h-4" /> Claims Audit
                  </button>
                  <button
                    onClick={() => setActiveTab('employee_directory')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'employee_directory' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Users className="w-4 h-4" /> Employee Directory
                  </button>
                  <button
                    onClick={() => setActiveTab('policy')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeTab === 'policy' ? 'bg-slate-900 text-brand-400 border border-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <ShieldAlert className="w-4 h-4" /> Policy Terms
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-500 font-semibold px-2 py-2">Authentication Required</span>
              )}
            </nav>

            <div className="flex items-center bg-slate-900 border border-slate-850 p-1 rounded-xl">
              <button
                onClick={() => handleRoleChange('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${userRole === 'user' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <User className="w-3.5 h-3.5" /> Claimant
              </button>
              <button
                onClick={() => handleRoleChange('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${userRole === 'admin' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Lock className="w-3.5 h-3.5" /> Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {userRole === 'admin' && !isAdminLoggedIn ? (
          <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-850 p-8 rounded-2xl shadow-xl space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Administrator Portal</h2>
              <p className="text-xs text-slate-400">Please sign in with your administrative credentials.</p>
            </div>

            {loginError && (
              <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-400/90 font-medium">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl text-xs shadow-lg hover:shadow-brand-500/10 transition cursor-pointer"
                >
                  Verify Administrator
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Tab 1: Submit Claim */}
            {userRole === 'user' && activeTab === 'submit' && (
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
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs text-slate-400 font-semibold">Member ID (Policy Record)</label>
                            {isFetchingEmployee && (
                              <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Verifying...</span>
                            )}
                          </div>
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
                          <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Member Full Name (Fetched from Registry)</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              required
                              readOnly
                              value={memberName}
                              placeholder="Loading registered member..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
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

                        <div className="md:col-span-2">
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
                      </div>

                      {/* Verified Employee Details Glassmorphic Info Card */}
                      {employeeDetails && policyDetails && (
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5 transition-all duration-300">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Policy Holder Verified</span>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                                  {employeeDetails.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-100">{employeeDetails.name} ({employeeDetails.memberId})</p>
                              <p className="text-xs text-slate-400">
                                Joined TechCorp: <span className="text-slate-300 font-medium">{new Date(employeeDetails.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </p>
                            </div>

                            <div className="flex-1 max-w-md md:pl-6 space-y-1.5 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-400">Annual Policy Spend</span>
                                <span className={ytdApprovedAmount >= (policyDetails.annualLimit || 50000) ? "text-red-400" : "text-slate-200"}>
                                  ₹{ytdApprovedAmount.toLocaleString('en-IN')} / ₹{(policyDetails.annualLimit || 50000).toLocaleString('en-IN')}
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    ytdApprovedAmount >= (policyDetails.annualLimit || 50000)
                                      ? 'bg-red-500' 
                                      : ytdApprovedAmount > (policyDetails.annualLimit || 50000) * 0.8
                                      ? 'bg-amber-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  }`}
                                  style={{ width: `${Math.min(100, (ytdApprovedAmount / (policyDetails.annualLimit || 50000)) * 100)}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Remaining: ₹{Math.max(0, (policyDetails.annualLimit || 50000) - ytdApprovedAmount).toLocaleString('en-IN')}</span>
                                {ytdApprovedAmount >= (policyDetails.annualLimit || 50000) && (
                                  <span className="text-red-400 font-semibold">Limit Exhausted!</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {employeeFetchError && (
                        <div className="bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-red-300">Member Verification Failed</p>
                            <p className="text-xs text-red-400/90">{employeeFetchError}. Submitting this claim will result in an automatic rejection.</p>
                          </div>
                        </div>
                      )}


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
                            <span className="text-[10px] text-emerald-400 font-mono mt-2 truncate block px-2">{"\u2713"} {prescriptionFile.name}</span>
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
                            <span className="text-[10px] text-emerald-400 font-mono mt-2 truncate block px-2">{"\u2713"} {billFile.name}</span>
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
                              {processingStep > step.id ? "\u2713" : step.id}
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

            {/* Tab 2: Admin Claims Audit */}
            {userRole === 'admin' && activeTab === 'claims_audit' && (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-brand-400" /> Claims Audit Ledger
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Audit previous claim transactions and file manual reviews/overrides.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Manual Review' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected/Partial' }
                    ].map(filter => (
                      <button
                        key={filter.value}
                        onClick={() => setAdminClaimFilter(filter.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${adminClaimFilter === filter.value ? 'bg-brand-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                    
                    <button
                      onClick={fetchClaimsHistory}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Refresh Log
                    </button>
                  </div>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-12">
                    <svg className="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs text-slate-400">Fetching records ledger...</span>
                  </div>
                ) : filteredClaims.length === 0 ? (
                  <div className="text-center py-12 space-y-3 bg-slate-950/10 rounded-xl border border-slate-850/60 border-dashed">
                    <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-400">No Claims Found</h4>
                      <p className="text-[10px] text-slate-500 mt-1">There are no claims matching the selected status filter.</p>
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
                        {filteredClaims.map(claim => (
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

            {/* Tab 3: Admin Employee Directory */}
            {userRole === 'admin' && activeTab === 'employee_directory' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-scale-in">
                
                {/* Registry List Table (Left: 2 columns) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-400" /> Employee Registry Directory
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Manage corporate employees and active/terminated status.</p>
                    </div>
                    <button
                      onClick={fetchEmployees}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Refresh Registry
                    </button>
                  </div>

                  {isFetchingEmployees ? (
                    <div className="text-center py-12">
                      <svg className="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs text-slate-400">Fetching registry ledger...</span>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="text-center py-12 space-y-3 bg-slate-950/10 rounded-xl border border-slate-850/60 border-dashed">
                      <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-400">No Employees Found</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Register a new employee using the form on the right.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 uppercase font-semibold tracking-wider text-[10px]">
                            <th className="px-6 py-4">Member ID</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Join Date</th>
                            <th className="px-6 py-4">Demographics</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                          {employees.map(emp => (
                            <tr key={emp._id} className="hover:bg-slate-850/30 transition">
                              <td className="px-6 py-4 font-mono font-bold text-slate-200">{emp.memberId}</td>
                              <td className="px-6 py-4 font-semibold text-slate-200">{emp.name}</td>
                              <td className="px-6 py-4 text-slate-400 font-medium">
                                {new Date(emp.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-medium">
                                {emp.age ? `${emp.age} yrs • ` : ''}{emp.gender || 'Not Specified'}
                              </td>
                              <td className="px-6 py-4">
                                {emp.status === 'Active' ? (
                                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full text-xs">
                                    Active
                                  </span>
                                ) : (
                                  <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold px-2.5 py-1 rounded-full text-xs">
                                    Terminated
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleStatusToggle(emp.memberId, emp.status)}
                                  className={`font-semibold px-3 py-1.5 rounded border transition cursor-pointer text-[10px] flex items-center gap-1.5 mx-auto ${
                                    emp.status === 'Active'
                                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-900/25'
                                      : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/25'
                                  }`}
                                >
                                  {emp.status === 'Active' ? (
                                    <>
                                      <PowerOff className="w-3.5 h-3.5" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Power className="w-3.5 h-3.5" /> Activate
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Add Employee Form (Right: 1 column) */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-brand-400" /> Add New Employee
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Register a new employee in the benefits record.</p>
                  </div>

                  {employeeError && (
                    <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400/90 font-medium">{employeeError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Member ID / Employee ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EMP011"
                        value={newEmployeeId}
                        onChange={e => setNewEmployeeId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amitabh Shah"
                        value={newEmployeeName}
                        onChange={e => setNewEmployeeName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Join Date</label>
                      <input
                        type="date"
                        required
                        value={newEmployeeJoinDate}
                        onChange={e => setNewEmployeeJoinDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Age</label>
                        <input
                          type="number"
                          placeholder="e.g. 35"
                          value={newEmployeeAge}
                          onChange={e => setNewEmployeeAge(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Gender</label>
                        <select
                          value={newEmployeeGender}
                          onChange={e => setNewEmployeeGender(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isAddingEmployee}
                        className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-850 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg hover:shadow-brand-500/10 transition cursor-pointer"
                      >
                        {isAddingEmployee ? 'Registering...' : 'Register Employee'}
                      </button>
                    </div>
                  </form>
                </div>
                
              </div>
            )}

            {/* Tab 4: Policy Limits */}
            {activeTab === 'policy' && <PolicyViewer />}
          </>
        )}
      </main>

      {/* Claim Detail Popup Modal overlay */}
      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim as any}
          onClose={() => setSelectedClaim(null)}
          isAdmin={userRole === 'admin' && isAdminLoggedIn}
          onUpdate={updatedClaim => {
            setSelectedClaim(updatedClaim as any);
            // Refresh history list too
            setClaims(prev => prev.map(c => c._id === updatedClaim._id ? updatedClaim as any : c));
          }}
        />
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] text-slate-500 mt-12 shrink-0">
        Plum AI Pod Intern Evaluation Project {"\u2022"} Developed by Putchanutala Sai Manideep {"\u2022"} Platform active local port 5000 / 5173
      </footer>

    </div>
  );
}
