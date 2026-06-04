const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  claimId: {
    type: String,
    required: true,
    unique: true
  },
  memberId: {
    type: String,
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  treatmentDate: {
    type: Date,
    required: true
  },
  claimAmount: {
    type: Number,
    required: true
  },
  hospital: {
    type: String
  },
  cashlessRequest: {
    type: Boolean,
    default: false
  },
  preAuthId: {
    type: String,
    default: ''
  },
  documents: {
    prescription: {
      url: String,
      filename: String,
      extractedText: String
    },
    bill: {
      url: String,
      filename: String,
      extractedText: String
    },
    reports: [{
      url: String,
      filename: String,
      extractedText: String
    }]
  },
  extractedData: {
    patientName: String,
    hospitalName: String,
    doctorName: String,
    doctorReg: String,
    consultationDate: Date,
    claimAmount: Number,
    consultationFee: Number,
    medicines: [String],
    tests: [String],
    procedures: [String],
    diagnosis: String,
    claimType: String // e.g. "OPD", "Dental", "Vision", "Alternative"
  },
  adjudication: {
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'PARTIAL', 'MANUAL_REVIEW'],
      required: true
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    deductions: {
      copay: { type: Number, default: 0 },
      networkDiscount: { type: Number, default: 0 },
      limitExceeded: { type: Number, default: 0 },
      excludedItemsDetails: [{
        item: String,
        amount: Number,
        reason: String
      }]
    },
    rejectedItems: [String],
    rejectionReasons: [String],
    flags: [String],
    notes: String,
    nextSteps: String,
    confidenceScore: {
      type: Number,
      default: 1.0
    }
  },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'partial', 'manual_review'],
    default: 'submitted'
  },
  appealHistory: [{
    date: { type: Date, default: Date.now },
    reason: String,
    status: String,
    reviewerNotes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Claim', ClaimSchema);
