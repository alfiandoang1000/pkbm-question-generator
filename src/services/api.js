import { GoogleGenerativeAI } from "@google/generative-ai";

// Load keys from Vite environment variables (comma-separated string)
const keysString = import.meta.env.VITE_GEMINI_API_KEYS || "";
const API_KEYS = keysString.split(",").map(k => k.trim()).filter(Boolean);

let currentKeyIndex = 0;

/**
 * Call Google Gemini API with automatic key failover/rotation.
 * 
 * @param {string} prompt The prompt string to generate content for
 * @param {string} modelId The Gemini model name
 */
const MODEL_MAP = {
  'gemini-3.5-flash-latest': 'gemini-3.5-flash',
  'gemini-3.1-flash-lite-latest': 'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview-latest': 'gemini-3.1-pro-preview',
  'gemini-3-flash-preview-latest': 'gemini-3-flash-preview',
};

export async function callGeminiAI(prompt, modelId = "gemini-3.5-flash") {
  if (API_KEYS.length === 0) {
    throw new Error("API Key Gemini belum dikonfigurasi! Harap lengkapi VITE_GEMINI_API_KEYS di file .env.");
  }

  const validModelId = MODEL_MAP[modelId] || modelId;

  let attempts = 0;
  let lastError = null;

  while (attempts < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex];
    try {
      console.log(`[Gemini API] Mencoba request dengan key indeks-${currentKeyIndex}, model: ${validModelId}`);
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: validModelId
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error("Respon dari Gemini kosong.");
      }

      console.log("[Gemini API] Berhasil!");
      return responseText;
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || "";
      console.warn(`[Gemini API] Gagal key-${currentKeyIndex}:`, errorMessage);

      const isRateLimit = errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("too many requests") ||
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("resource exhausted");

      if (isRateLimit && API_KEYS.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        attempts++;
      } else {
        throw error;
      }
    }
  }

  throw new Error("Semua API Key habis quota! Error: " + (lastError?.message || "?"));
}