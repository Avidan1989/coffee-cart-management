import React, { useState, useEffect } from "react";
import "../assets/styles/Messege.css";
import { toast } from "react-toastify";
import MapSelector from "./MapSelector";

function Messege() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ subject: "", message: "" });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetch("/customers/all-customers", { credentials: "include" })
      .then((res) => res.json())
      .then(setCustomers)
      .catch(() => toast.error("שגיאה בשליפת לקוחות"));
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const res = await fetch("/customers/add-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newCustomer),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      setCustomers([...customers, data.newCustomer || newCustomer]);
      setNewCustomer({ name: "", email: "", phone: "" });
    } else {
      toast.error(data.message);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomerId(customer.id);
    setEditingCustomer({ ...customer });
  };

  const handleSaveCustomer = async () => {
    const res = await fetch(`/customers/update/${editingCustomerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editingCustomer),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("הלקוח עודכן");
      setCustomers(
        customers.map((c) => (c.id === editingCustomerId ? editingCustomer : c))
      );
      setEditingCustomerId(null);
      setEditingCustomer(null);
    } else {
      toast.error(data.message);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("המכשיר לא תומך במיקום");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationLink(mapsUrl);
        toast.success("📍 מיקום אותר והוזן אוטומטית");
      },
      () => {
        toast.error("❌ לא הצלחנו לקבל מיקום");
      }
    );
  };

  const handleSendMessage = async () => {
    if (!subject || !message) return toast.error("נא למלא נושא והודעה");
    if (locationLink && !locationLink.startsWith("http"))
      return toast.error("קישור למיקום לא תקין");

    const recipients = selectedCustomerIds.length
      ? customers.filter((c) => selectedCustomerIds.includes(c.id))
      : customers;
    const res = await fetch("/customers/send-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject, message, locationLink, recipients }),
    });
    const data = await res.json();
    res.ok ? toast.success(data.message) : toast.error(data.message);
  };

  const toggleCustomerSelect = (id) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const currentDate = new Date().toISOString().split("T")[0];
  const templates = {
    morning: {
      subject: "☀️ מבצע בוקר חם!",
      message: `☕ קפה + קרואסון ב־₪10 בלבד!\n📍 מיקום: ${
        locationLink || "[הזן מיקום]"
      }\nבתוקף עד: ${currentDate}`,
    },
    student: {
      subject: "🎓 מבצע לסטודנטים!",
      message: `📚 בהצגת תעודה - קפה ב־₪7!\n📍 עגלה: ${
        locationLink || "[הזן מיקום]"
      }\nעד: ${currentDate}`,
    },
    friend: {
      subject: "👬 חבר מביא חבר",
      message: `שתפו עם חבר - שניכם מקבלים קינוח מתנה 🍰\n📍 בואו ל: ${
        locationLink || "[הזן מיקום]"
      }\nתוקף: ${currentDate}`,
    },
    birthday: {
      subject: "🎉 יום הולדת שמח!",
      message: `הפתעה מתוקה ביום ההולדת 🎂\n📍 ${
        locationLink || "[הזן מיקום]"
      }\nמוזמנים לחגוג איתנו!`,
    },
    vip: {
      subject: "👑 מבצע ללקוחות VIP",
      message: `קפה חינם לכל לקוח VIP\n📍 מיקום: ${
        locationLink || "[הזן מיקום]"
      }\nתודה על נאמנותכם!`,
    },
  };

  const loadTemplate = (key) => {
    const t = templates[key] || customTemplates[key];
    if (t) {
      setSubject(t.subject);
      setMessage(t.message);
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplate.subject || !newTemplate.message) {
      toast.error("נא למלא נושא ותוכן לתבנית");
      return;
    }
    const newKey = `custom_${Date.now()}`;
    setCustomTemplates((prev) => ({ ...prev, [newKey]: newTemplate }));
    setNewTemplate({ subject: "", message: "" });
    toast.success("🎉 תבנית חדשה נוספה");
  };

  return (
    <div className="messege-container">
      <h2>📋 רשימת לקוחות</h2>
      <input
        type="text"
        placeholder="🔍חיפוש לפי שם או דוא''ל"
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <table className="customers-table">
        <thead>
          <tr>
            <th>✔</th>
            <th>שם</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>✏️</th>
          </tr>
        </thead>
        <tbody>
          {customers
            .filter(
              (c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.includes(c.id)}
                    onChange={() => toggleCustomerSelect(c.id)}
                  />
                </td>
                <td>
                  {editingCustomerId === c.id ? (
                    <input
                      value={editingCustomer.name}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td>
                  {editingCustomerId === c.id ? (
                    <input
                      value={editingCustomer.email}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    c.email
                  )}
                </td>
                <td>
                  {editingCustomerId === c.id ? (
                    <input
                      value={editingCustomer.phone}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    c.phone
                  )}
                </td>
                <td>
                  {editingCustomerId === c.id ? (
                    <button onClick={handleSaveCustomer}>💾</button>
                  ) : (
                    <button onClick={() => handleEditCustomer(c)}>✏️</button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3>➕ הוספת לקוח חדש</h3>
      <form className="customer-form" onSubmit={handleAddCustomer}>
        <input
          type="text"
          name="name"
          placeholder="שם מלא"
          value={newCustomer.name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, name: e.target.value })
          }
          required
        />
        <input
          type="email"
          name="email"
          placeholder="דוא״ל"
          value={newCustomer.email}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, email: e.target.value })
          }
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="טלפון"
          value={newCustomer.phone}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, phone: e.target.value })
          }
          required
        />
        <button type="submit">הוסף לקוח</button>
      </form>

      <h3>📨 שליחת הודעה ללקוחות</h3>
      <div className="promo-form">
        <select onChange={(e) => loadTemplate(e.target.value)}>
          <option value="">בחר תבנית מוכנה</option>
          {Object.entries(templates).map(([key, t]) => (
            <option key={key} value={key}>
              {t.subject}
            </option>
          ))}
          {Object.entries(customTemplates).map(([key, t]) => (
            <option key={key} value={key}>{`📝 ${t.subject}`}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="נושא ההודעה"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          placeholder="תוכן ההודעה"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input
          type="text"
          placeholder="קישור למיקום (לדוג׳ https://maps.app.goo.gl/...)"
          value={locationLink}
          onChange={(e) => setLocationLink(e.target.value)}
        />
        <button type="button" onClick={getCurrentLocation}>
          📍 קח מיקום נוכחי
        </button>

        {/* הצגת מפה אינטראקטיבית לבחירת מיקום */}
        <MapSelector onLocationSelect={(link) => setLocationLink(link)} />

        {/* תצוגת תצוגה של מיקום במפה */}
        {locationLink && locationLink.includes("maps") && (
          <iframe
            src={
              locationLink.replace(
                "https://www.google.com/maps?q=",
                "https://maps.google.com/maps?q="
              ) + "&output=embed"
            }
            width="100%"
            height="250"
            style={{ border: "1px solid #ccc", marginTop: "10px" }}
            allowFullScreen
            title="map-preview"
          ></iframe>
        )}

        <button onClick={handleSendMessage}>שלח נבחרים / לכולם</button>
        <p>📨 מספר לקוחות רשומים: {customers.length}</p>
      </div>

      <h3>🆕 הוספת תבנית הודעה חדשה</h3>
      <div className="template-form">
        <input
          type="text"
          placeholder="נושא לתבנית"
          value={newTemplate.subject}
          onChange={(e) =>
            setNewTemplate({ ...newTemplate, subject: e.target.value })
          }
        />
        <textarea
          placeholder="תוכן התבנית"
          value={newTemplate.message}
          onChange={(e) =>
            setNewTemplate({ ...newTemplate, message: e.target.value })
          }
        ></textarea>
        <button onClick={handleAddTemplate}>➕ הוסף תבנית</button>
      </div>
    </div>
  );
}

export default Messege;
