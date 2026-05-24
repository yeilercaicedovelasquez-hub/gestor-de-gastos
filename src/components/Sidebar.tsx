import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, ReceiptText, BrainCircuit, LogOut, Menu, X, Sparkles, Calendar } from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "transactions" | "history";
  setActiveTab: (tab: "dashboard" | "transactions" | "history") => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { userProfile, logout } = useAuth();

  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard Ejecutivo",
      icon: LayoutDashboard,
      description: "Gráficos y balances globales"
    },
    {
      id: "history" as const,
      label: "Historial y Ahorro",
      icon: Calendar,
      description: "Fondo de ahorro e historial"
    },
    {
      id: "transactions" as const,
      label: "Movimientos",
      icon: ReceiptText,
      description: "Ingresos, gastos y filtros"
    }
  ];

  const handleNav = (tabId: "dashboard" | "transactions" | "history") => {
    setActiveTab(tabId);
    setIsOpen(false); // Close responsive menu on tap
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* Main Sidebar Container */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-[#0a0c14]/85 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/15">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400">S'C ENGINEER</span>
              </div>
              <h1 className="text-xs font-bold text-white tracking-widest uppercase leading-none mt-0.5">
                Smart Tracker AI
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 px-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg lg:hidden text-slate-400 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left cursor-pointer transition-all duration-200 relative group ${
                  isActive 
                    ? "bg-white/10 border border-white/10 text-white shadow-lg shadow-indigo-500/5"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {/* Active Indicator Pillar */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-0 w-1 rounded-r-full bg-indigo-500"></span>
                )}

                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive 
                    ? "bg-indigo-500/20 text-indigo-400" 
                    : "bg-white/5 text-slate-400 group-hover:bg-white/15 group-hover:text-slate-200"
                }`}>
                  <IconComponent className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold tracking-wide flex items-center justify-between">
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Card Footer */}
        <div className="p-4 border-t border-white/5 bg-black/5 shrink-0">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">
                {userProfile?.displayName || "Usuario Smart"}
              </h4>
              <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
                {userProfile?.email || "auth@workspace"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 mt-3.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400 hover:text-red-400 rounded-xl cursor-pointer border border-white/10 hover:border-red-950/30 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
