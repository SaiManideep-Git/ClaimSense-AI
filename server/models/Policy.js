const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
  policyId: {
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  annualLimit: {
    type: Number,
    default: 50000
  },
  perClaimLimit: {
    type: Number,
    default: 5000
  },
  copayPercentage: {
    type: Number,
    default: 10
  },
  networkDiscount: {
    type: Number,
    default: 20
  },
  dentalSubLimit: {
    type: Number,
    default: 10000
  },
  visionSubLimit: {
    type: Number,
    default: 5000
  },
  alternativeSubLimit: {
    type: Number,
    default: 8000
  },
  initialWaitingDays: {
    type: Number,
    default: 30
  },
  chronicWaitingDays: {
    type: Number,
    default: 90
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Policy', PolicySchema);
