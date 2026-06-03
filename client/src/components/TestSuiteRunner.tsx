import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock, Award, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface TestCaseResult {
  caseId: string;
  caseName: string;
  description: string;
  input: {
    member_id: string;
    member_name: string;
    treatment_date: string;
    claim_amount: number;
    diagnosis?: string;
  };
  expected: {
    decision: string;
    approved_amount?: number;
    rejection_reasons?: string[];
  };
  actual: {
    decision: string;
    approvedAmount: number;
    rejectionReasons: string[];
    notes: string;
  };
  passed: boolean;
  elapsedMs: string;
}

interface TestSuiteSummary {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  accuracyPercentage: string;
}

export const TestSuiteRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed'>('all');

  const runTestSuite = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('http://localhost:5000/api/claims/test-suite/run');
      const data = await response.json();
      setSummary(data.summary);
      setResults(data.results);
    } catch (err) {
      console.error('Failed to run test suite:', err);
      alert('Error running test suite. Make sure your server is running on port 5000.');
    } finally {
      setIsRunning(false);
    }
  };

  const filteredResults = results.filter(r => {
    if (activeTab === 'passed') return r.passed;
    if (activeTab === 'failed') return !r.passed;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Run Controller Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border border-brand-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm mb-1 uppercase tracking-wider">
              <Cpu className="w-4 h-4" /> AI Adjudication Validator
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Deterministic Policy Evaluation</h1>
            <p className="text-slate-400 text-sm mt-1">
              Verify rules engine logic against 10 pre-defined claim scenarios (approved, rejected, copay, network discount, fraud).
            </p>
          </div>
          <button
            onClick={runTestSuite}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-brand-500/20 transition-all cursor-pointer select-none shrink-0"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Evaluating Rules...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" /> Run Verification Test Suite
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase block font-semibold">Total Scenarios</span>
              <span className="text-2xl font-bold text-slate-200 mt-1">{summary.totalCases}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg">
              <Cpu className="w-6 h-6 text-brand-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase block font-semibold">Passed Checks</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1">{summary.passedCases}</span>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase block font-semibold">Failed Rules</span>
              <span className="text-2xl font-bold text-rose-400 mt-1">{summary.failedCases}</span>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <XCircle className="w-6 h-6 text-rose-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-900/40 p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase block font-semibold">System Accuracy</span>
              <span className="text-2xl font-bold text-brand-400 mt-1">{summary.accuracyPercentage}%</span>
            </div>
            <div className="bg-brand-500/15 p-3 rounded-lg border border-brand-500/35 animate-pulse-slow">
              <Award className="w-6 h-6 text-brand-400" />
            </div>
          </div>

        </div>
      )}

      {/* Results Tab Controls */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-pointer transition ${activeTab === 'all' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Cases ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('passed')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-pointer transition ${activeTab === 'passed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' : 'text-slate-400 hover:text-emerald-400'}`}
              >
                Passed ({results.filter(r => r.passed).length})
              </button>
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-pointer transition ${activeTab === 'failed' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/35' : 'text-slate-400 hover:text-rose-400'}`}
              >
                Failed ({results.filter(r => !r.passed).length})
              </button>
            </div>
            <div className="text-slate-500 text-xs flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Accuracy Target: 100%
            </div>
          </div>

          {/* Test Case Cards */}
          <div className="space-y-4">
            {filteredResults.map(res => (
              <div
                key={res.caseId}
                className={`bg-slate-900 border ${res.passed ? 'border-slate-850/80 hover:border-emerald-500/30' : 'border-rose-500/35 bg-rose-950/5'} rounded-xl p-5 transition`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">{res.caseId}</span>
                      <h3 className="font-bold text-slate-200">{res.caseName}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{res.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {res.elapsedMs}ms
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${res.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {res.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" /> Mismatch
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  
                  {/* Expected Output */}
                  <div className="space-y-2 text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block">Expected Output</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Decision:</span>
                        <span className={`font-bold ${res.expected.decision === 'APPROVED' ? 'text-emerald-400' : res.expected.decision === 'PARTIAL' ? 'text-amber-400' : res.expected.decision === 'MANUAL_REVIEW' ? 'text-brand-400' : 'text-rose-400'}`}>{res.expected.decision}</span>
                      </div>
                      {res.expected.approved_amount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Approved Amount:</span>
                          <span className="font-semibold text-slate-300">₹{res.expected.approved_amount}</span>
                        </div>
                      )}
                      {res.expected.rejection_reasons && (
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400">Reason Codes:</span>
                          <span className="font-mono text-slate-300">{res.expected.rejection_reasons.join(', ') || 'None'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actual Output */}
                  <div className="space-y-2 text-xs border-t md:border-t-0 md:border-l border-slate-800 md:pl-4">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block">Actual Rules Output</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Decision:</span>
                        <span className={`font-bold ${res.actual.decision === 'APPROVED' ? 'text-emerald-400' : res.actual.decision === 'PARTIAL' ? 'text-amber-400' : res.actual.decision === 'MANUAL_REVIEW' ? 'text-brand-400' : 'text-rose-400'}`}>{res.actual.decision}</span>
                      </div>
                      {res.expected.approved_amount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Approved Amount:</span>
                          <span className="font-semibold text-slate-300">₹{res.actual.approvedAmount}</span>
                        </div>
                      )}
                      {res.actual.rejectionReasons.length > 0 ? (
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400">Reason Codes:</span>
                          <span className="font-mono text-slate-300">{res.actual.rejectionReasons.join(', ')}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reason Codes:</span>
                          <span className="text-slate-500 font-mono">None</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="text-xs text-slate-400 mt-3 flex items-start gap-1 bg-slate-950/20 p-2.5 rounded border border-slate-850/40">
                  <span className="font-semibold text-brand-400 shrink-0">Explanation:</span>
                  <span>{res.actual.notes || 'Matches expected rules outcome.'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
