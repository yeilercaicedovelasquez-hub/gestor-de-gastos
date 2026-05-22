# S'C ENGINEER - Smart Expense Tracker AI 🚀

Bienvenido a **Smart Expense Tracker AI**, una aplicación web moderna, minimalista y de nivel profesional diseñada para la administración de ingresos, gastos y finanzas personales, potenciada con un asesor inteligente autónomo de Inteligencia Artificial desarrollado con **Gemini AI**.

---

## 🛠️ Stack Tecnológico

La solución se construyó utilizando una arquitectura full-stack altamente optimizada, segura y en tiempo real:

- **Frontend**: React (v19) + Vite + TypeScript.
- **Estilos y Transiciones**: Tailwind CSS + Motion (`motion/react`) para interacciones fluidas.
- **Gráficos e Informes**: Recharts (para visualizaciones dinámicas de tendencias) y jsPDF (para exportación local a PDF).
- **Backend & API proxy**: Node.js + Express proxying para consultas con la SDK `@google/genai`.
- **Base de Datos & Autenticación**: Google Firebase Firestore para almacenamiento persistente y sincronización en tiempo real.

---

## 🔥 Funcionalidades Principales

### 1. Autenticación Multifactor Avanzada
- **Google Cloud Single Sign-On (SSO)** listo para usarse de forma nativa.
- **Registro, Inicio de sesión y Recuperación de contraseña** clásico por correo electrónico y contraseña.
- *Nota:* Para activar el proveedor clásico de correo por primera vez en su proyecto de Firebase, ingrese a la consola de Firebase > **Authentication > Sign-in method > Add new provider** y habilite **Email/Password**.

### 2. Dashboard Ejecutivo Elegante (Modo Oscuro)
- Paneles informativos con resúmenes completos: **Balance Total**, **Ingresos del Mes**, **Egresos totales** y **Porcentaje acumulado de ahorros**.
- Gráficas de tendencias interactivas con **Recharts** detallando balance diario (Ingresos vs Gastos).
- Distribución porcentual en gráficos de dona detallados por categoría de consumo.

### 3. Gestión y Auditoría Contable Completa
- Registro rápido de ingresos y gastos con descripción, monto con decimales, fecha y categorización inteligente.
- Soporte para **Edición** y **Eliminación** directa sincronizado en tiempo real.
- **Categorías estandarizadas**: Comida, Transporte, Entretenimiento, Estudio, Salud y Otros.
- **Filtros avanzados**: Buscador descriptivo por texto, tipo de movimiento, filtrado por categorías específicas y filtrado periódico mensual.

### 4. Consejero Autónomo de IA (Gemini AI)
- Motor integrado en el backend utilizando el modelo recomendado de alto rendimiento **gemini-3.5-flash**.
- Analiza balances netos y comportamientos de gasto en tiempo real.
- Alertas y advertencias personalizadas cuando una categoría supera niveles prudentes.
- Genera recomendaciones de ahorro dinámicas y accionables guardadas de forma segura y automática en la colección `recommendaciones_ai` de Firestore para auditorías posteriores.

### 5. Exportación Local
- Descarga informes de balance y extracto contable auditado a formato **PDF** con un solo clic, incorporando marcas del sistema y colores profesionales.

---

## 🔒 Seguridad e Integración en Firebase

El proyecto sigue estándares rigurosos de seguridad **Zero-Trust**:
- **Reglas robustas en `firestore.rules`**: Validan que ningún usuario acceda, lea o modifique transacciones ajenas. Las reglas de validación en el lado del servidor previenen inyecciones maliciosas y aseguran que los tipos y el formato de datos sean matemáticamente perfectos.
- **Gemini API Key protegida**: Las credenciales de IA residen de forma segura estrictamente en el backend (`server.ts`) sin filtrarse nunca al navegador o al código cliente, minimizando la superficie de ataque.

---

Diseñado con dedicación para ofrecer control, elegancia e inteligencia a sus finanzas personales. 

**Smart Expense Tracker AI** — *S'C ENGINEER*
