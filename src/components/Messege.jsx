import React, { useState } from "react";

function AddCustomer() {
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/customers/add-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // חשוב אם אתה עובד עם session
        body: JSON.stringify(customer),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCustomer({ name: "", email: "", phone: "" });
      } else {
        setMessage(data.message || "❌ שגיאה בהוספה");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ שגיאה בעת שליחת הנתונים לשרת");
    }
  };

  return (
    <div className="profit-container">
      <h1>הוספת לקוח</h1>
      <form className="customer-form" onSubmit={handleSubmit}>
        <label>שם מלא:</label>
        <input
          type="text"
          name="name"
          value={customer.name}
          onChange={handleChange}
          required
        />

        <label>דוא"ל:</label>
        <input
          type="email"
          name="email"
          value={customer.email}
          onChange={handleChange}
          required
        />

        <label>טלפון:</label>
        <input
          type="tel"
          name="phone"
          value={customer.phone}
          onChange={handleChange}
          required
        />

        <button type="submit">הוסף לקוח</button>
      </form>

      {message && <p className="error-message">{message}</p>}
    </div>
  );
}

export default AddCustomer;
