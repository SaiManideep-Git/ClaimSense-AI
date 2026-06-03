# ClaimSense AI - OPD Claim Adjudication Platform

ClaimSense AI is an intelligent full-stack claims auditing system designed to automate the approval, partial deduction, and rejection of Outpatient Department (OPD) medical insurance claims. By integrating advanced OCR and generative AI (Gemini/OpenAI) with a deterministic rules engine, it transforms slow manual audits into a real-time policy evaluation dashboard.

---

## 📁 Repository Structure

```
ClaimSense-AI/
├── client/                     # Vite + React + TypeScript + Tailwind CSS Frontend
├── server/                     # Node.js + Express + Mongoose + Multer Backend
└── plum_intern_assignment/     # Assignment instructions and policy terms reference data
```

---

## 🚀 Getting Started

To run the application locally, follow these simple setup steps.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (A running local MongoDB instance or a MongoDB Atlas connection string)
- **Gemini API Key** or **OpenAI API Key** (optional - the system implements a smart mock fallback that loads local test cases automatically if no keys are configured)

---

### 2. Backend Setup (`/server`)

1. Open your terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy the environment template to create your active `.env` file:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Configure your `.env` variables:
   - Connect to MongoDB Atlas: Update `MONGODB_URI`. If left blank, it defaults to a local connection (`mongodb://localhost:27017/claimsense`).
   - Configure OCR/Vision: Set `GEMINI_API_KEY` (highly recommended for native PDF support) or `OPENAI_API_KEY`. If left blank, the server runs in Demo mode, using mock extractions matching the test cases.
   - Configure Cloudinary: Set Cloudinary variables for cloud image storage. If left blank, the server will save files locally to `server/uploads/` and serve them statically.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will run at `http://localhost:5000`.

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal window and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will be active at `http://localhost:5173`.

---

## 🧪 Adjudication & Rules Architecture

The system executes audits in a multi-stage validation pipeline:
1. **File Ingestion**: Uploads prescriptions and invoices (supports image formats and PDFs).
2. **Metadata OCR Extraction**: Uses LLM vision (Gemini/OpenAI) to extract structured fields (doctor registration, consultation date, line items, diagnosis, claim amount).
3. **Deterministic Rules Engine**: Calculates policy limits against terms:
   - **Copay Check**: Applies a 10% patient copay for non-network clinics.
   - **Network Discount**: Applies a 20% network discount for claims treated at network hospitals (Apollo, Fortis, Max, Manipal, Narayana).
   - **Waiting Periods**: Rejects diabetes and hypertension treatments if member joining date is less than 90 days prior to treatment.
   - **Exclusions Check**: Automatically rejects cosmetic procedures (e.g. teeth whitening) or obesity diet treatments.
   - **Fraud Flags**: Reroutes claims to `MANUAL_REVIEW` if a user files more than 2 claims on the same day.
4. **Member Appeals Portal**: Enables members to submit manual appeals on rejected or partial decisions, escalating the claim to a review status.