import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/styles/MangerProduct.css";

function UpdateProducts() {
  const [products, setProducts] = useState([]);
  const [stockUsage, setStockUsage] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/prods/products", {
        credentials: "include",
      });
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("שגיאה בקבלת המוצרים מהשרת");
    }
  };

  const handleStockUsageUpdate = async () => {
    let updatedCount = 0;

    for (const productId in stockUsage) {
      const usageAmount = parseInt(stockUsage[productId]);
      const product = products.find((p) => p.id === parseInt(productId));

      if (!product || isNaN(usageAmount) || usageAmount <= 0) continue;

      const newQuantity = product.quantity - usageAmount;
      if (newQuantity < 0) {
        toast.warning(`לא ניתן לעדכן את ${product.name} - אין מספיק מלאי`);
        continue;
      }

      try {
        const response = await fetch(`/prods/quantity/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: -usageAmount,
            reason: "שימוש בפועל לפי עדכון מלאי",
          }),
        });

        if (!response.ok) throw new Error("שגיאה בעדכון");

        setProducts((prev) =>
          prev.map((p) =>
            p.id === parseInt(productId)
              ? { ...p, quantity: p.quantity - usageAmount }
              : p
          )
        );

        updatedCount++;
      } catch (err) {
        console.error("שגיאה בעדכון:", err);
        toast.error(`שגיאה בעדכון עבור ${product.name}`);
      }
    }

    if (updatedCount > 0) {
      toast.success("✅ המלאי עודכן בהצלחה");
      setTimeout(() => navigate("/manger-product"), 1500);
    } else {
      toast.info("ℹ️ לא הוזנו עדכונים תקינים");
    }

    setStockUsage({});
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <h1>עדכון מלאי לפי שימוש</h1>

      <input
        type="text"
        placeholder="חפש מוצר..."
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="buttons-row">
        <button className="save-btn" onClick={handleStockUsageUpdate}>
          שמור עדכון מלאי
        </button>
        <button
          className="back-btn"
          onClick={() => setTimeout(() => navigate("/manger-product"), 300)}
        >
          חזור לרשימת מלאי
        </button>
      </div>

      <table className="stock-update-table">
        <thead className="update">
          <tr>
            <th>שם מוצר</th>
            <th>כמות נוכחית</th>
            <th>כמה השתמשת</th>
          </tr>
        </thead>
        <tbody>
          {products
            .filter((p) =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.quantity}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={stockUsage[p.id] || ""}
                    onChange={(e) =>
                      setStockUsage((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <style>{`
        .app-container {
          max-width: 900px;
          margin: auto;
          padding: 20px;
          direction: rtl;
          font-family: Arial;
        }

        .search-input {
          width: 100%;
          padding: 8px;
          margin-bottom: 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        .stock-update-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .stock-update-table th, .stock-update-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: center;
        }

        .stock-update-table th {
          background-color: #f2f2f2;
        }

        .save-btn, .back-btn {
          padding: 10px 16px;
          margin: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .save-btn {
          background-color: #4CAF50;
          color: white;
        }

        .back-btn {
          background-color: #ccc;
          color: black;
        }
      `}</style>
    </div>
  );
}

export default UpdateProducts;
