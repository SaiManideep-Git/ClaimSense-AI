const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET 
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('[Storage] Cloudinary configured and enabled.');
} else {
  console.log('[Storage] Cloudinary credentials missing. Falling back to local disk storage.');
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local disk storage.
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} URL and filename
 */
async function uploadFile(file) {
  if (!file) return null;

  const fileExt = path.extname(file.originalname) || '.jpg';
  const newFilename = `${uuidv4()}${fileExt}`;

  // 1. CLOUDINARY UPLOAD
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      // Use upload_stream for buffers
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'claimsense_documents',
          public_id: path.parse(newFilename).name,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('[Storage] Cloudinary upload failed:', error.message);
            // Fall back to local storage on error
            saveLocally(file, newFilename)
              .then(resolve)
              .catch(reject);
          } else {
            resolve({
              url: result.secure_url,
              filename: newFilename,
              provider: 'cloudinary'
            });
          }
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // 2. LOCAL FALLBACK UPLOAD
  return saveLocally(file, newFilename);
}

/**
 * Saves a file to local disk
 */
async function saveLocally(file, filename) {
  const uploadDir = path.join(__dirname, '../uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);

  // Return a relative path or local server URL. The server will host this statically
  const host = process.env.HOST_URL || `http://localhost:${process.env.PORT || 5000}`;
  const url = `${host}/uploads/${filename}`;

  console.log(`[Storage] Saved file locally: ${filePath} -> ${url}`);

  return {
    url,
    filename,
    provider: 'local'
  };
}

module.exports = {
  uploadFile
};
