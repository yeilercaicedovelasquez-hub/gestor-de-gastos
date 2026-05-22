import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, UserPlus, HelpCircle, Key, Mail, User as UserIcon, Lock, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AuthScreen() {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword,
    authError,
    clearAuthError
  } = useAuth();
  
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = () => {
    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return false;
    }
    if (mode !== "forgot" && (!password || password.length < 6)) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (mode === "register" && !displayName.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (clearAuthError) clearAuthError();

    if (!handleValidate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "register") {
        await registerWithEmail(email, password, displayName);
        setSuccess("Cuenta registrada correctamente. ¡Bienvenido!");
      } else {
        await resetPassword(email);
        setSuccess("Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("El registro por Email/Contraseña no está habilitado en tu consola Firebase. Por favor usa 'Google Cloud SSO' o habilita el proveedor de Email/Password en Authentication > Sign-in method.");
      } else {
        setError(
          err.code === "auth/user-not-found" ? "No existe un usuario con este correo electrónico." :
          err.code === "auth/wrong-password" ? "Contraseña incorrecta." :
          err.code === "auth/email-already-in-use" ? "El correo electrónico ya está registrado." :
          err.code === "auth/invalid-credential" ? "Credenciales de inicio de sesión inválidas o expiradas." :
          err.message || "Ocurrió un error inesperado al iniciar sesión."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    if (clearAuthError) clearAuthError();
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError("Error al iniciar sesión con Google. Inténtalo de nuevo o revisa la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative blurred blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-violet-650 to-indigo-650 rounded-2xl mb-4 shadow-lg shadow-indigo-600/15">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xs font-mono font-medium tracking-widest text-indigo-400 uppercase mb-1">
            S'C ENGINEER
          </h2>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Smart Expense Tracker AI
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Control de gastos y consejero financiero autónomo con IA
          </p>
        </div>

        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-950/20 border border-red-500/30 text-red-200 text-xs rounded-xl flex items-start gap-2 shadow-lg"
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold text-red-300">Error en Base de Datos / Conexión:</p>
              <p className="opacity-90 font-mono text-[10px] break-all leading-tight mt-1">{authError}</p>
              <p className="text-[10px] mt-1.5 text-slate-400">Si este error persiste, favor revisar que el Firestore esté aprovisionado o que las reglas estén desplegadas.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="text-xs font-medium text-slate-350">Nombre Completo o Usuario</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-sm transition-all text-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-350">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-sm transition-all text-white"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-350">Contraseña</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-sm transition-all text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></span>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            ) : mode === "register" ? (
              <>
                <UserPlus className="w-4 h-4" />
                Registrar Cuenta
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Recuperar Contraseña
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0c0d16]/30 px-2 text-slate-500">O ingresa con</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Google Cloud SSO
        </button>

        <div className="text-center mt-6 text-xs text-slate-500 space-y-2">
          {mode === "login" ? (
            <p>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors inline"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors inline"
              >
                Inicia sesión
              </button>
            </p>
          )}
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-slate-600">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <p className="max-w-[280px] leading-tight text-[10px]">
              Nota: Google Sign-In funciona por defecto. La autenticación clásica por Email/Password está disponible en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AuthScreen;
