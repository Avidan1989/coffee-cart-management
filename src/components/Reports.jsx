// client/src/pages/Sales.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../assets/styles/sales.css";

function Sales() {
  const [dailyProfit, setDailyProfit] = useState(0);
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [profits, setProfits] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    fetchProfits();
  }, []);

  const fetchProfits = async () => {
    try {
      const response = await fetch("http://localhost:8801/profits", {
        credentials: "include",
      });
      const data = await response.json();
      console.log("Fetched profits:", data); // ✅ לבדיקה
      if (!Array.isArray(data)) {
        console.error("השרת לא החזיר מערך תקין:", data);
        setProfits([]);
        return;
      }
      setProfits(data);
    } catch (error) {
      console.error("שגיאה בטעינת רווחים מהשרת", error);
      setProfits([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const formattedDate = new Date(date);
    const exists = profits.some((p) => {
      const profitDate = new Date(p.date);
      return profitDate.toDateString() === formattedDate.toDateString();
    });

    if (exists) {
      setErrorMessage("כבר קיים רווח ליום הזה בבסיס הנתונים");
      return;
    }

    const payload = { date: formattedDate.toISOString(), dailyProfit };

    try {
      const response = await fetch("http://localhost:8801/profits/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log("Add profit response:", result); // ✅ לבדיקה
      if (response.status === 409) {
        setErrorMessage(result.message || "כבר קיים רווח ליום הזה");
        return;
      }
      if (!response.ok) {
        throw new Error(result.message || "שגיאה בשמירת הרווח");
      }
      alert("הרווח נשמר בהצלחה!");
      setDailyProfit(0);
      fetchProfits();
    } catch (err) {
      console.error("שגיאה בשליחת רווח יומי לשרת", err);
      setErrorMessage("שגיאה בשליחה לשרת");
    }
  };

  const calculateSums = () => {
    if (!startDate || !endDate) {
      setErrorMessage("יש לבחור טווח תאריכים");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filteredProfits = profits.filter((profit) => {
      const profitDate = new Date(profit.date);
      return profitDate >= start && profitDate <= end;
    });

    const total = filteredProfits.reduce((sum, profit) => {
      return sum + Number(profit.dailyProfit || 0);
    }, 0);

    setChartData([
      { name: `סה\"כ רווח בין ${startDate} ל-${endDate}`, value: total },
    ]);
  };

  const sendEmail = async () => {
    try {
      const response = await fetch(
        "http://localhost:8801/profits/send-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            startDate,
            endDate,
            total: chartData[0]?.value || 0,
          }),
        }
      );

      const result = await response.json();
      console.log("Send email result:", result); // ✅ לבדיקה
      if (!response.ok) throw new Error(result.message);
      alert("הדו" + String.fromCharCode(39) + "ח נשלח בהצלחה למייל");
    } catch (err) {
      console.error(
        "שגיאה בשליחת הדו" + String.fromCharCode(39) + "ח במייל:",
        err
      );
      alert("שגיאה בשליחת הדו" + String.fromCharCode(39) + "ח");
    }
  };

  return (
    <div className="profit-container">
      <h1>רווחים</h1>
      <form className="profit-form" onSubmit={handleSubmit}>
        <label>תאריך:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>רווח יומי בש"ח:</label>
        <input
          type="number"
          min="0"
          value={dailyProfit}
          onChange={(e) => setDailyProfit(Number(e.target.value))}
        />
        <button type="submit">שמור רווח</button>
      </form>

      <div className="date-range">
        <label>מתאריך:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>עד תאריך:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={calculateSums}>חשב רווחים</button>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {chartData.length > 0 && (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6a1b9a" />
            </BarChart>
          </ResponsiveContainer>
          <div className="totals-display">
            <p>סה"כ רווח בטווח: ₪{chartData[0].value.toLocaleString()}</p>
            <button onClick={sendEmail}>שלח דו"ח למייל</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
