import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Expense, Income, AiRecommendation, ExpenseCategory } from "../types";

interface FinanceContextType {
  expenses: Expense[];
  incomes: Income[];
  recommendation: AiRecommendation | null;
  historyRecommendations: AiRecommendation[];
  loading: boolean;
  isAnalyzing: boolean;
  addExpense: (expense: Omit<Expense, "id" | "userId">) => Promise<void>;
  editExpense: (expenseId: string, updated: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addIncome: (income: Omit<Income, "id" | "userId">) => Promise<void>;
  editIncome: (incomeId: string, updated: Partial<Income>) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  requestFinancialAnalysis: () => Promise<void>;
  clearAllMovements: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [historyRecommendations, setHistoryRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setIncomes([]);
      setRecommendation(null);
      setHistoryRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const uid = currentUser.uid;

    // 1. Subscribe to Expenses
    const expensesRef = collection(db, "users", uid, "expenses");
    const expensesQuery = query(expensesRef, orderBy("date", "desc"));
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData: Expense[] = [];
      snapshot.forEach((doc) => {
        exercises: expensesData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(expensesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/expenses`);
    });

    // 2. Subscribe to Incomes
    const incomesRef = collection(db, "users", uid, "incomes");
    const incomesQuery = query(incomesRef, orderBy("date", "desc"));
    const unsubIncomes = onSnapshot(incomesQuery, (snapshot) => {
      const incomesData: Income[] = [];
      snapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() } as Income);
      });
      setIncomes(incomesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/incomes`);
    });

    // 3. Subscribe to Recommendations
    const recsRef = collection(db, "users", uid, "recommendations");
    const recsQuery = query(recsRef, orderBy("generatedAt", "desc"));
    const unsubRecs = onSnapshot(recsQuery, (snapshot) => {
      const recsData: AiRecommendation[] = [];
      snapshot.forEach((doc) => {
        recsData.push({ id: doc.id, ...doc.data() } as AiRecommendation);
      });
      setHistoryRecommendations(recsData);
      if (recsData.length > 0) {
        setRecommendation(recsData[0]); // most recent
      } else {
        setRecommendation(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/recommendations`);
    });

    return () => {
      unsubExpenses();
      unsubIncomes();
      unsubRecs();
    };
  }, [currentUser]);

  // Expenses Operations
  const addExpense = async (expenseData: Omit<Expense, "id" | "userId">) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = collection(db, "users", uid, "expenses");
    // Generate empty document ID first to enforce exact key match in rules
    const newDocRef = doc(ref);
    const id = newDocRef.id;
    const item: Expense = {
      id,
      userId: uid,
      ...expenseData,
    };
    try {
      await setDoc(newDocRef, item);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/expenses/${id}`);
    }
  };

  const editExpense = async (expenseId: string, updated: Partial<Expense>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = doc(db, "users", uid, "expenses", expenseId);
    try {
      await updateDoc(ref, updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/expenses/${expenseId}`);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = doc(db, "users", uid, "expenses", expenseId);
    try {
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/expenses/${expenseId}`);
    }
  };

  // Incomes Operations
  const addIncome = async (incomeData: Omit<Income, "id" | "userId">) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = collection(db, "users", uid, "incomes");
    const newDocRef = doc(ref);
    const id = newDocRef.id;
    const item: Income = {
      id,
      userId: uid,
      ...incomeData,
    };
    try {
      await setDoc(newDocRef, item);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/incomes/${id}`);
    }
  };

  const editIncome = async (incomeId: string, updated: Partial<Income>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = doc(db, "users", uid, "incomes", incomeId);
    try {
      await updateDoc(ref, updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/incomes/${incomeId}`);
    }
  };

  const deleteIncome = async (incomeId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const ref = doc(db, "users", uid, "incomes", incomeId);
    try {
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/incomes/${incomeId}`);
    }
  };

  // Budget Recommendation API integration
  const requestFinancialAnalysis = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    
    setIsAnalyzing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenses: expenses,
          incomes: incomes
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Fallo en la consulta de análisis financiero");
      }

      const rawAnalysis = await response.json();

      // Store in Firebase
      const ref = collection(db, "users", uid, "recommendations");
      const newDocRef = doc(ref);
      const id = newDocRef.id;

      const fullRecommendation: AiRecommendation = {
        id,
        userId: uid,
        summary: rawAnalysis.summary || "No se pudo obtener un resumen.",
        categoryWarning: rawAnalysis.categoryWarning || "Consumos balanceados.",
        savingsGuia: rawAnalysis.savingsGuia || "Sigue ahorrando.",
        recommendations: rawAnalysis.recommendations || [],
        generatedAt: new Date().toISOString()
      };

      await setDoc(newDocRef, fullRecommendation);
      setRecommendation(fullRecommendation);
    } catch (err: any) {
      console.error("Budget Analysis fetching failed:", err);
      // Fallback message if no records are registered yet
      if (expenses.length === 0 && incomes.length === 0) {
        throw new Error("No tienes ingresos ni gastos registrados para analizar. ¡Agrega algunos datos primero!");
      }
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAllMovements = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    
    const expenseDeletions = expenses.map(item => 
      deleteDoc(doc(db, "users", uid, "expenses", item.id))
    );
    
    const incomeDeletions = incomes.map(item => 
      deleteDoc(doc(db, "users", uid, "incomes", item.id))
    );

    const recDeletions = historyRecommendations.map(item => 
      deleteDoc(doc(db, "users", uid, "recommendations", item.id))
    );

    await Promise.all([...expenseDeletions, ...incomeDeletions, ...recDeletions]);
  };

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        incomes,
        recommendation,
        historyRecommendations,
        loading,
        isAnalyzing,
        addExpense,
        editExpense,
        deleteExpense,
        addIncome,
        editIncome,
        deleteIncome,
        requestFinancialAnalysis,
        clearAllMovements
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used inside a FinanceProvider");
  }
  return context;
}
export default FinanceContext;
