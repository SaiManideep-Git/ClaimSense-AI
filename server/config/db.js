const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/claimsense';
    console.log(`Attempting to connect to MongoDB at: ${connStr.replace(/:([^@]+)@/, ':***@')}`);
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('WARNING: Application will run, but DB features will fail until MONGODB_URI is configured correctly in .env.');
  }
};

module.exports = connectDB;
