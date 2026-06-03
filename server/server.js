const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for the MVP
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists for local disk fallback
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/claims', require('./routes/claimRoutes'));

// Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ClaimSense AI Claim Adjudication API',
    status: 'online',
    version: '1.0.0'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}...`);
  console.log(`[Server] Test suite runner endpoint: http://localhost:${PORT}/api/claims/test-suite/run`);
});
