export type Language = 'en' | 'ar';

export interface User {
  id: string;
  email: string;
  language?: Language;
}

export interface MedicalCase {
  id: string;
  user_id: string;
  complaint: string;
  symptoms: string;
  vitals: string;
  labs: string;
  created_at: string;
  report?: string; // JSON string from DB
}

export interface ClinicalReport {
  urgency: 'High' | 'Medium' | 'Low';
  differential_dx: string[];
  workup: string[];
  management: string[];
  dosing_safety: string[];
  monitoring_followup: string[];
}
