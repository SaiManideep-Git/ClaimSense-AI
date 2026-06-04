const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Schema description for prompt
const extractionSchema = {
  patientName: "Full name of the patient as listed on the document",
  hospitalName: "Name of the clinic, hospital, or diagnostic center",
  doctorName: "Name of the doctor/consultant",
  doctorReg: "Doctor registration number (e.g. KA/45678/2015 or standard format on stamp)",
  consultationDate: "Date of treatment/billing in YYYY-MM-DD format",
  claimAmount: "Total billed amount as a number",
  consultationFee: "Consultation charges if itemized, otherwise 0",
  medicines: ["Array of medicine names prescribed or purchased"],
  tests: ["Array of lab/diagnostic tests advised (e.g. CBC, MRI, Blood Sugar, X-Ray)"],
  procedures: ["Array of clinical procedures performed (e.g. Root canal, Dressing, Teeth whitening)"],
  diagnosis: "Primary diagnosis or symptoms written (e.g. Viral fever, Tooth decay, Gastroenteritis)",
  claimType: "Strictly one of: 'OPD' (general consultation/pharmacy), 'Dental', 'Vision', 'Alternative' (Ayurveda/Homeopathy)"
};

// System Prompt for structured vision extraction
const SYSTEM_PROMPT = `You are an expert medical claims auditor. Analyze the uploaded medical document (prescription, invoice, pharmacy bill, or diagnostic report) and extract the key fields.
Your output must be STRICT JSON matching this schema:
${JSON.stringify(extractionSchema, null, 2)}

Important Rules:
1. Return ONLY the JSON object. Do not include markdown wraps (\`\`\`json) or extra text.
2. If a field is not present or cannot be read, return null (or an empty array for lists).
3. For dates, standardize to YYYY-MM-DD. If only month/year is present, estimate based on other document contexts.
4. For claimType, classify based on:
   - 'Dental': Tooth extraction, root canal, dental checkup.
   - 'Vision': Eye checkup, spectacles, contact lenses.
   - 'Alternative': Ayurveda, Homeopathy, Vaidya clinics.
   - 'OPD': Any general physician, general pharmacy, or routine diagnostic checks (like blood tests).
5. Normalize the doctorReg number if possible, ensuring it captures the state/number/year structure.`;

/**
 * Extracts structured data from medical documents using live Gemini/OpenAI API.
 * @param {Object} file - File object from Multer (buffer, mimetype, originalname)
 * @param {string} docType - "prescription" or "bill" or "report"
 * @param {Object} claimContext - Additional claim metadata
 * @returns {Promise<Object>} Extracted structured data
 */
async function extractDocumentData(file, docType, claimContext = {}) {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (!hasGeminiKey && !hasOpenAIKey) {
    throw new Error('LLM API credentials missing. Please configure GEMINI_API_KEY or OPENAI_API_KEY in server environment.');
  }

  let extracted = {};

  if (hasGeminiKey) {
    try {
      console.log(`[LLM] Processing with Gemini API: ${file.originalname}`);
      extracted = await extractWithGemini(file, docType);
    } catch (geminiErr) {
      console.warn(`[LLM] Gemini API failed: ${geminiErr.message}.`);
      if (hasOpenAIKey) {
        console.log(`[LLM] Falling back to OpenAI API: ${file.originalname}`);
        extracted = await extractWithOpenAI(file, docType);
      } else {
        throw geminiErr;
      }
    }
  } else if (hasOpenAIKey) {
    console.log(`[LLM] Processing with OpenAI API: ${file.originalname}`);
    extracted = await extractWithOpenAI(file, docType);
  }

  return extracted;
}


/**
 * Gemini API extraction
 */
async function extractWithGemini(file, docType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Using gemini-2.5-flash as it is fast, stable, and supports multimodal documents (images and PDFs)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const inlineData = {
    data: file.buffer.toString('base64'),
    mimeType: getSafeMimeType(file)
  };

  const prompt = `${SYSTEM_PROMPT}\n\nDocument Category: ${docType}\nExtract information from this medical document:`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * OpenAI API extraction
 */
async function extractWithOpenAI(file, docType) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64Image = file.buffer.toString('base64');
  
  let messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    }
  ];

  const safeMime = getSafeMimeType(file);
  // OpenAI gpt-4o-mini supports image URLs/base64
  if (safeMime.startsWith('image/')) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: `Document Category: ${docType}. Extract information:` },
        {
          type: 'image_url',
          image_url: {
            url: `data:${safeMime};base64,${base64Image}`
          }
        }
      ]
    });
  } else {
    // If it's plain text (e.g. virtual files) or PDF, parse it as text content
    messages.push({
      role: 'user',
      content: `Document Category: ${docType}. Document Content: ${file.buffer.toString('utf8')}`
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

// Mock fallback disabled per user request

/**
 * Safely determines the mimetype of a file by verifying magic numbers of images/PDFs.
 * If file metadata claims it's an image/PDF but the buffer contains plain text (e.g. mock test case files),
 * returns 'text/plain' to avoid crashing live AI image decoders.
 */
function getSafeMimeType(file) {
  if (!file || !file.buffer || file.buffer.length < 4) {
    return 'text/plain';
  }
  
  const buffer = file.buffer;
  
  // Check magic bytes:
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  const currentMime = (file.mimetype || '').toLowerCase();
  
  if (currentMime.startsWith('image/png') && !isPng) {
    return 'text/plain';
  }
  if (currentMime.startsWith('application/pdf') && !isPdf) {
    return 'text/plain';
  }
  if ((currentMime.startsWith('image/jpeg') || currentMime.startsWith('image/jpg')) && !isJpg) {
    return 'text/plain';
  }
  
  return file.mimetype || 'application/octet-stream';
}

module.exports = {
  extractDocumentData
};
