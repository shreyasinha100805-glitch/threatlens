const { GoogleGenAI } = require('@google/genai');

function createGoogleGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_GENAI_LOCATION || 'global';

  if (project && location) {
    return new GoogleGenAI({
      enterprise: true,
      project,
      location,
      apiVersion: 'v1'
    });
  }

  throw new Error(
    'Google GenAI credentials are not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY, or set GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT for Vertex AI.'
  );
}

module.exports = { createGoogleGenAI };
