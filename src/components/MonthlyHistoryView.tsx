import React, { useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  DollarSign, 
  Info,
  Coins,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export function MonthlyHistoryView() {
  const { 
    expenses, 
    incomes, 
    addExpense, 
    addIncome 
  } = useFinance();

  // Quick savings aporte status
  const [aporteType, setAporteType] = useState<"deposit" | "withdraw">("deposit");
  const [aporteAmount, setAporteAmount] = useState("");
  const [aporteNote, setAporteNote] = useState("");
  const [savingLoading, setSavingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Group transactions by month
  // We extract month as "YYYY-MM"
  const getYearMonth = (dateStr: string) => {
    return dateStr.slice(0, 7); // "YYYY-MM"
  };

  // Human month parser
  const getMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-");
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 15);
    return dateObj.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  };

  // Compute Ahorro and Fondo metrics
  // Any Income/Expense with "[Fondo de Ahorro]" or "Aporte al Fondo de Ahorro" in description is designated to direct savings fund
  const checkIsSavingsFund = (description: string) => {
    const descLower = description.toLowerCase();
    return descLower.includes("[fondo de ahorro]") || descLower.includes("fondo de ahorro") || descLower.includes("[ahorro]");
  };

  // General metrics
  const totalIncomesHistory = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpensesHistory = expenses.reduce((sum, item) => sum + item.amount, 0);
  const currentTotalAhorro = totalIncomesHistory - totalExpensesHistory;

  // Fondo de Ahorro specific metrics (Aportes are recorded as Expenses, Withdrawals are recorded as Incomes)
  const totalSavingsDeposits = expenses
    .filter(e => checkIsSavingsFund(e.description))
    .reduce((sum, item) => sum + item.amount, 0);

  const totalSavingsWithdrawals = incomes
    .filter(i => checkIsSavingsFund(i.description))
    .reduce((sum, item) => sum + item.amount, 0);

  const totalFondoDeAhorro = totalSavingsDeposits - totalSavingsWithdrawals;

  // Compile monthly breakdown
  const uniqueMonths = Array.from(
    new Set([
      ...incomes.map(i => getYearMonth(i.date)),
      ...expenses.map(e => getYearMonth(e.date))
    ])
  ).sort((a, b) => b.localeCompare(a)); // Descending order (newest first)

  const monthlyBreakdown = uniqueMonths.map(month => {
    const monthIncomesList = incomes.filter(i => getYearMonth(i.date) === month);
    const monthExpensesList = expenses.filter(e => getYearMonth(e.date) === month);

    const monthIncomes = monthIncomesList.reduce((sum, item) => sum + item.amount, 0);
    const monthExpenses = monthExpensesList.reduce((sum, item) => sum + item.amount, 0);
    const monthSavings = monthIncomes - monthExpenses;
    const monthSavingsRate = monthIncomes > 0 ? (monthSavings / monthIncomes) * 100 : 0;

    // Aportes & retiros to savings fund in this month (Aportes are Expenses, Retiros are Incomes)
    const monthAportes = monthExpensesList
      .filter(e => checkIsSavingsFund(e.description))
      .reduce((sum, item) => sum + item.amount, 0);

    const monthRetiros = monthIncomesList
      .filter(i => checkIsSavingsFund(i.description))
      .reduce((sum, item) => sum + item.amount, 0);

    const netAporteFondo = monthAportes - monthRetiros;

    return {
      monthKey: month,
      monthLabel: getMonthLabel(month),
      incomes: monthIncomes,
      expenses: monthExpenses,
      savings: monthSavings,
      savingsRate: monthSavingsRate,
      aportesFondo: monthAportes,
      retirosFondo: monthRetiros,
      netAporteFondo: netAporteFondo
    };
  });

  // Chart data in ascending chronological order (oldest first for progression left-to-right)
  const chartData = [...monthlyBreakdown].reverse().map(item => ({
    name: item.monthLabel.split(" de ")[0].toUpperCase(), // Just the month name
    Ingresos: item.incomes,
    Egresos: item.expenses,
    Ahorro: item.savings
  }));

  // Handle Quick Fondo de Ahorro contribution
  const handleAporteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amt = parseFloat(aporteAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Ingresa un monto válido mayor a 0.");
      return;
    }

    setSavingLoading(true);
    const currentDate = new Date().toISOString().split("T")[0];
    const categoryTag = "[Fondo de Ahorro]";
    const customDescription = `${categoryTag} ${aporteNote.trim() || (aporteType === "deposit" ? "Aporte mensual manual" : "Retiro de fondos")}`;

    try {
      if (aporteType === "deposit") {
        // Adding savings deposit as an expense (comes OUT of general income/balance)
        await addExpense({
          amount: amt,
          category: "otros",
          date: currentDate,
          description: customDescription
        });
        setSuccessMsg(`¡Aporte de $${amt.toLocaleString("es-CL")} guardado en tu Fondo de Ahorro con éxito!`);
      } else {
        // Adding savings withdrawal back to pocket as an income
        await addIncome({
          amount: amt,
          date: currentDate,
          description: customDescription
        });
        setSuccessMsg(`¡Retiro de $${amt.toLocaleString("es-CL")} del Fondo de Ahorro e ingresado a tu caja general exitosamente!`);
      }

      setAporteAmount("");
      setAporteNote("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("No se pudo registrar el aporte. Intenta de nuevo.");
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Core Savings Counter widget banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Ahorro Histórico (General) */}
        <div className="bg-gradient-to-br from-indigo-950/20 to-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ahorro Histórico Acumulado</span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight mt-3">
            ${currentTotalAhorro.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-tight flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>Balance total restante (Ingresos menos Egresos totales)</span>
          </p>
        </div>

        {/* Total Ingresado al Fondo de Ahorro */}
        <div className="bg-gradient-to-br from-violet-950/20 to-white/5 border border-white/10 backdrop-blur-md p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Ingresado al Fondo</span>
            <div className="p-2.5 bg-violet-550/10 rounded-xl text-violet-400 border border-violet-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight mt-3">
            ${totalSavingsDeposits.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-tight flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Total neto depositado históricamente al fondo</span>
          </p>
        </div>

        {/* Total Neto Actual en el Fondo (Contador Principal) */}
        <div className="bg-gradient-to-br from-emerald-950/20 to-white/5 border border-emerald-500/15 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-colors"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-405 tracking-wide uppercase">Total Disponible en Fondo</span>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-305 border border-emerald-500/35 shadow-lg shadow-emerald-500/10 animate-pulse">
              <PiggyBank className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight mt-3">
            ${totalFondoDeAhorro.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-tight flex items-center gap-1 font-medium">
            <span className="text-emerald-400 font-bold">Activo Principal</span> - Disponible para contingencia o inversión
          </p>
        </div>

      </div>

      {/* 2. Form and Charts Layout Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: interactive form to control the Fondo de Ahorro */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestión del Fondo</h3>
            </div>
            <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
              Realiza aportes de capital a tu fondo de ahorro para blindar tu patrimonio, o registra retiros justificados en caso de imprevistos.
            </p>

            <form onSubmit={handleAporteSubmit} className="space-y-4">
              {/* Toggle deposit vs withdrawal */}
              <div className="flex p-1 bg-black/20 border border-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAporteType("deposit")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    aporteType === "deposit" 
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
                  Aportar
                </button>
                <button
                  type="button"
                  onClick={() => setAporteType("withdraw")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    aporteType === "withdraw" 
                      ? "bg-rose-500/10 border border-rose-500/25 text-rose-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 inline mr-1" />
                  Retirar
                </button>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Monto del Movimiento ($)</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</div>
                  <input
                    type="number"
                    step="0.01"
                    value={aporteAmount}
                    onChange={(e) => setAporteAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Detalle o Motivo</label>
                <input
                  type="text"
                  value={aporteNote}
                  onChange={(e) => setAporteNote(e.target.value)}
                  placeholder="Ej. Ahorro de emergencia de Mayo"
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-white transition-all"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-950/35 border border-red-500/20 text-rose-300 text-[10px] rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-950/35 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-xl flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingLoading}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  aporteType === "deposit"
                    ? "bg-emerald-550/80 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 active:scale-95 duration-200"
                    : "bg-rose-550/80 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/10 active:scale-95 duration-200"
                }`}
              >
                {savingLoading ? "Registrando..." : (aporteType === "deposit" ? "Confirmar Aporte" : "Confirmar Retiro")}
              </button>
            </form>
          </div>
          <div className="pt-4 border-t border-white/5 mt-4 text-[9px] text-slate-500 leading-tight">
            ※ Nota: Los movimientos del fondo de ahorro se registran de manera automática en tu Libro Contable y participan en los informes y análisis mensuales de tus finanzas.
          </div>
        </div>

        {/* Right Side: Recharts BarChart showing history monthly metrics */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-305 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Gráfica Comparativa Histórica
              </h3>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Progresión por mes</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              Monitorea el equilibrio entre tus ingresos reales (izq.), egresos (centro) y el ahorro neto resultante de cada mes (der.).
            </p>
          </div>

          <div className="h-48 md:h-52 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "rgba(10, 12, 20, 0.95)", 
                      borderColor: "rgba(255, 255, 255, 0.1)", 
                      borderRadius: "16px",
                      backdropFilter: "blur(12px)",
                      color: "#fff",
                      fontSize: "10px"
                    }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={28} 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} 
                  />
                  <Bar dataKey="Ingresos" fill="rgba(16, 185, 129, 0.75)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresos" fill="rgba(239, 68, 68, 0.75)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ahorro" fill="rgba(99, 102, 241, 0.8)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-slate-500 text-xs">Aún no hay suficientes meses registrados con transacciones.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Monthly History Table */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-black/10 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Registro Histórico de Auditorías Mensuales
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            {monthlyBreakdown.length} periodos auditables
          </span>
        </div>

        {monthlyBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 border-b border-white/5 font-mono tracking-wider text-[10px] uppercase">
                  <th className="py-3.5 px-6 font-semibold">Periodo Mensual</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Ingresos Totales</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Gastos Totales</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Ahorro Neto</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Tasa de Ahorro</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Aporte al Fondo</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Detalle de Ahorro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {monthlyBreakdown.map((item) => (
                  <tr key={item.monthKey} className="hover:bg-white/5 transition-colors">
                    
                    {/* Period label */}
                    <td className="py-4 px-6 font-bold text-slate-100 capitalize">
                      {item.monthLabel}
                    </td>

                    {/* Incomes */}
                    <td className="py-4 px-6 text-right font-semibold text-emerald-450">
                      ${item.incomes.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Expenses */}
                    <td className="py-4 px-6 text-right font-semibold text-rose-455">
                      ${item.expenses.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net Savings */}
                    <td className={`py-4 px-6 text-right font-bold text-sm ${item.savings >= 0 ? "text-white" : "text-rose-400"}`}>
                      ${item.savings.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Savings Rate badge */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.savingsRate >= 20 
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                          : item.savingsRate > 0 
                            ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20" 
                            : "text-red-400 bg-red-500/10 border border-red-500/20"
                      }`}>
                        {item.savingsRate.toFixed(1)}%
                      </span>
                    </td>

                    {/* Contribution to Savings Fund */}
                    <td className={`py-4 px-6 text-right font-bold ${item.netAporteFondo > 0 ? "text-indigo-400" : item.netAporteFondo < 0 ? "text-rose-400" : "text-slate-500"}`}>
                      {item.netAporteFondo > 0 ? "+" : ""}${item.netAporteFondo.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status commentary indicator */}
                    <td className="py-4 px-6 text-center">
                      {item.savingsRate >= 20 ? (
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">EXCELENTE AHORRO</span>
                      ) : item.savingsRate > 0 ? (
                        <span className="text-[9px] font-semibold text-yellow-400 bg-yellow-500/5 px-2 py-1 rounded-md border border-yellow-500/10">AJUSTADO</span>
                      ) : (
                        <span className="text-[9px] font-semibold text-red-400 bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10">ALERTA DÉFICIT</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="w-10 h-10 text-slate-700 mb-2.5 animate-pulse" />
            <p className="text-slate-350 text-xs font-semibold">No hay movimientos o periodos que procesar.</p>
            <p className="text-slate-500 text-[10px] mt-1 max-w-sm leading-relaxed">Comienza registrando tus primeros ingresos y gastos desde la barra de acceso rápido del Dashboard o realiza aportes financieros a tu fondo de ahorro para arrancar.</p>
          </div>
        )}
      </div>

    </div>
  );
}
