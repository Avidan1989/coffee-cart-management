import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import * as XLSX from "xlsx";
import "../assets/styles/MangerProduct.css";
import { AuthContext } from "./AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { calculatePriceWithVAT } from "./vatConfig";

function ManagerProduct() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // ✅ כדי שנוכל לנווט לעמוד אחר
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    SKU: "",
    price: "",
    experienceDate: "",
    quantity: "",
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const location = useLocation();
  const isLowStockView = location.pathname === "/manager-products-low";
  const [editedProduct, setEditedProduct] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const toastTimeoutRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ שורת חיפוש

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // 🔥 סדר הפוך! (SQL)
  };

  const fetchProducts = useCallback(async () => {
    try {
      const endpoint = isLowStockView ? "/prods/low-stock" : "/prods/products";
      const response = await fetch(endpoint, {
        credentials: "include",
      });
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("שגיאה בקבלת המוצרים מהשרת");
    }
  }, [isLowStockView]); // 💡 תלות הכרחית!

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // ✅ אין יותר תלונות

  const filteredProducts = products
    .filter((p) =>
      [p.name, p.SKU].some((field) =>
        (field || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => a.quantity - b.quantity); // מיון לפי כמות

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return toast.warning("אנא בחר קובץ Excel");
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: false });

      if (!Array.isArray(json) || json.length === 0) {
        toast.error("קובץ Excel ריק או לא תקין.");
        return;
      }

      const fixedProducts = json.map((product) => {
        const rawDate = product["תאריך תפוגה"]; // לקוח מאקסל
        let formattedDate = "";
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d)) {
            const month = ("0" + (d.getMonth() + 1)).slice(-2);
            const day = ("0" + d.getDate()).slice(-2);
            const year = d.getFullYear();
            formattedDate = `${year}-${month}-${day}`;
          }
        }

        return {
          name: product["שם מוצר"]?.toString().trim() || "",
          SKU: product["SKU"]?.toString().trim() || "",
          price: parseFloat(product["מחיר"]) || 0,
          experienceDate: formattedDate,
          quantity: parseInt(product["כמות"], 10) || 0,
        };
      });

      setProducts(fixedProducts);
      toast.success("המוצרים נטענו מהקובץ בהצלחה");
    };
    reader.readAsArrayBuffer(file);
  };
  const handleSaveToDB = async () => {
    if (!Array.isArray(products) || products.length === 0) {
      toast.error("אין מוצרים לשמירה.");
      return;
    }

    try {
      // 📥 שליפת כל המוצרים הקיימים מה-DB
      const existingRes = await fetch("/prods/products", {
        method: "GET",
        credentials: "include",
      });

      const existingData = await existingRes.json();

      const existingNames = new Set(
        existingData.map((p) => p.name?.trim().toLowerCase())
      );
      const existingSKUs = new Set(
        existingData.map((p) => p.SKU?.trim().toLowerCase())
      );

      // ✨ סינון כפילויות לפי name או SKU - גם מהקובץ וגם מול DB
      const seenNames = new Set();
      const seenSKUs = new Set();
      const filtered = [];

      products.forEach((product) => {
        const name = product.name?.trim().toLowerCase();
        const sku = product.SKU?.trim().toLowerCase();

        const isDuplicateInExcel = seenNames.has(name) || seenSKUs.has(sku);
        const isDuplicateInDB =
          existingNames.has(name) || existingSKUs.has(sku);

        if (!isDuplicateInExcel && !isDuplicateInDB) {
          seenNames.add(name);
          seenSKUs.add(sku);
          filtered.push({
            name: product.name,
            SKU: product.SKU,
            price: parseFloat(product.price),
            experienceDate: formatDate(product.experienceDate),
            quantity: parseInt(product.quantity),
          });
        }
      });

      if (filtered.length === 0) {
        toast.info("כל המוצרים כבר קיימים. לא נוספו מוצרים חדשים.");
        return;
      }

      const response = await fetch("/prods/productsAll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(filtered),
      });

      if (!response.ok) throw new Error("שגיאה בשמירה למסד");
      toast.dismiss(); // הוספת השורה הזו לפני
      toast.success("המוצרים נשמרו בהצלחה");
      
      fetchProducts(); // מרענן את הטבלה
    } catch (err) {
      console.error("Saving error:", err);
      toast.error("שגיאה בשמירה למסד");
    }
  };

  const handleExportFullStock = () => {
    const worksheetData = filteredProducts.map((product) => ({
      "שם מוצר": product.name,
      SKU: product.SKU,
      כמות: product.quantity,
      'מחיר כולל מע"מ': calculatePriceWithVAT(product.price),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "מלאי");

    XLSX.writeFile(workbook, "inventory_with_vat.xlsx");
    toast.success('קובץ מלאי מלא נוצר בהצלחה');
  };

  const handleExportLowStock = () => {
    const lowStockProducts = products.filter((p) => p.quantity < 10);

    if (lowStockProducts.length === 0) {
      toast.info("אין מוצרים עם חוסר במלאי");
      return;
    }

    const worksheetData = lowStockProducts.map((product) => ({
      "שם מוצר": product.name,
      SKU: product.SKU,
      כמות: product.quantity,
      'מחיר כולל מע"מ': calculatePriceWithVAT(product.price),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "חוסר מלאי");

    XLSX.writeFile(workbook, "low_stock_with_vat.xlsx");
    toast.success('קובץ חוסר מלאי נוצר בהצלחה!');
  };
  
  const handleDeleteAll = async () => {
    console.log("נשלחת בקשת מחיקה");
    try {
      const response = await fetch("/prods/products", {
        method: "DELETE",
        credentials: "include",
      });
      console.log("סטטוס תשובה מהשרת:", response.status);

      if (!response.ok) throw new Error("מחיקה נכשלה");

      toast.info("כל המוצרים נמחקו בהצלחה");
      fetchProducts(); // מרענן את הטבלה
    } catch (err) {
      console.error("Deletion error:", err);
      toast.error("שגיאה במחיקה");
    }
  };

  const updateQuantity = async (productId, change) => {
    if (user?.role !== "admin") return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newQuantity = product.quantity + change;
    if (newQuantity < 0) return;
    try {
      const response = await fetch(`/prods/quantity/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: change, reason: "עדכון ידני מהממשק" }),
      });
      if (!response.ok) throw new Error("Update failed");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity + change } : p
        )
      );
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        toast.success("הכמות עודכנה בהצלחה");
      }, 1500);
    } catch (err) {
      console.error("Quantity update error:", err);
      toast.error("שגיאה בעדכון כמות");
    }
  };

  const confirmDeleteProduct = async (id) => {
    // סוגרים את הטוסט הקודם ("האם אתה בטוח למחוק?")
    toast.dismiss("confirm-delete");

    try {
      const response = await fetch(`/prods/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");

      // טוסט חדש - "נמחק בהצלחה", שייסגר לבד אחרי 3 שניות
      toast.success("המוצר נמחק בהצלחה", { autoClose: 3000 });

      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error("שגיאה במחיקת מוצר");
    }
  };

  const handleDeleteProduct = (id) => {
    if (user?.role !== "admin") return;

    toast.info(
      <div>
        האם אתה בטוח שברצונך למחוק מוצר זה?
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => confirmDeleteProduct(id)}
            style={{ marginRight: "10px" }}
          >
            כן
          </button>
          <button onClick={() => toast.dismiss()}>ביטול</button>
        </div>
      </div>,
      { autoClose: false, toastId: "confirm-delete" }
    );
  };

  const handleEditClick = (product) => {
    if (user?.role !== "admin") return;
    setEditingProductId(product.id);
    setEditedProduct({ ...product });
  };

  const handleSaveEdit = async () => {
    if (editedProduct.quantity < 0) {
      toast.error("לא ניתן להזין כמות קטנה מ־0");
      return;
    }
    if (user?.role !== "admin") return;
    try {
      const response = await fetch(
        `/prods/products/update/${editingProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: editedProduct.name,
            sku: editedProduct.SKU,
            price: editedProduct.price,
            experienceDate: editedProduct.experienceDate,
            quantity: editedProduct.quantity,
          }),
        }
      );
      if (!response.ok) throw new Error("Update failed");
      toast.success("המוצר עודכן בהצלחה");
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("שגיאה בעדכון מוצר");
    }
  };

  const handleNewProductChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddNewProduct = async () => {
    if (user?.role !== "admin") return;
    if (
      !newProduct.name ||
      !newProduct.SKU ||
      !newProduct.price ||
      !newProduct.experienceDate ||
      !newProduct.quantity
    ) {
      toast.error("אנא מלא את כל השדות");
      return;
    }
    try {
      const response = await fetch("/prods/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newProduct.name,
          SKU: newProduct.SKU,
          price: newProduct.price,
          experienceDate: newProduct.experienceDate,
          quantity: newProduct.quantity,
        }),
      });
      if (!response.ok) throw new Error("Add product failed");
      toast.success("מוצר נוסף בהצלחה");
      setNewProduct({
        name: "",
        SKU: "",
        price: "",
        experienceDate: "",
        quantity: "",
      });
      setAddingNew(false);
      fetchProducts();
    } catch (err) {
      console.error("Add product error:", err);
      toast.error("שגיאה בהוספת מוצר");
    }
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <h1>רשימת מלאי</h1>
      <input
        type="text"
        className="search-input"
        placeholder="חפש מוצר או SKU..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {user?.role === "admin" && (
        <div className="admin-controls">
          <label className="custom-file-upload">
            בחר קובץ
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              hidden
            />
          </label>
          <button onClick={handleUpload}>טען מוצרים מהקובץ</button>
          <button onClick={handleSaveToDB}>שמור ל-DB</button>
          <button onClick={() => navigate("/update-products")}>
            עדכון מלאי
          </button>
          <button onClick={handleDeleteAll}>מחק הכל</button>
          <button onClick={() => setShowExportOptions(!showExportOptions)}>
            ייצא מלאי ל-Excel
          </button>
          {showExportOptions && (
            <div className="export-buttons-container">
              <button className="export-btn" onClick={handleExportLowStock}>
                📉 ייצא חוסר מלאי
              </button>
              <button className="export-btn" onClick={handleExportFullStock}>
                📦 ייצא מלאי מלא
              </button>
            </div>
          )}
          <button onClick={() => setAddingNew(!addingNew)}>
            הוסף מוצר חדש
          </button>

          {addingNew && (
            <div className="add-product-form">
              <input
                name="name"
                value={newProduct.name}
                placeholder="שם מוצר"
                onChange={handleNewProductChange}
              />
              <input
                name="SKU"
                value={newProduct.SKU}
                placeholder="SKU"
                onChange={handleNewProductChange}
              />
              <input
                name="price"
                value={newProduct.price}
                placeholder="מחיר"
                onChange={handleNewProductChange}
              />
              <input
                type="date"
                name="experienceDate"
                value={newProduct.experienceDate}
                onChange={handleNewProductChange}
              />
              <input
                name="quantity"
                type="number"
                min="0"
                value={newProduct.quantity}
                onChange={handleNewProductChange}
              />
              <button onClick={handleAddNewProduct}>הוסף</button>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {user?.role === "admin" && <th>+</th>}
              <th>שם מוצר</th>
              <th>SKU</th>
              <th>מחיר</th>
              <th>כמות</th>
              <th>תאריך תפוגה</th> {/* ✅ חדש */}
              {user?.role === "admin" && <th>-</th>}
              {user?.role === "admin" && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <React.Fragment key={p.id}>
                <tr className={p.quantity <= 5 ? "low-stock flash" : ""}>
                  {user?.role === "admin" && (
                    <td>
                      <button
                        className="circle-btn plus"
                        onClick={() => updateQuantity(p.id, 1)}
                      >
                        +
                      </button>
                    </td>
                  )}
                  <td>{p.name}</td>
                  <td>{p.SKU}</td>
                  <td>{calculatePriceWithVAT(p.price)} ₪</td>
                  <td>{p.quantity}</td>
                  <td>{formatDate(p.experienceDate)}</td>
                  {user?.role === "admin" && (
                    <td>
                      <button
                        className="circle-btn minus"
                        onClick={() => updateQuantity(p.id, -1)}
                      >
                        -
                      </button>
                    </td>
                  )}
                  {user?.role === "admin" && (
                    <td>
                      <button
                        className="edit-delete-btn"
                        onClick={() => handleEditClick(p)}
                      >
                        ✏️
                      </button>
                      <button
                        className="edit-delete-btn"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
                {editingProductId === p.id && (
                  <tr className="edit-row">
                    <td colSpan="8">
                      <div className="edit-form">
                        <input
                          name="name"
                          value={editedProduct.name}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              name: e.target.value,
                            })
                          }
                        />
                        <input
                          name="SKU"
                          value={editedProduct.SKU}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              SKU: e.target.value,
                            })
                          }
                        />
                        <input
                          name="price"
                          value={editedProduct.price}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              price: e.target.value,
                            })
                          }
                        />
                        <input
                          type="date"
                          name="experienceDate"
                          value={editedProduct.experienceDate}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              experienceDate: e.target.value,
                            })
                          }
                        />
                        <input
                          name="quantity"
                          value={editedProduct.quantity}
                          onChange={(e) =>
                            setEditedProduct({
                              ...editedProduct,
                              quantity: e.target.value,
                            })
                          }
                        />
                        <button onClick={handleSaveEdit}>שמור שינויים</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerProduct;
