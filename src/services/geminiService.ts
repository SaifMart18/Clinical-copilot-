import { GoogleGenAI, Type } from "@google/genai";
import { ClinicalReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

import { Language } from "../types";

export async function generateClinicalReport(data: {
  complaint: string;
  symptoms: string;
  vitals: string;
  labs: string;
}, lang: Language = 'en'): Promise<ClinicalReport> {
  const languageName = lang === 'ar' ? 'Arabic' : 'English';
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a clinical decision support assistant. Analyze the following patient data and provide a structured clinical report.
    
    IMPORTANT: The entire response MUST be in ${languageName}.
    
    Complaint: ${data.complaint}
    Symptoms: ${data.symptoms}
    Vitals: ${data.vitals}
    Labs: ${data.labs}`,
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

  return JSON.parse(response.text || "{}") as ClinicalReport;
}
