import React, { useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Plus, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileSpreadsheet
} from "lucide-react";
import { motion } from "motion/react";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";
import { ExpenseCategory } from "../types";

export function DashboardView() {
  const { 
    expenses, 
    incomes, 
    addExpense, 
    addIncome, 
    clearAllMovements
  } = useFinance();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Quick transaction state
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("comida");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Financial calculations
  const totalIncomes = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;

  // Fondo de Ahorro calculations
  const checkIsSavingsFund = (desc: string) => {
    const descLower = desc.toLowerCase();
    return descLower.includes("[fondo de ahorro]") || descLower.includes("fondo de ahorro") || descLower.includes("[ahorro]");
  };
  const savingsFundWithdrawals = incomes.filter(i => checkIsSavingsFund(i.description)).reduce((sum, item) => sum + item.amount, 0);
  const savingsFundDeposits = expenses.filter(e => checkIsSavingsFund(e.description)).reduce((sum, item) => sum + item.amount, 0);
  const savingsFundTotal = savingsFundDeposits - savingsFundWithdrawals;

  // Aggregate expenditures by categories
  const categoryTotals = expenses.reduce((acc, current) => {
    acc[current.category] = (acc[current.category] || 0) + current.amount;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = {
    comida: "#F59E0B", // amber
    transporte: "#3B82F6", // blue
    entretenimiento: "#EC4899", // pink
    estudio: "#8B5CF6", // purple
    salud: "#10B981", // emerald
    otros: "#6B7280" // gray
  };

  const chartCategoryData = Object.entries(categoryTotals).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: val,
    color: COLORS[key as ExpenseCategory] || "#6B7280"
  }));

  // Daily totals for Area Charts (Incomes vs Expenses)
  // Let's bundle by date mapping the last 7 active entries
  const allDates = Array.from(
    new Set([
      ...expenses.map(d => d.date),
      ...incomes.map(d => d.date)
    ])
  ).sort().slice(-7); // Last 7 active days

  const dailyChartData = allDates.map(d => {
    const dayExpenses = expenses.filter(e => e.date === d).reduce((sub, item) => sub + item.amount, 0);
    const dayIncomes = incomes.filter(i => i.date === d).reduce((sub, item) => sub + item.amount, 0);
    return {
      date: d.split("-").slice(1).join("/"), // MM/DD formatting
      gastos: dayExpenses,
      ingresos: dayIncomes
    };
  });

  const recentMovements = [
    ...expenses.map(e => ({ ...e, type: "expense" as const })),
    ...incomes.map(i => ({ ...i, type: "income" as const }))
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Por favor ingresa un monto válido mayor a 0.");
      return;
    }
    if (!description.trim()) {
      setFormError("Por favor escribe una descripción corta.");
      return;
    }

    try {
      if (txType === "expense") {
        await addExpense({
          amount: numericAmount,
          category,
          date,
          description: description.trim()
        });
      } else {
        await addIncome({
          amount: numericAmount,
          date,
          description: description.trim()
        });
      }

      setAmount("");
      setDescription("");
      setFormSuccess(`¡${txType === "expense" ? "Gasto" : "Ingreso"} registrado de forma exitosa!`);
      setTimeout(() => setFormSuccess(null), 3500);
    } catch (err: any) {
      setFormError("Ocurrió un error al persistir los datos en Firestore.");
    }
  };

  const handleResetAll = async () => {
    setResetLoading(true);
    try {
      await clearAllMovements();
      setShowConfirmReset(false);
      setFormSuccess("¡Base de datos restablecida con éxito! Todos los movimientos han sido eliminados.");
      setTimeout(() => setFormSuccess(null), 4000);
    } catch (err) {
      setFormError("Ocurrió un error al intentar eliminar los movimientos.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Reset Confirmation Overlay Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-950 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-1">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">¿Confirmas reiniciar el proyecto?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta acción es irreversible. Se eliminarán permanentemente todos tus ingresos, gastos, movimientos y el fondo de ahorro de la base de datos de Firestore.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={resetLoading}
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleResetAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {resetLoading ? "Reiniciando..." : "Sí, Reiniciar Todo"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Banner Control Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-lg font-bold text-white tracking-tight">¡Hola, un gusto saludarte!</h1>
          <p className="text-xs text-slate-450 mt-1 max-w-xl font-medium">Bienvenido a tu sistema inteligente de control financiero con IA autónoma. Aquí tienes una visión completa de tus activos.</p>
        </div>
        <div className="relative z-10 flex gap-2 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 text-rose-455 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/5 duration-200 active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Reiniciar Proyecto
          </button>
        </div>
      </div>

      {/* 1. Statistics Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Total Incomes */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ingresos Totales</span>
            <div className="p-2.5 bg-emerald-550/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight mt-3">
            ${totalIncomes.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">+{incomes.length}</span> entradas registradas
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gastos Totales</span>
            <div className="p-2.5 bg-red-550/10 rounded-xl text-red-400 border border-red-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight mt-3">
            ${totalExpenses.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <span className="text-red-400 font-medium">{expenses.length}</span> compras registradas
          </p>
        </div>

        {/* Net Balance */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Balance Total</span>
            <div className={`p-2.5 rounded-xl border ${netBalance >= 0 ? "bg-indigo-550/10 text-indigo-400 border-indigo-500/20" : "bg-red-550/10 text-red-450 border-red-500/20"}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight mt-3 ${netBalance >= 0 ? "text-white" : "text-rose-400"}`}>
            ${netBalance.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
            Flujo libre general neto reconciliado
          </p>
        </div>

        {/* Savings Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group hover:border-yellow-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Porcentaje de Ahorros</span>
            <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight mt-3">
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
            Meta óptma: arriba del 20%
          </p>
        </div>

        {/* New Savings Fund Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-505/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">Fondo de Ahorro</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-350 border border-emerald-500/25">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight mt-3">
            ${savingsFundTotal.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-none font-medium">
            Total Aportado: ${savingsFundDeposits.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </p>
        </div>

      </div>

      {/* 2. Interactive Charts & Real-Time Form Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Side — Incomes vs Expenses (Last 7 events) */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400">Balance Inmediato Reciente</h3>
              <p className="text-[10px] text-indigo-300 leading-none bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">Análisis de los últimos días</p>
            </div>
            <p className="text-slate-400 text-[11px] mb-4">Mapeo dinámico comparativo de gastos vs ingresos de los últimos movimientos.</p>
          </div>

          <div className="h-64 w-full text-xs">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F1F5F9" }}
                    labelStyle={{ fontWeight: "bold", fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos ($)" />
                  <Area type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" name="Gastos ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                <FileSpreadsheet className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">Aún no hay suficientes movimientos históricos para desplegar comparaciones diarias.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick entry transaction form */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 block relative">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-4">Registro Rápido</h3>
          
          <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/5 rounded-2xl mb-4">
            <button
              onClick={() => setTxType("expense")}
              className={`py-2 text-[11px] font-semibold transition-all rounded-xl cursor-pointer ${txType === "expense" ? "bg-white/10 text-rose-300 border border-white/10" : "text-slate-500 hover:text-slate-300"}`}
            >
              Nuevo Gasto
            </button>
            <button
              onClick={() => setTxType("income")}
              className={`py-2 text-[11px] font-semibold transition-all rounded-xl cursor-pointer ${txType === "income" ? "bg-white/10 text-emerald-300 border border-white/10" : "text-slate-500 hover:text-slate-300"}`}
            >
              Nuevo Ingreso
            </button>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-4">
            {formError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-rose-300 text-[10px] rounded-xl">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-350 text-[10px] rounded-xl">
                {formSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Monto ($)</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-xs text-white transition-all"
                />
              </div>
            </div>

            {txType === "expense" && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Categoría</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full pl-9 pr-8 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="comida">Comida y Alimentos</option>
                    <option value="transporte">Transporte y Viajes</option>
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="estudio">Educación y Estudio</option>
                    <option value="salud">Salud y Bienestar</option>
                    <option value="otros">Otros Gastos</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Fecha del Movimiento</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Descripción o Detalle</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Supermercado Jumbo"
                className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 ${txType === "expense" ? "bg-rose-600 hover:bg-rose-550" : "bg-emerald-600 hover:bg-emerald-550"} text-white text-xs font-semibold rounded-xl tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow-lg hover:translate-y-[-1px]`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar {txType === "expense" ? "Gasto" : "Ingreso"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* 3. Bottom Row: Category expenditures & AI recommendation block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category distribution Pie chart */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">Expensas por Categoría</h3>
          
          {chartCategoryData.length > 0 ? (
            <div className="relative flex-1 flex flex-col items-center justify-center h-48">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: 11 }}
                  />
                  <Pie
                    data={chartCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total</span>
                <span className="text-sm font-bold text-white">${totalExpenses.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center p-4 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl mb-4">
              <p className="text-[10px] text-slate-500 leading-tight">Sin consumos cargados para analizar su segmentación.</p>
            </div>
          )}

          {/* Map of categories and custom totals */}
          <div className="space-y-1.5 mt-2">
            {Object.keys(COLORS).map((catName) => {
              const total = categoryTotals[catName] || 0;
              const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
              const color = COLORS[catName as ExpenseCategory];
              
              return (
                <div key={catName} className="flex items-center justify-between text-[11px] hover:bg-white/5 p-1 px-1.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                    <span className="text-slate-300 capitalize">{catName}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-white font-semibold">${total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                    <span className="text-[9px] font-mono text-slate-500">({pct.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Registered Movements table instead of AI recommendation */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 mb-4">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400">Últimos Movimientos</h3>
            <p className="text-slate-500 text-[11px] leading-tight mt-1">Los 5 movimientos registrados más recientes en tu libro diario.</p>
          </div>

          <div className="relative z-10 flex-1 overflow-x-auto min-h-[160px] flex flex-col justify-center">
            {recentMovements.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-mono tracking-wider text-slate-500 uppercase">
                    <th className="py-2.5 font-medium">Fecha</th>
                    <th className="py-2.5 font-medium">Detalle</th>
                    <th className="py-2.5 font-medium">Categoría</th>
                    <th className="py-2.5 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentMovements.map((item) => {
                    const isExpense = item.type === "expense";
                    const isSavings = checkIsSavingsFund(item.description);
                    return (
                      <tr key={item.id} className="text-xs hover:bg-white/5 transition-colors">
                        <td className="py-2.5 text-slate-400 font-mono">{item.date}</td>
                        <td className="py-2.5 font-medium text-slate-250">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px] sm:max-w-xs">{item.description}</span>
                            {isSavings && (
                              <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-wider">
                                Ahorro
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5">
                          {isExpense ? (
                            <span className="capitalize px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/5 text-slate-350">
                              {(item as any).category}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                              Ingreso
                            </span>
                          )}
                        </td>
                        <td className={`py-2.5 text-right font-bold font-mono ${isExpense ? "text-rose-400" : "text-emerald-400"}`}>
                          {isExpense ? "-" : "+"}${item.amount.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 flex flex-col items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-650 mb-2.5" />
                <p className="text-slate-300 text-xs font-semibold">¿Sin transacciones cargadas aún?</p>
                <p className="text-slate-500 text-[10px] max-w-[320px] mt-1 leading-normal">Usa el formulario de "Registro Rápido" en la parte superior para registrar tus primeros ingresos o gastos.</p>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[10px] text-slate-500 relative z-10 flex justify-between">
            <span>Sincronizado automáticamente en Firestore</span>
            <span>Estable y autónomo</span>
          </div>
        </div>

      </div>

    </div>
  );
}
export default DashboardView;
