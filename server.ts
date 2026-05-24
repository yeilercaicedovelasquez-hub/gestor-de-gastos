import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// REST API for Deterministic Budget Analysis and Recommendations (Alternative to AI/Gemini for robust, offline-ready deployment)
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { expenses, incomes } = req.body;

    if (!expenses || !incomes) {
      res.status(400).json({ error: "expenses and incomes are required" });
      return;
    }

    interface TxItem {
      amount: number;
      category?: string;
      description: string;
      date: string;
    }

    const totalIncomes = incomes.reduce((sum: number, item: TxItem) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, item: TxItem) => sum + item.amount, 0);
    const netBalance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? (netBalance / totalIncomes) * 100 : 0;

    // Aggregate expenses by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((item: TxItem) => {
      const cat = item.category || "otros";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
    });

    // Find highest category
    let highestCategory = "otros";
    let highestAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > highestAmount) {
        highestAmount = amt;
        highestCategory = cat;
      }
    });

    const pctHighest = totalExpenses > 0 ? (highestAmount / totalExpenses) * 100 : 0;

    // Formulate a beautiful, personalized, intelligent, rule-based response
    let summary = "";
    if (totalIncomes === 0 && totalExpenses === 0) {
      summary = "Aún no registras movimientos en tu balance actual. Registra tus primeros ingresos y egresos para obtener un diagnóstico completo de tus finanzas.";
    } else if (netBalance > 0) {
      summary = `Tu balance financiero de este período es saludable, registrando un superávit neto de $${netBalance.toLocaleString("es-CL")}. Tus ingresos totales alcanzaron $${totalIncomes.toLocaleString("es-CL")}, mientras que tus egresos sumaron $${totalExpenses.toLocaleString("es-CL")}.`;
    } else if (netBalance < 0) {
      summary = `¡Atención! Actualmente te encuentras en una situación de déficit con un saldo negativo de $${netBalance.toLocaleString("es-CL")}. Tus gastos ($${totalExpenses.toLocaleString("es-CL")}) han superado tus ingresos ($${totalIncomes.toLocaleString("es-CL")}). Se recomienda revisar tus costos mensuales con urgencia.`;
    } else {
      summary = `Tu situación actual está en completo equilibrio. Tus ingresos y gastos coinciden exactamente en $${totalIncomes.toLocaleString("es-CL")}. No obstante, no has podido generar ahorros líquidos este mes.`;
    }

    // Category warning formulation
    let categoryWarning = "Tus consumos se encuentran bien distribuidos en las diferentes categorías contables.";
    if (highestAmount > 0) {
      const catFormatted = highestCategory.charAt(0).toUpperCase() + highestCategory.slice(1);
      if (pctHighest > 40) {
        categoryWarning = `Alerta de concentración: La categoría "${catFormatted}" representa un sustancial ${pctHighest.toFixed(0)}% del total de tus egresos ($${highestAmount.toLocaleString("es-CL")}). Se sugiere moderar de inmediato esta categoría para liberar flujo de efectivo.`;
      } else {
        categoryWarning = `Tu gasto principal se concentra en "${catFormatted}" con un $${highestAmount.toLocaleString("es-CL")} (${pctHighest.toFixed(0)}% del total). El resto de tus consumos se mantiene debidamente balanceado.`;
      }
    }

    // Savings guide formulation
    let savingsGuia = "";
    if (savingsRate >= 20) {
      savingsGuia = `¡Excelente nivel de ahorro! Tu tasa de ahorro actual es de ${savingsRate.toFixed(1)}%, ubicándote con holgura por encima de la meta mínima recomendada del 20%. Mantén esta prudente disciplina y considera trasladar estos excedentes hacia inversiones estables o depósitos a plazo.`;
    } else if (savingsRate > 0) {
      savingsGuia = `Tu tasa de ahorro se ubica en un ${savingsRate.toFixed(1)}%. Aunque es un saldo positivo, estás por debajo del umbral recomendado del 20%. Diseñar un presupuesto estricto dividiendo tus gastos superfluos a la mitad te permitirá acelerar la acumulación de tu fondo de emergencia.`;
    } else {
      savingsGuia = `Tienes una tasa de ahorro nula o negativa (${savingsRate.toFixed(1)}%). En estas condiciones no es posible construir un colchón financiero estable. Te aconsejamos suspender de inmediato cualquier compra impulsiva y aplicar estrictamente el método 50/30/20 para reestructurar tus finanzas personales.`;
    }

    // Generate 4 dynamic recommendations based on numeric data
    const recommendations: string[] = [];
    
    if (savingsRate < 20) {
      recommendations.push(
        `Optimiza tus gastos habituales de inmediato: Tu actual tasa de ahorro del ${savingsRate.toFixed(1)}% requiere un recorte del 15% en consumos de ocio o transporte para restaurar el balance mínimo.`
      );
    } else {
      recommendations.push(
        `Consolida tu excelente hábito: Al tener un ahorro del ${savingsRate.toFixed(1)}%, tu salud financiera es estelar. Traspasa automáticamente el saldo sobrante al Fondo de Ahorro para evitar la tentación de gastarlo.`
      );
    }

    if (highestCategory === "comida") {
      recommendations.push(
        `Planificación alimentaria: Tu mayor egreso está en Alimentación ($${highestAmount.toLocaleString("es-CL")}). Organiza tus menús semanales antes de ir al supermercado para reducir un 10% de desperdicio y gastos de deliverys.`
      );
    } else if (highestCategory === "entretenimiento") {
      recommendations.push(
        `Control de salidas y ocio: La categoría Ocio e Inversiones en Entrenimiento suma un total de $${highestAmount.toLocaleString("es-CL")}. Establece un presupuesto fijo semanal para tus fines de semana y apégate estrictamente a él.`
      );
    } else if (highestCategory === "otros") {
      recommendations.push(
        `Vigila los micropagos ocultos: Muchos cobros están clasificados en 'Otros' ($${highestAmount.toLocaleString("es-CL")}). Haz una auditoría de tus estados de cuenta y cancela de inmediato las suscripciones o servicios que no uses regularmente.`
      );
    } else {
      recommendations.push(
        `Monitorea tu categoría de mayor de consumo ("${highestCategory}"): Registraste un gasto de $${highestAmount.toLocaleString("es-CL")}. Explora alternativas más convenientes, descuentos por pago anticipado o membresías colectivas.`
      );
    }

    recommendations.push(
      `Regla de las 48 Horas: Antes de adquirir cualquier artículo que no represente una necesidad básica, posterga la decisión de compra durante dos días. En más del 70% de las ocasiones descubrirás que no lo necesitabas.`
    );

    if (netBalance > 0) {
      const suggestedFondo = Math.round(netBalance * 0.15);
      recommendations.push(
        `Fortalece tu seguridad financiera: Te sugerimos tomar voluntariamente $${suggestedFondo.toLocaleString("es-CL")} (15% de tu superávit neto) de tus balances de este mes y aportarlo directamente a tu "Fondo de Ahorro" en la sección de Historial.`
      );
    } else {
      recommendations.push(
        `Activa un escudo frente a contingencias: Dado que tu flujo de caja está debilitado, prioriza aportar montos pequeños, aunque sean de $5,000 o $10,000 a tu Fondo de Ahorro para construir gradualmente un pilar protector.`
      );
    }

    res.json({
      summary,
      categoryWarning,
      savingsGuia,
      recommendations
    });

  } catch (error: any) {
    console.error("Budget Analysis Processing Error:", error);
    res.status(500).json({
      error: "Ocurrió un error al procesar el análisis financiero de la aplicación.",
      details: error.message || String(error)
    });
  }
});

// Setup Vite Dev server or Serve static files in production
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA routing fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Expense Tracker Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL && !process.env.NETLIFY) {
  configureServer();
}
