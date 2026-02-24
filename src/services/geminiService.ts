import { GoogleGenAI, Type } from "@google/genai";
import { ClinicalReport, Language } from "../types";

// Use import.meta.env for Vite client-side environment variables
// Fallback to process.env if defined via vite.config.ts
const getApiKey = () => {
  try {
    // Check import.meta.env (Vite standard)
    const viteKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (viteKey) return viteKey;

    // Check process.env (Injected via vite.config.ts define)
    const procKey = (process as any).env.GEMINI_API_KEY;
    if (procKey) return procKey;

    return '';
  } catch {
    return '';
  }
};

export async function generateClinicalReport(data: {
  complaint: string;
  symptoms: string;
  vitals: string;
  labs: string;
  images?: { data: string; mimeType: string }[];
}, lang: Language = 'en'): Promise<ClinicalReport> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing. Please set VITE_GEMINI_API_KEY in your environment variables.");
    throw new Error("AI Service is currently unavailable. Please check configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const languageName = lang === 'ar' ? 'Arabic' : 'English';
  
  try {
    const parts: any[] = [
      {
        text: `You are a clinical decision support assistant. Analyze the following patient data and provide a structured clinical report.
        
        IMPORTANT: The entire response MUST be in ${languageName}.
        
        Complaint: ${data.complaint}
        Symptoms: ${data.symptoms}
        Vitals: ${data.vitals}
        Labs: ${data.labs}
        
        ${data.images && data.images.length > 0 ? 'I have also attached images of clinical findings, lab results, or imaging. Please analyze them carefully as part of the assessment.' : ''}`
      }
    ];

    if (data.images && data.images.length > 0) {
      data.images.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Using a model that supports multimodal input well
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING,
              description: "Urgency level: High, Medium, or Low",
            },
            differential_dx: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of potential differential diagnoses",
            },
            workup: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended next steps for workup and investigations",
            },
            management: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Management plan and immediate actions",
            },
            dosing_safety: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Medication dosing, safety considerations, and contraindications",
            },
            monitoring_followup: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Follow-up plan and monitoring parameters",
            },
          },
          required: ["urgency", "differential_dx", "workup", "management", "dosing_safety", "monitoring_followup"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI model");
    }

    return JSON.parse(response.text) as ClinicalReport;
  } catch (err: any) {
    console.error("Gemini generation error:", err);
    throw new Error(`AI Generation failed: ${err.message || 'Unknown error'}`);
  }
}
