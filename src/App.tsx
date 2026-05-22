import React, { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { TransactionsView } from "./components/TransactionsView";
import { MonthlyHistoryView } from "./components/MonthlyHistoryView";
import { Menu, Sparkles, User, Brain } from "lucide-react";

export default function App() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "history">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // loading fallback gateway
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center font-sans">
        <div className="p-4 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl mb-4 animate-pulse shadow-xl shadow-indigo-500/10">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 mt-4 tracking-widest uppercase font-mono">
          Smart Expense Tracker AI
        </p>
        <span className="text-[10px] text-slate-600 mt-1">ESTABLECIENDO CONEXIÓN SEGURA...</span>
      </div>
    );
  }

  // Route guarding: if unauthenticated, mount the beautiful login screen page
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Active view router mapping
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "history":
        return <MonthlyHistoryView />;
      case "transactions":
        return <TransactionsView />;
      default:
        return <DashboardView />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard de Control Financiero";
      case "history":
        return "Historial Mensual y Fondo de Ahorro";
      case "transactions":
        return "Movimientos y Registro del Libro";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-100 flex font-sans relative overflow-hidden">
      {/* Ambient glass glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      {/* 27-Line Secure Sidebar element navigation panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main app viewport container body wrapper */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0 relative z-10">
        
        {/* Responsive viewport navigation header */}
        <header className="h-20 border-b border-white/5 bg-[#0a0c14]/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer lg:hidden text-slate-400 hover:text-slate-100 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded-full">S'C ENGINEER</span>
              <h2 className="text-sm font-semibold tracking-tight text-white mt-1 leading-none">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Real-time status badge indicator */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-medium rounded-full text-emerald-400 select-none backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              FIRESTORE ONLINE
            </span>

          </div>

        </header>

        {/* Dynamic primary content wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
}
