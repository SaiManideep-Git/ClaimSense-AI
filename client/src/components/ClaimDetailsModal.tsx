import React, { useState } from 'react';
import { X, FileText, CheckCircle, AlertTriangle, AlertCircle, ArrowRight, ShieldCheck, CornerDownRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ClaimDetails {
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
  extractedData?: {
    patientName?: string;
    hospitalName?: string;
    doctorName?: string;
    doctorReg?: string;
    consultationDate?: string;
    claimAmount?: number;
    consultationFee?: number;
    medicines?: string[];
    tests?: string[];
    procedures?: string[];
    diagnosis?: string;
    claimType?: string;
  };
  adjudication: {
    decision: 'APPROVED' | 'REJECTED' | 'PARTIAL' | 'MANUAL_REVIEW';
    approvedAmount: number;
    deductions: {
      copay: number;
      networkDiscount: number;
      limitExceeded: number;
      excludedItemsDetails?: Array<{ item: string; amount: number; reason: string }>;
    };
    rejectedItems: string[];
    rejectionReasons: string[];
    flags: string[];
    notes: string;
    nextSteps: string;
    confidenceScore: number;
  };
  appealHistory?: Array<{
    date: string;
    reason: string;
    status: string;
    reviewerNotes: string;
  }>;
}

interface Props {
  claim: ClaimDetails;
  onClose: () => void;
  onUpdate: (updatedClaim: ClaimDetails) => void;
}

export const ClaimDetailsModal: React.FC<Props> = ({ claim, onClose, onUpdate }) => {
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      const response = await fetch(`${API_URL}/api/claims/${claim._id}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: appealReason }),
      });
      const data = await response.json();
      onUpdate(data);
      setShowAppealForm(false);
      setAppealReason('');
    } catch (err) {
      console.error('Failed to submit appeal:', err);
      alert('Error submitting appeal. Please try again.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> };
      case 'PARTIAL':
        return { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: <AlertCircle className="w-5 h-5 text-amber-400" /> };
      case 'MANUAL_REVIEW':
        return { bg: 'bg-brand-500/10 border-brand-500/30 text-brand-400', icon: <AlertTriangle className="w-5 h-5 text-brand-400" /> };
      case 'REJECTED':
      default:
        return { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', icon: <X className="w-5 h-5 text-rose-400" /> };
    }
  };

  const styles = getDecisionStyles(claim.adjudication.decision);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Claim Details</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-200">{claim.claimId}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Submitted by {claim.memberName} ({claim.memberId})</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-850 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* Status Alert Banner */}
          <div className={`border rounded-xl p-5 ${styles.bg} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{styles.icon}</div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold block opacity-60">Adjudication Outcome</span>
                <span className="text-lg font-bold block">{claim.adjudication.decision}</span>
                <p className="text-xs mt-1 text-slate-300 font-medium leading-relaxed">{claim.adjudication.notes}</p>
              </div>
            </div>
            
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/40 min-w-[140px] text-right md:shrink-0">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Approved Amount</span>
              <span className="text-2xl font-bold text-slate-100 block font-mono">₹{claim.adjudication.approvedAmount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Original: ₹{claim.claimAmount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Input Claims & Document Previews */}
            <div className="space-y-6">
              
              {/* Claim context info */}
              <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">Claim Metadata</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Treatment Date:</span>
                    <span className="font-semibold text-slate-200">{new Date(claim.treatmentDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hospital/Clinic:</span>
                    <span className="font-semibold text-slate-200 truncate block">{claim.hospital || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cashless Request:</span>
                    <span className="font-semibold text-slate-200">{claim.cashlessRequest ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">System Confidence:</span>
                    <span className="font-mono text-slate-200">{(claim.adjudication.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">Submitted Documents</h3>
                <div className="space-y-2">
                  
                  {claim.documents.prescription && (
                    <a
                      href={claim.documents.prescription.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-brand-500/40 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-400 group-hover:text-brand-300" />
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">Prescription Doc</span>
                      </div>
                      <span className="text-[10px] text-slate-500 hover:text-slate-300 font-mono">View Original</span>
                    </a>
                  )}

                  {claim.documents.bill && (
                    <a
                      href={claim.documents.bill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-brand-500/40 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">Invoice Bill</span>
                      </div>
                      <span className="text-[10px] text-slate-500 hover:text-slate-300 font-mono">View Original</span>
                    </a>
                  )}

                  {claim.documents.reports && claim.documents.reports.map((rep, idx) => (
                    <a
                      key={rep.filename}
                      href={rep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-brand-500/40 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">Report {idx + 1}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 hover:text-slate-300 font-mono">View Original</span>
                    </a>
                  ))}

                </div>
              </div>

            </div>

            {/* Right Column: AI Extracted Details */}
            <div className="space-y-6">
              <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">AI Structured Extraction</h3>
                
                {claim.extractedData ? (
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Extracted Patient:</span>
                      <span className="font-semibold text-slate-200">{claim.extractedData.patientName || 'Not found'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Doctor / Consultant:</span>
                      <span className="font-semibold text-slate-200">{claim.extractedData.doctorName || 'Not found'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Doctor Reg No:</span>
                      <span className="font-semibold text-brand-400 font-mono">{claim.extractedData.doctorReg || 'Not found'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Medical Diagnosis:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[220px]">{claim.extractedData.diagnosis || 'Not found'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Claim Category Type:</span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono border border-brand-500/15">{claim.extractedData.claimType || 'OPD'}</span>
                    </div>

                    {/* Prescribed Items Lists */}
                    {claim.extractedData.medicines && claim.extractedData.medicines.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-500 block mb-1">Prescribed Medicines:</span>
                        <div className="flex flex-wrap gap-1">
                          {claim.extractedData.medicines.map(m => (
                            <span key={m} className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800 text-[10px]">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.extractedData.tests && claim.extractedData.tests.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-500 block mb-1">Diagnostic Checks:</span>
                        <div className="flex flex-wrap gap-1">
                          {claim.extractedData.tests.map(t => (
                            <span key={t} className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800 text-[10px]">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.extractedData.procedures && claim.extractedData.procedures.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-500 block mb-1">Clinical Procedures:</span>
                        <div className="flex flex-wrap gap-1">
                          {claim.extractedData.procedures.map(p => (
                            <span key={p} className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800 text-[10px]">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No extraction details stored.</p>
                )}
              </div>
            </div>

          </div>

          {/* Adjudication Rules Audit Trail */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">Policy Deductions Breakdown</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Gross Claimed Amount:</span>
                <span className="font-semibold text-slate-300 font-mono">₹{claim.claimAmount}</span>
              </div>
              
              {claim.adjudication.deductions.networkDiscount > 0 && (
                <div className="flex justify-between border-b border-slate-900 pb-1 text-emerald-400">
                  <span className="text-slate-500 font-medium">Minus Network Hospital Discount (20%):</span>
                  <span className="font-semibold font-mono">-₹{claim.adjudication.deductions.networkDiscount}</span>
                </div>
              )}

              {claim.adjudication.deductions.copay > 0 && (
                <div className="flex justify-between border-b border-slate-900 pb-1 text-amber-400">
                  <span className="text-slate-500 font-medium">Minus Patient Co-payment (10%):</span>
                  <span className="font-semibold font-mono">-₹{claim.adjudication.deductions.copay}</span>
                </div>
              )}

              {claim.adjudication.deductions.excludedItemsDetails && claim.adjudication.deductions.excludedItemsDetails.length > 0 && (
                <div className="space-y-1 pb-1">
                  <span className="text-slate-500 block">Excluded Itemized Rejections:</span>
                  {claim.adjudication.deductions.excludedItemsDetails.map(detail => (
                    <div key={detail.item} className="flex justify-between pl-3 text-rose-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-slate-500" /> {detail.item} ({detail.reason})
                      </span>
                      <span className="font-mono font-semibold">-₹{detail.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
                <span className="text-slate-200 font-bold">Net Payable Amount:</span>
                <span className="font-bold text-emerald-400 font-mono">₹{claim.adjudication.approvedAmount}</span>
              </div>
            </div>
          </div>

          {/* Rejection / Actionable Instructions */}
          {claim.adjudication.rejectionReasons && claim.adjudication.rejectionReasons.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-2">
              <span className="text-xs uppercase tracking-wider text-rose-400 font-bold block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Policy Exclusions / Failure Rules
              </span>
              <ul className="list-disc pl-4 text-xs text-rose-300 space-y-1">
                {claim.adjudication.rejectionReasons.map(reason => (
                  <li key={reason}>
                    <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded font-mono text-[10px] text-rose-400 mr-2">{reason}</code>
                    {reason === 'POLICY_INACTIVE' && 'The treatment date occurred prior to policy start date.'}
                    {reason === 'WAITING_PERIOD' && 'The treatment was completed within the initial waiting window or ailment waiting period.'}
                    {reason === 'MISSING_DOCUMENTS' && 'Required doctor prescription or final bills were missing from upload.'}
                    {reason === 'DOCTOR_REG_INVALID' && 'The prescribing physician\'s registration could not be verified on the stamp/document.'}
                    {reason === 'SERVICE_NOT_COVERED' && 'The treatment category (e.g. Weight loss diet) is not covered under the employee benefit.'}
                    {reason === 'COSMETIC_PROCEDURE' && 'The procedure was classified as aesthetic/cosmetic in nature.'}
                    {reason === 'PRE_AUTH_MISSING' && 'Diagnostic scans exceeding ₹10000 limit require prior cashless authorization approvals.'}
                    {reason === 'PER_CLAIM_EXCEEDED' && 'Single OPD claims cannot exceed the standard ₹5000 policy threshold.'}
                    {reason === 'BELOW_MIN_AMOUNT' && 'Claim amount is lower than the minimum ₹500 reimbursement ticket size.'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Appeals and Manual Review Section */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">Manual Appeal Workflow</h3>
            
            {claim.appealHistory && claim.appealHistory.length > 0 ? (
              <div className="space-y-3">
                <span className="text-slate-400 text-xs font-semibold block">Appeal Log:</span>
                {claim.appealHistory.map((appeal, index) => (
                  <div key={index} className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Submitted: {new Date(appeal.date).toLocaleDateString()}</span>
                      <span className="bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-brand-500/15">
                        {appeal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-300 italic">"{appeal.reason}"</p>
                    <p className="text-[11px] text-slate-400 border-t border-slate-800/40 pt-1.5 mt-1 flex items-start gap-1">
                      <span className="font-semibold text-brand-400">Auditor Status:</span> {appeal.reviewerNotes}
                    </p>
                  </div>
                ))}
              </div>
            ) : claim.adjudication.decision !== 'APPROVED' ? (
              <div>
                {!showAppealForm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                      Disapprove of this adjudication result? You can appeal this decision for manual review by our benefits team.
                    </p>
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer shrink-0"
                    >
                      File an Appeal
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAppealSubmit} className="space-y-3">
                    <textarea
                      placeholder="Explain why this claim should be approved. (e.g. 'Doctor prescribed supplements for Vitamin D deficiency of level 12ng/ml...')"
                      value={appealReason}
                      onChange={e => setAppealReason(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowAppealForm(false)}
                        className="bg-slate-800 text-slate-300 font-semibold px-3 py-1.5 rounded hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAppeal}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-1.5 rounded disabled:bg-brand-800 cursor-pointer flex items-center gap-1"
                      >
                        {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> This claim has been fully processed and approved. No actions required.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-right shrink-0">
          <button onClick={onClose} className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};
