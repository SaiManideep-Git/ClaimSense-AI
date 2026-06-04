const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  policyId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Terminated'],
    default: 'Active'
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
