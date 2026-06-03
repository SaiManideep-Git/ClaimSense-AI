import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, Percent, DollarSign, Building } from 'lucide-react';

interface PolicyDetails {
  policy_id: string;
  policy_name: string;
  effective_date: string;
  policy_holder: {
    company: string;
    employees_covered: number;
    dependents_covered: boolean;
  };
  coverage_details: {
    annual_limit: number;
    per_claim_limit: number;
    family_floater_limit: number;
    consultation_fees: {
      covered: boolean;
      sub_limit: number;
      copay_percentage: number;
      network_discount: number;
    };
    diagnostic_tests: {
      covered: boolean;
      sub_limit: number;
      covered_tests: string[];
    };
    pharmacy: {
      covered: boolean;
      sub_limit: number;
      generic_drugs_mandatory: boolean;
      branded_drugs_copay: number;
    };
    dental: {
      covered: boolean;
      sub_limit: number;
      routine_checkup_limit: number;
      procedures_covered: string[];
      cosmetic_procedures: boolean;
    };
    vision: {
      covered: boolean;
      sub_limit: number;
      eye_test_covered: boolean;
      glasses_contact_lenses: boolean;
      lasik_surgery: boolean;
    };
    alternative_medicine: {
      covered: boolean;
      sub_limit: number;
      covered_treatments: string[];
      therapy_sessions_limit: number;
    };
  };
  waiting_periods: {
    initial_waiting: number;
    pre_existing_diseases: number;
    maternity: number;
    specific_ailments: {
      [key: string]: number;
    };
  };
  exclusions: string[];
  network_hospitals: string[];
}

