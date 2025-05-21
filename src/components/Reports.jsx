// client/src/pages/Sales.jsx – גרסה מתוקנת עם חישוב כולל מע"מ ורווח בפועל + גרף Pie משודרג + תצוגה רק בלחיצה
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { toast } from "react-toastify";
import { getVatRate, setVatRate } from "../components/vatConfig";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";


import "../assets/styles/reports.css";

function Sales() {
  const { user } = useContext(AuthContext);
  const [vatInput, setVatInput] = useState(getVatRate());

  const [profitStart, setProfitStart] = useState("");
  const [profitEnd, setProfitEnd] = useState("");
  const [actualProfit, setActualProfit] = useState(null);
  const [profitDetails, setProfitDetails] = useState([]);
  const [showProfitTable, setShowProfitTable] = useState(false);
  const [incomeDate, setIncomeDate] = useState("");
  const [income, setIncome] = useState(0);
  const [incomes, setIncomes] = useState([]);
  const [incomeStart, setIncomeStart] = useState("");
  const [incomeEnd, setIncomeEnd] = useState("");
  const [incomeSum, setIncomeSum] = useState(0);
  const [incomeVat, setIncomeVat] = useState(null);
  const [showIncomeResult, setShowIncomeResult] = useState(false);

  const [expenseDate, setExpenseDate] = useState("");
  const [expense, setExpense] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [expenseStart, setExpenseStart] = useState("");
  const [expenseEnd, setExpenseEnd] = useState("");
  const [expenseSum, setExpenseSum] = useState(0);
  const [expenseVat, setExpenseVat] = useState(null);
  const [showExpenseResult, setShowExpenseResult] = useState(false);
  

  useEffect(() => {
    fetch("/profits/income", { credentials: "include" })
      .then((res) => res.json())
      .then(setIncomes);
    fetch("/profits/expenses", { credentials: "include" })
      .then((res) => res.json())
      .then(setExpenses);
  }, []);

  const sumInRange = (arr, from, to, key) => {
    const start = new Date(from);
    const end = new Date(to);
    return arr.reduce((sum, item) => {
      const d = new Date(item.date);
      return d >= start && d <= end ? sum + Number(item[key]) : sum;
    }, 0);
  };

  const calculateVat = (amount) => {
    const rate = getVatRate();
    const vat = amount * (rate / 100);
    const total = amount + vat;
    return { vat, total, rate };
  };

  const handleSave = async (url, data, msg, reload) => {
    if (!data.date) return toast.error("יש לבחור תאריך לפני שמירה");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.status === 409)
        return toast.error(result.message || "כבר קיים לרשומה תאריך זה");
      if (!res.ok) throw new Error();
      toast.success(msg);
      reload();
    } catch {
      toast.error("שגיאה בשמירה לשרת");
    }
  };

  const handleReport = async (
    start,
    end,
    total,
    type = "profit",
    vat = 0,
    totalWithVat = 0
  ) => {
    let endpoint = "/profits/send-report";
    if (type === "income") endpoint = "/profits/send-income-report";
    if (type === "expense") endpoint = "/profits/send-expense-report";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          total,
          vat,
          totalWithVat,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("נשלח דוח למייל");
    } catch {
      toast.error("שגיאה בשליחת הדוח");
    }
  };

  const handleIncomeCalc = () => {
    const sum = sumInRange(incomes, incomeStart, incomeEnd, "amount");
    setIncomeSum(sum);
    setIncomeVat(calculateVat(sum));
    setShowIncomeResult(true);
  };

  const handleExpenseCalc = () => {
    const sum = sumInRange(expenses, expenseStart, expenseEnd, "amount");
    setExpenseSum(sum);
    setExpenseVat(calculateVat(sum));
    setShowExpenseResult(true);
  };

  const calculateActualProfit = () => {
    if (!profitStart || !profitEnd) return toast.error("יש לבחור טווח תאריכים");
    const totalIncome = sumInRange(incomes, profitStart, profitEnd, "amount");
    const totalExpense = sumInRange(expenses, profitStart, profitEnd, "amount");
    const netProfit = totalIncome - totalExpense;
    setActualProfit(netProfit);








    
    setProfitDetails([
      { type: "סה״כ הכנסות", amount: totalIncome },
      { type: "סה״כ הוצאות", amount: totalExpense },
      { type: "רווח נקי", amount: netProfit },
    ]);
    setShowProfitTable(true);
  };

  const chartData = [
    { name: "הכנסות", value: incomeSum },
    { name: "הוצאות", value: expenseSum },
    { name: "רווח", value: actualProfit || 0 },
  ];
  const chartColors = {
    הכנסות: "#00C49F", // ירוק
    הוצאות: "#FF8042", // כתום
    רווח: "#0088FE", // כחול
  };
  const COLORS = ["#00C49F", "#FF8042", "#0088FE"];
  const [chartType, setChartType] = useState("Pie");

  return (
    <div className="sales-wrapper">
      {user?.role === "admin" && (
        <div className="vat-box">
          <label>עידכון מע""מ:</label>
          <input
            type="number"
            value={vatInput}
            onChange={(e) => setVatInput(e.target.value)}
          />
          <span>%</span>
          <button
            className="vat-update-btn"
            onClick={() => {
              const val = parseFloat(vatInput);
              if (isNaN(val) || val < 0 || val > 100)
                return toast.error("ערך שגוי");
              setVatRate(val);
              toast.success("עודכן ל" + val + "%");
            }}
          >
            עדכן
          </button>
        </div>
      )}

      <div className="section-grid">
        {/* === הכנסות === */}
        <div className="section">
          <h2>הכנסות</h2>
          <label>תאריך</label>
          <input
            type="date"
            value={incomeDate}
            onChange={(e) => setIncomeDate(e.target.value)}
          />
          <label>סכום</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
          />
          <button
            onClick={() =>
              handleSave(
                "/profits/income/add",
                { date: incomeDate, amount: income },
                "הכנסה נשמרה",
                () =>
                  fetch("/profits/income", { credentials: "include" })
                    .then((res) => res.json())
                    .then(setIncomes)
              )
            }
          >
            שמור
          </button>
          <input
            type="date"
            value={incomeStart}
            onChange={(e) => setIncomeStart(e.target.value)}
          />
          <input
            type="date"
            value={incomeEnd}
            onChange={(e) => setIncomeEnd(e.target.value)}
          />
          <button onClick={handleIncomeCalc}>חשב</button>

          {showIncomeResult && incomeVat && (
            <div className="profit-table">
              <table>
                <thead>
                  <tr>
                    <th>סוג</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>סה"כ הכנסות לפני מע"מ</td>
                    <td>₪{incomeSum.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>מע"מ ({incomeVat.rate}%)</td>
                    <td>₪{incomeVat.vat.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>סה"כ כולל מע"מ</td>
                    <td>₪{incomeVat.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <button
                onClick={() =>
                  handleReport(
                    incomeStart,
                    incomeEnd,
                    incomeSum,
                    "income",
                    incomeVat?.vat,
                    incomeVat?.total
                  )
                }
              >
                שלח דוח
              </button>
            </div>
          )}
        </div>

        {/* === הוצאות === */}
        <div className="section">
          <h2>הוצאות</h2>
          <label>תאריך</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
          <label>סכום</label>
          <input
            type="number"
            value={expense}
            onChange={(e) => setExpense(Number(e.target.value))}
          />
          <button
            onClick={() =>
              handleSave(
                "/profits/expense/add",
                { date: expenseDate, amount: expense },
                "הוצאה נשמרה",
                () =>
                  fetch("/profits/expenses", { credentials: "include" })
                    .then((res) => res.json())
                    .then(setExpenses)
              )
            }
          >
            שמור
          </button>
          <input
            type="date"
            value={expenseStart}
            onChange={(e) => setExpenseStart(e.target.value)}
          />
          <input
            type="date"
            value={expenseEnd}
            onChange={(e) => setExpenseEnd(e.target.value)}
          />
          <button onClick={handleExpenseCalc}>חשב</button>

          {showExpenseResult && expenseVat && (
            <div className="profit-table">
              <table>
                <thead>
                  <tr>
                    <th>סוג</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>סה"כ הוצאות לפני מע"מ</td>
                    <td>₪{expenseSum.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>מע"מ ({expenseVat.rate}%)</td>
                    <td>₪{expenseVat.vat.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>סה"כ כולל מע"מ</td>
                    <td>₪{expenseVat.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <button
                onClick={() =>
                  handleReport(
                    expenseStart,
                    expenseEnd,
                    expenseSum,
                    "expense",
                    expenseVat?.vat,
                    expenseVat?.total
                  )
                }
              >
                שלח דוח
              </button>
            </div>
          )}
        </div>

        {/* === רווח בפועל === */}
        <div className="section">
          <h2>רווח בפועל</h2>
          <label>מתאריך</label>
          <input
            type="date"
            value={profitStart}
            onChange={(e) => setProfitStart(e.target.value)}
          />
          <label>עד תאריך</label>
          <input
            type="date"
            value={profitEnd}
            onChange={(e) => setProfitEnd(e.target.value)}
          />
          <button onClick={calculateActualProfit}>הצג רווחים</button>
          {actualProfit !== null && (
            <p>
              {actualProfit > 0
                ? `רווח בפועל: ₪${actualProfit.toLocaleString()}`
                : "אין רווחים בתאריכים האלו"}
            </p>
          )}

          {showProfitTable && (
            <div className="profit-table">
              <table>
                <thead>
                  <tr>
                    <th>סוג</th>
                    <th>סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {profitDetails.map((row, index) => (
                    <tr key={index}>
                      <td>{row.type}</td>
                      <td>₪{row.amount.toLocaleString()}</td>
                    </tr>
                  ))}

                  {/* הוספת שורת מע"מ ורווח כולל מע"מ */}
                  <tr>
                    <td>סה"כ מע"מ ({getVatRate()}%)</td>
                    <td>₪{calculateVat(actualProfit).vat.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>רווח נקי כולל מע"מ</td>
                    <td>
                      ₪{calculateVat(actualProfit).total.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <button
                onClick={() => {
                  const vatDetails = calculateVat(actualProfit);
                  handleReport(
                    profitStart,
                    profitEnd,
                    actualProfit,
                    "profit",
                    vatDetails.vat,
                    vatDetails.total
                  );
                }}
              >
                שלח דוח רווחים
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 30 }}>
        <label style={{ marginLeft: 10 }}>בחר סוג גרף:</label>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{ padding: "5px", borderRadius: "5px" }}
        >
          <option value="Pie">Pie</option>
          <option value="Bar">Bar</option>
          <option value="Line">Line</option>
          <option value="Area">Area</option>
          <option value="RadialBar">RadialBar</option>
          <option value="Composed">Composed</option>
        </select>
      </div>

      <div style={{ width: "100%", height: 360, marginTop: 40 }}>
        <ResponsiveContainer>
          {chartType === "Pie" && (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}

          {chartType === "Bar" && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={chartColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          )}

          {chartType === "Line" && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          )}

          {chartType === "Area" && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          )}

          {chartType === "RadialBar" && (
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              barSize={10}
              data={chartData}
            >
              <RadialBar
                minAngle={15}
                label={{ position: "insideStart", fill: "#fff" }}
                background
                clockWise
                dataKey="value"
              />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
              <Tooltip />
            </RadialBarChart>
          )}

          {chartType === "Composed" && (
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                fill="#8884d8"
                stroke="#8884d8"
              />
              <Bar dataKey="value" barSize={20} fill="#413ea0" />
              <Line type="monotone" dataKey="value" stroke="#ff7300" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Sales;
