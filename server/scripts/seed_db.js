const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Policy = require('../models/Policy');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/claimsense-ai';
  console.log(`Connecting to database: ${connUri.split('@').pop()}`);
  await mongoose.connect(connUri);
};

const policyData = {
  policyId: "PLUM_OPD_2024",
  companyName: "TechCorp Solutions Pvt Ltd",
  effectiveDate: new Date("2024-01-01T00:00:00Z"),
  expirationDate: new Date("2024-12-31T23:59:59Z"),
  annualLimit: 50000,
  perClaimLimit: 5000,
  copayPercentage: 10,
  networkDiscount: 20,
  dentalSubLimit: 10000,
  visionSubLimit: 5000,
  alternativeSubLimit: 8000,
  initialWaitingDays: 30,
  chronicWaitingDays: 90
};

const employeesData = [
  { memberId: "EMP001", name: "Rajesh Kumar", joinDate: new Date("2024-01-15T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP002", name: "Priya Singh", joinDate: new Date("2024-02-10T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP003", name: "Amit Verma", joinDate: new Date("2024-03-01T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP004", name: "Sneha Reddy", joinDate: new Date("2024-04-01T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP005", name: "Vikram Joshi", joinDate: new Date("2024-09-01T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP006", name: "Kavita Nair", joinDate: new Date("2024-05-15T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP007", name: "Suresh Patil", joinDate: new Date("2024-06-20T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP008", name: "Ravi Menon", joinDate: new Date("2024-07-01T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP009", name: "Anita Desai", joinDate: new Date("2024-01-01T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" },
  { memberId: "EMP010", name: "Deepak Shah", joinDate: new Date("2024-08-15T00:00:00Z"), policyId: "PLUM_OPD_2024", status: "Active" }
];

const seed = async () => {
  try {
    await connectDB();

    // 1. Clear existing
    console.log('Clearing existing Policy collections...');
    await Policy.deleteMany({});
    console.log('Clearing existing Employee collections...');
    await Employee.deleteMany({});

    // 2. Insert Policy
    console.log('Inserting default corporate Policy...');
    const insertedPolicy = new Policy(policyData);
    await insertedPolicy.save();
    console.log(`Inserted Policy: ${insertedPolicy.policyId} (${insertedPolicy.companyName})`);

    // 3. Insert Employees
    console.log('Inserting corporate employee registry...');
    await Employee.insertMany(employeesData);
    console.log(`Successfully seeded ${employeesData.length} employees.`);

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
};

seed();