export const PolicyViewer: React.FC = () => {
  // Hardcoded matching default policy config for visual representation
  const policy: PolicyDetails = {
    policy_id: "PLUM_OPD_2024",
    policy_name: "Plum OPD Advantage",
    effective_date: "2024-01-01",
    policy_holder: {
      company: "TechCorp Solutions Pvt Ltd",
      employees_covered: 500,
      dependents_covered: true
    },
    coverage_details: {
      annual_limit: 50000,
      per_claim_limit: 5000,
      family_floater_limit: 150000,
      consultation_fees: {
        covered: true,
        sub_limit: 2000,
        copay_percentage: 10,
        network_discount: 20
      },
      diagnostic_tests: {
        covered: true,
        sub_limit: 10000,
        covered_tests: [
          "Blood tests",
          "Urine tests",
          "X-rays",
          "ECG",
          "Ultrasound",
          "MRI (with pre-auth)",
          "CT Scan (with pre-auth)"
        ]
      },
      pharmacy: {
        covered: true,
        sub_limit: 15000,
        generic_drugs_mandatory: true,
        branded_drugs_copay: 30
      },
      dental: {
        covered: true,
        sub_limit: 10000,
        routine_checkup_limit: 2000,
        procedures_covered: [
          "Filling",
          "Extraction",
          "Root canal",
          "Cleaning"
        ],
        cosmetic_procedures: false
      },
      vision: {
        covered: true,
        sub_limit: 5000,
        eye_test_covered: true,
        glasses_contact_lenses: true,
        lasik_surgery: false
      },
      alternative_medicine: {
        covered: true,
        sub_limit: 8000,
        covered_treatments: [
          "Ayurveda",
          "Homeopathy",
          "Unani"
        ],
        therapy_sessions_limit: 20
      }
    },
    waiting_periods: {
      initial_waiting: 30,
      pre_existing_diseases: 365,
      maternity: 270,
      specific_ailments: {
        diabetes: 90,
        hypertension: 90,
        joint_replacement: 730
      }
    },
    exclusions: [
      "Cosmetic procedures",
      "Weight loss treatments",
      "Infertility treatments",
      "Experimental treatments",
      "Self-inflicted injuries",
      "Adventure sports injuries",
      "War and nuclear risks",
      "HIV/AIDS treatment",
      "Alcoholism/drug abuse treatment",
      "Non-allopathic treatments (except listed)",
      "Vitamins and supplements (unless prescribed for deficiency)"
    ],
    network_hospitals: [
      "Apollo Hospitals",
      "Fortis Healthcare",
      "Max Healthcare",
      "Manipal Hospitals",
      "Narayana Health"
    ]
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-950 via-slate-900 to-brand-950 border border-brand-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm mb-1 uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Active Policy Terms
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{policy.policy_name}</h1>
            <p className="text-slate-400 text-sm mt-1">ID: {policy.policy_id} • Effective from {policy.effective_date}</p>
          </div>
          <div className="text-left md:text-right bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase block font-semibold">Policy Holder</span>
            <span className="text-slate-200 font-medium text-sm block">{policy.policy_holder.company}</span>
            <span className="text-xs text-slate-400 mt-1 block">{policy.policy_holder.employees_covered} Employees covered • Dependents Included</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Limits & Deductions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Coverage Categories & Limits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Consultation Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">General OPD & Consultation</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Per-claim limit:</span>
                  <span className="font-semibold text-slate-200">₹{policy.coverage_details.per_claim_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consultation Sub-limit:</span>
                  <span className="font-semibold text-slate-200">₹{policy.coverage_details.consultation_fees.sub_limit}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded mt-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-brand-400" /> Co-pay:
                  </span>
                  <span className="font-semibold text-brand-400">{policy.coverage_details.consultation_fees.copay_percentage}% on Non-Network</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" /> Discount:
                  </span>
                  <span className="font-semibold text-emerald-400">{policy.coverage_details.consultation_fees.network_discount}% at Network Hospitals</span>
                </div>
              </div>
            </div>

            {/* Dental Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">Dental Care</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Sub-limit:</span>
                  <span className="font-semibold text-slate-200 font-mono">₹{policy.coverage_details.dental.sub_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Routine Checkup Limit:</span>
                  <span className="font-semibold text-slate-200">₹{policy.coverage_details.dental.routine_checkup_limit}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 bg-slate-950/40 p-2 rounded">
                  <span className="font-semibold block mb-1">Covered Procedures:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {policy.coverage_details.dental.procedures_covered.map(p => (
                      <span key={p} className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800 text-[10px]">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostics Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">Diagnostic Tests</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Sub-limit:</span>
                  <span className="font-semibold text-slate-200 font-mono">₹{policy.coverage_details.diagnostic_tests.sub_limit}</span>
                </div>
                <div className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded">
                  <span className="font-semibold block mb-1">Covered Tests:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {policy.coverage_details.diagnostic_tests.covered_tests.map(t => (
                      <span key={t} className={`px-2 py-0.5 rounded text-[10px] border ${t.includes('pre-auth') ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pharmacy Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">Pharmacy & Medicines</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Sub-limit:</span>
                  <span className="font-semibold text-slate-200 font-mono">₹{policy.coverage_details.pharmacy.sub_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Generic Drugs Mandatory:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">Yes</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded text-xs mt-2">
                  <span className="text-slate-400">Branded Drugs Copay:</span>
                  <span className="font-semibold text-amber-400">{policy.coverage_details.pharmacy.branded_drugs_copay}%</span>
                </div>
              </div>
            </div>

            {/* Vision Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">Vision / Eye Care</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Sub-limit:</span>
                  <span className="font-semibold text-slate-200">₹{policy.coverage_details.vision.sub_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Glasses & Lenses:</span>
                  <span className="font-semibold text-emerald-400">Covered</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lasik Surgery:</span>
                  <span className="font-semibold text-rose-400">Excluded</span>
                </div>
              </div>
            </div>

            {/* Alternative Medicine Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl hover:border-brand-500/40 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-brand-300 font-semibold text-sm uppercase tracking-wide">Alternative Medicine</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Covered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Sub-limit:</span>
                  <span className="font-semibold text-slate-200">₹{policy.coverage_details.alternative_medicine.sub_limit}</span>
                </div>
                <div className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded">
                  <span className="font-semibold block mb-1">Covered Treatments:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {policy.coverage_details.alternative_medicine.covered_treatments.map(t => (
                      <span key={t} className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800 text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Exclusions & Waiting Periods */}
        <div className="space-y-6">
          
          {/* Waiting Periods */}
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" /> Waiting Periods
            </h2>
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <div>
                  <span className="text-slate-200 font-semibold text-sm block">Initial Waiting Period</span>
                  <span className="text-xs text-slate-500">Applicable to all new members</span>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold font-mono">
                  {policy.waiting_periods.initial_waiting} Days
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <div>
                  <span className="text-slate-200 font-semibold text-sm block">Diabetes / Hypertension</span>
                  <span className="text-xs text-slate-500">Specific chronic conditions</span>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold font-mono">
                  {policy.waiting_periods.specific_ailments.diabetes} Days
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <div>
                  <span className="text-slate-200 font-semibold text-sm block">Pre-Existing Diseases</span>
                  <span className="text-xs text-slate-500">Any disease declared at join</span>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold font-mono">
                  {policy.waiting_periods.pre_existing_diseases} Days
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-slate-200 font-semibold text-sm block">Maternity Coverage</span>
                  <span className="text-xs text-slate-500">Pregnancy & delivery costs</span>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold font-mono">
                  {policy.waiting_periods.maternity} Days
                </span>
              </div>
            </div>
          </div>

          {/* Network Hospitals */}
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-brand-400" /> Network Providers
            </h2>
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl">
              <p className="text-xs text-slate-400 mb-3">Treated at network hospitals triggers 20% discount on claims.</p>
              <div className="space-y-2">
                {policy.network_hospitals.map(h => (
                  <div key={h} className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-200">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Exclusions List */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400" /> Excluded Treatments (Permanent Exclusions)
        </h2>
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {policy.exclusions.map(ex => (
              <div key={ex} className="flex items-start gap-2 text-slate-300 text-xs py-1">
                <span className="text-rose-400 font-bold select-none shrink-0">•</span>
                <span>{ex}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
