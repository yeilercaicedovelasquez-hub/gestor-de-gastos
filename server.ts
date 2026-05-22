import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for AI Budget Analysis and Recommendations
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { expenses, incomes, language = "es" } = req.body;

    if (!expenses || !incomes) {
      res.status(400).json({ error: "expenses and incomes are required" });
      return;
    }

    const ai = getGeminiClient();

    // Setup clear structured prompt and pass the financial data
    const prompt = `
      Analiza el siguiente historial de transacciones financieras de un usuario de la aplicación "Smart Expense Tracker AI".
      
      INGRESOS REGISTRADOS:
      ${JSON.stringify(incomes, null, 2)}

      GASTOS REGISTRADOS:
      ${JSON.stringify(expenses, null, 2)}

      Proporciona un análisis financiero detallado y personalizado en español (o el idioma indicado: ${language}).
      Asegúrate de:
      1. Calcular el balance neto (ingresos - gastos).
      2. Identificar qué categoría acumula el porcentaje más alto de gasto y dar una advertencia si supera el 40% del ingreso total.
      3. Generar al menos 4 recomendaciones financieras de ahorro prácticas y accionables y ajustadas AL DETALLE a los números recibidos.
      4. Ofrecer una guía breve para optimizar el ahorro del mes.
      
      Debes responder Estrictamente un JSON que coincida con el esquema solicitado. No metas markdown adicional ni explicaciones fuera del JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Resumen ejecutivo del estado financiero del usuario en español.",
            },
            categoryWarning: {
              type: Type.STRING,
              description: "Advertencia específica sobre la categoría donde más ha gastado, o retroalimentación si todo está balanceado.",
            },
            savingsGuia: {
              type: Type.STRING,
              description: "Guía corta de un párrafo para optimizar el ahorro del usuario basado en sus números.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Al menos 4 consejos de finanzas y ahorros del mes redactados en un tono profesional, claro e inteligente directos.",
            }
          },
          required: ["summary", "categoryWarning", "savingsGuia", "recommendations"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No text returned from Gemini model");
    }

    try {
      const parsedData = JSON.parse(jsonText.trim());
      res.json(parsedData);
    } catch (parseErr) {
      res.status(500).json({
        error: "Error parseando la respuesta JSON del modelo de Inteligencia Artificial.",
        raw: jsonText
      });
    }

  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    res.status(500).json({
      error: "Ocurrió un error al consultar el servicio de Inteligencia Artificial.",
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

configureServer();
