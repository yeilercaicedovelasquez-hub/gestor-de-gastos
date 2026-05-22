export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  createdAt?: string;
}

export type ExpenseCategory = 'comida' | 'transporte' | 'entretenimiento' | 'estudio' | 'salud' | 'otros';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt?: any; // To allow server timestamps or ISO string
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt?: any;
}

export interface AiRecommendation {
  id: string;
  userId: string;
  summary: string;
  categoryWarning: string;
  savingsGuia: string;
  recommendations: string[];
  generatedAt: string;
}
