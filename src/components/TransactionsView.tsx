import React, { useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { 
  Search, 
  Trash2, 
  Edit3, 
  FileDown, 
  Filter, 
  Calendar, 
  Tags, 
  TrendingDown, 
  TrendingUp,
  X,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { Expense, Income, ExpenseCategory } from "../types";
import { jsPDF } from "jspdf";

export function TransactionsView() {
  const { 
    expenses, 
    incomes, 
    editExpense, 
    deleteExpense, 
    editIncome, 
    deleteIncome 
  } = useFinance();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expenses" | "incomes">("all");
  const [catFilter, setCatFilter] = useState<"all" | ExpenseCategory>("all");
  const [monthFilter, setMonthFilter] = useState(""); // YYYY-MM format

  // For Edit Modal
  const [editingItem, setEditingItem] = useState<{
    id: string;
    type: "expense" | "income";
    amount: string;
    category?: ExpenseCategory;
    date: string;
    description: string;
  } | null>(null);

  const [editError, setEditError] = useState<string | null>(null);

  // Filters calculation
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = catFilter === "all" || e.category === catFilter;
    const matchesMonth = !monthFilter || e.date.startsWith(monthFilter);
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const filteredIncomes = incomes.filter((i) => {
    const matchesSearch = i.description.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = !monthFilter || i.date.startsWith(monthFilter);
    // Incomes have no expense category, but can matchesCategory if "all"
    const matchesCategory = catFilter === "all"; 
    return matchesSearch && matchesCategory && matchesMonth;
  });

  // Combine lists for complete history view
  const combinedList = [
    ...(typeFilter === "all" || typeFilter === "expenses" ? filteredExpenses.map(e => ({ ...e, recordType: "expense" as const })) : []),
    ...(typeFilter === "all" || typeFilter === "incomes" ? filteredIncomes.map(i => ({ ...i, recordType: "income" as const })) : [])
  ].sort((a, b) => b.date.localeCompare(a.date));

  const handleEditClick = (item: any) => {
    setEditingItem({
      id: item.id,
      type: item.recordType,
      amount: item.amount.toString(),
      category: item.category,
      date: item.date,
      description: item.description
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const numAmount = parseFloat(editingItem.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEditError("Ingresa un monto válido mayor a 0.");
      return;
    }
    if (!editingItem.description.trim()) {
      setEditError("La descripción no puede estar vacía.");
      return;
    }

    try {
      if (editingItem.type === "expense") {
        await editExpense(editingItem.id, {
          amount: numAmount,
          category: editingItem.category,
          date: editingItem.date,
          description: editingItem.description.trim()
        });
      } else {
        await editIncome(editingItem.id, {
          amount: numAmount,
          date: editingItem.date,
          description: editingItem.description.trim()
        });
      }
      setEditingItem(null);
    } catch (err: any) {
      setEditError("Ocurrió un error al actualizar los datos en Firestore.");
    }
  };

  const handleDeleteClick = async (id: string, type: "expense" | "income") => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento permanentemente?")) {
      try {
        if (type === "expense") {
          await deleteExpense(id);
        } else {
          await deleteIncome(id);
        }
      } catch (err) {
        console.error("Error deleting transaction:", err);
      }
    }
  };

  // Client-Side PDF Export Generation logic
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Set colors & titles
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // deep slate
    doc.text("S'C ENGINEER :: Smart Expense Tracker Pro", 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reporte de Auditoría Financiera - Generado: ${new Date().toLocaleString()}`, 14, 25);
    doc.line(14, 28, 196, 28);

    // Let's identify the active month
    let targetMonth = monthFilter;
    if (!targetMonth) {
      // Find the most recent date in either incomes or expenses
      const allDates = [...incomes.map(i => i.date), ...expenses.map(e => e.date)].sort();
      if (allDates.length > 0) {
        targetMonth = allDates[allDates.length - 1].slice(0, 7); // Get "YYYY-MM" of most recent transaction
      } else {
        targetMonth = new Date().toISOString().slice(0, 7); // Default to current month
      }
    }

    const [year, month] = targetMonth.split("-");
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 15);
    const monthLabelFull = dateObj.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();

    // Calculate total incomes and expenses for this specific month
    const monthIncomes = incomes.filter(i => i.date.startsWith(targetMonth)).reduce((sum, item) => sum + item.amount, 0);
    const monthExpenses = expenses.filter(e => e.date.startsWith(targetMonth)).reduce((sum, item) => sum + item.amount, 0);
    const monthBalance = monthIncomes - monthExpenses;

    // Background card for monthly summary representing total spent and total incomes in the month
    doc.setFillColor(241, 245, 249); // light blue-gray background container
    doc.roundedRect(14, 32, 182, 22, 3, 3, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`RESUMEN FINANCIERO MENSUAL: ${monthLabelFull}`, 18, 38);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Ingreso del Mes:", 18, 44);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(21, 128, 61); // emerald green
    doc.text(`$${monthIncomes.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 44, 44);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Gasto del Mes:", 18, 49);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(225, 29, 72); // rose red
    doc.text(`$${monthExpenses.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 44, 49);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Ahorro Neto:", 115, 44);
    doc.setFont("Helvetica", "bold");
    if (monthBalance >= 0) {
      doc.setTextColor(21, 128, 61);
      doc.text(`+$${monthBalance.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 138, 44);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text(`-$${Math.abs(monthBalance).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 138, 44);
    }

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Registros Filtrados: ${combinedList.length} ítems`, 115, 49);
    
    // Draw table header backplate
    doc.setFillColor(79, 70, 229); // indigo fill
    doc.rect(14, 58, 182, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Fecha", 17, 63);
    doc.text("Tipo", 45, 63);
    doc.text("Categoría / Descripción", 75, 63);
    doc.text("Monto ($)", 172, 63);

    let y = 73;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    combinedList.forEach((item, index) => {
      // Alternate rows
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 7, "F");
      }

      doc.text(item.date, 17, y);
      doc.text(item.recordType === "income" ? "Ingreso" : "Gasto", 45, y);
      
      const categoryLabel = item.recordType === "expense" ? `[${(item as any).category.toUpperCase()}] ` : "";
      doc.text(`${categoryLabel}${item.description}`, 75, y);

      if (item.recordType === "expense") {
        doc.setTextColor(225, 29, 72); // rose red
        doc.text(`-$${item.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}`, 172, y);
      } else {
        doc.setTextColor(21, 128, 61); // emerald green
        doc.text(`+$${item.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}`, 172, y);
      }
      doc.setTextColor(51, 65, 85); // Reset slate color

      y += 7;

      // Wrap page margins limit
      if (y > 280) {
        doc.addPage();
        y = 30;
      }
    });

    // Save outputs
    doc.save(`S_C_ENGINEER_Reporte_Financiero_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const getCategoryBadgeColor = (cat: ExpenseCategory) => {
    const map = {
      comida: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      transporte: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      entretenimiento: "bg-pink-500/10 text-pink-400 border-pink-500/25",
      estudio: "bg-purple-500/10 text-purple-400 border-purple-500/25",
      salud: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      otros: "bg-slate-500/10 text-slate-400 border-slate-500/25"
    };
    return map[cat] || "bg-slate-700 text-slate-300";
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters panel */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Dynamic search input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descripción..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-white transition-all"
            />
          </div>

          {/* Action trigger: Export PDF Report */}
          <button
            onClick={handleExportPDF}
            disabled={combinedList.length === 0}
            className="w-full md:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Estado a PDF</span>
          </button>

        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4 pt-4 border-t border-white/5">
          
          {/* 1. Transaction Type */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Tipo de Movimiento</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-300 cursor-pointer appearance-none"
            >
              <option value="all">Todos los registros</option>
              <option value="expenses">Egresos / Gastos únicamente</option>
              <option value="incomes">Ingresos / Entradas únicamente</option>
            </select>
          </div>

          {/* 2. Categorization */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Categoría (Gastos)</label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-300 cursor-pointer appearance-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="comida">Comida y Alimentos</option>
              <option value="transporte">Transporte y Viajes</option>
              <option value="entretenimiento">Entretenimiento</option>
              <option value="estudio">Educación y Estudio</option>
              <option value="salud">Salud y Bienestar</option>
              <option value="otros">Otros Gastos</option>
            </select>
          </div>

          {/* 3. Monthly Period (YYYY-MM) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Filtrar por Período</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-300 cursor-pointer [color-scheme:dark]"
            />
          </div>

        </div>
      </div>

      {/* Ledger Records Grid */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-black/10 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300">Libro Contable de Movimientos</h3>
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            {combinedList.length} movimientos resultantes
          </span>
        </div>

        {combinedList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 border-b border-white/5 font-mono tracking-wider text-[10px] uppercase">
                  <th className="py-3.5 px-5 font-semibold">Fecha</th>
                  <th className="py-3.5 px-5 font-semibold">Tipo</th>
                  <th className="py-3.5 px-5 font-semibold">Categoría</th>
                  <th className="py-3.5 px-5 font-semibold">Descripción o Motivo</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Monto</th>
                  <th className="py-3.5 px-5 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {combinedList.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    
                    {/* Date */}
                    <td className="py-3.5 px-5 font-medium text-slate-350">{item.date}</td>
                    
                    {/* Type Indicator */}
                    <td className="py-3.5 px-5">
                      {item.recordType === "income" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          Ingreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                          <TrendingDown className="w-3 h-3" />
                          Egreso
                        </span>
                      )}
                    </td>

                    {/* Category Label */}
                    <td className="py-3.5 px-5 select-none">
                      {item.recordType === "expense" ? (
                        <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-md capitalize ${getCategoryBadgeColor((item as Expense).category)}`}>
                          {(item as Expense).category}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                          Ingreso Fijo
                        </span>
                      )}
                    </td>

                    {/* Target description */}
                    <td className="py-3.5 px-5 text-slate-200 font-medium truncate max-w-[200px]" title={item.description}>
                      {item.description}
                    </td>

                    {/* Value */}
                    <td className={`py-3.5 px-5 text-right font-bold text-sm ${item.recordType === "income" ? "text-emerald-450" : "text-rose-450"}`}>
                      {item.recordType === "income" ? "+" : "-"}${item.amount.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Controls triggers */}
                    <td className="py-3.5 px-5 text-center font-sans">
                      <div className="inline-flex items-center justify-center gap-2">
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 rounded-lg cursor-pointer transition-all"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(item.id, item.recordType)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer transition-all"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-slate-650 mb-2.5 animate-pulse" />
            <p className="text-slate-350 text-xs font-semibold">No se encontraron movimientos registrados</p>
            <p className="text-slate-500 text-[10px] mt-1 max-w-sm leading-relaxed">Prueba modificando tus parámetros de filtros o ingresa nuevos registros desde la barra de acceso rápido del Dashboard.</p>
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-[#05060b]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#0a0c14]/90 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white uppercase flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Editar {editingItem.type === "expense" ? "Gasto" : "Ingreso"}
              </h4>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-rose-300 text-[10px] rounded-xl">
                  {editError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.amount}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-white transition-all"
                />
              </div>

              {editingItem.type === "expense" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Categoría</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all cursor-pointer appearance-none"
                  >
                    <option value="comida">Comida y Alimentos</option>
                    <option value="transporte">Transporte y Viajes</option>
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="estudio">Educación y Estudio</option>
                    <option value="salud">Salud y Bienestar</option>
                    <option value="otros">Otros Gastos</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Fecha del Movimiento</label>
                <input
                  type="date"
                  value={editingItem.date}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-550">Descripción o Detalle</label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/10 focus:border-indigo-500 rounded-xl outline-none text-xs text-slate-200 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15 hover:translate-y-[-1px]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
export default TransactionsView;
