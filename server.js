/**
 * S'C ENGINEER - Smart Expense Tracker AI
 * Node.js Wrapper & CommonJS entry point for server.js compatibility.
 */

const path = require("path");
const fs = require("fs");

console.log("Iniciando Smart Expense Tracker Server...");

// Path to the bundled, compiled production server
const productionBundle = path.join(__dirname, "dist", "server.cjs");

if (fs.existsSync(productionBundle)) {
  console.log("Cargando servidor de producción compilado...");
  require(productionBundle);
} else {
  console.log("\n[!] El servidor de producción no está compilado aún.");
  console.log("Para desarrollo local, inicia con: npm run dev");
  console.log("Para compilar e iniciar en producción, ejecuta: npm run build && npm start\n");
  
  // Try to fallback dynamically using tsx if run in a dev env
  try {
    console.log("Intentando arrancar dinámicamente usando TSX...");
    require("tsx/cli");
  } catch (err) {
    console.log("No se pudo iniciar de manera automática. Revisa las instrucciones de arriba.");
    process.exit(1);
  }
}
