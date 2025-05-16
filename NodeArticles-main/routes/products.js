const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated } = require("./middleware");
const ExcelJS = require("exceljs");
// ✔️ שליפת כל המוצרים
router.get("/products", isAuthenticated, (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בשליפה" });
    res.json(results);
  });
});

// ✔️ הוספת מוצר
router.post("/products", isAuthenticated, (req, res) => {
  const { name, sku, price, experienceDate, quantity } = req.body;
  const SKU = sku || req.body.SKU;

  // שלב 1: בדיקה אם קיים מוצר עם אותו שם או SKU
  const checkSql = `SELECT * FROM products WHERE name = ? OR SKU = ?`;
  db.query(checkSql, [name, SKU], (err, results) => {
    if (err) {
      console.error("שגיאה בבדיקת כפילויות:", err);
      return res.status(500).json({ error: "שגיאה בבדיקת כפילויות" });
    }

    if (results.length > 0) {
      return res
        .status(409)
        .json({ message: "מוצר עם אותו שם או מק״ט כבר קיים" });
    }

    // שלב 2: אם לא קיימת כפילות - נמשיך להוספה
    const insertSql = `
      INSERT INTO products (name, SKU, price, experienceDate, quantity)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertSql,
      [name, SKU, price, experienceDate, quantity],
      (err2, result) => {
        if (err2) {
          console.error("שגיאה בהוספה:", err2);
          return res.status(500).json({ error: "שגיאה בהוספת מוצר" });
        }
        res.json({ message: "מוצר נוסף בהצלחה", id: result.insertId });
      }
    );
  });
});

// ייצוא מלאי מעודכן לקובץ Excel
router.get("/export-excel", async (req, res) => {
  try {
    const query = "SELECT * FROM products";
    db.query(query, async (err, products) => {
      if (err) {
        console.error("Error fetching products:", err);
        return res.status(500).json({ message: "Failed to fetch products" });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Inventory");

      // כותרות העמודות
      worksheet.columns = [
       { header: 'מק"ט', key: "SKU", width: 20 },
        { header: "שם מוצר", key: "name", width: 30 },
        { header: "כמות", key: "quantity", width: 15 },
        { header: "מחיר", key: "price", width: 15 },
      ];

      // הוספת מוצרים
      products.forEach((product) => {
        worksheet.addRow({
          SKU: product.SKU,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
        });
      });

      // שליחת הקובץ ישירות להורדה
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=inventory.xlsx"
      );

      await workbook.xlsx.write(res).then(() => res.end());
    });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({ message: "Failed to export Excel" });
  }
});

// ייצוא חוסר מלאי (מוצרים עם כמות < 10)
router.get("/export-low-stock", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM products WHERE quantity < 10";
  db.query(query, async (err, products) => {
    if (err) {
      console.error("Error fetching low stock products:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch low stock products" });
    }

if (products.length === 0) {
  return res.status(204).send(); // ✅ בלי גוף תגובה!
}

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Low Stock");

    worksheet.columns = [
      { header: 'מק"ט', key: "SKU", width: 20 },
      { header: "שם מוצר", key: "name", width: 30 },
      { header: "כמות", key: "quantity", width: 15 },
      { header: "מחיר", key: "price", width: 15 },
    ];

    products.forEach((product) => {
      worksheet.addRow({
        SKU: product.SKU,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=low_stock.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  });
});

// עדכון מוצר קיים
router.put("/products/update/:id", isAuthenticated, (req, res) => {
  const { name, sku, price, experienceDate, quantity } = req.body;
  const { id } = req.params;

  if (!name || !sku || !price || !experienceDate || !quantity) {
    return res
      .status(400)
      .json({ message: "All fields are required for updating product" });
  }

  // בדיקה אם יש מוצר אחר (עם ID שונה) שיש לו את אותו שם או אותו SKU
  const checkSql = `
    SELECT id FROM products 
    WHERE (name = ? OR SKU = ?) AND id != ?
  `;
  db.query(checkSql, [name, sku, id], (err, results) => {
    if (err) {
      console.error("שגיאה בבדיקת כפילויות:", err);
      return res.status(500).json({ message: "שגיאה בבדיקת כפילויות" });
    }

    if (results.length > 0) {
      return res
        .status(409)
        .json({ message: "שם מוצר או SKU כבר קיימים במוצר אחר" });
    }

    // אם לא קיימת כפילות – מבצעים את העדכון
    const updateSql = `
      UPDATE products 
      SET name = ?, sku = ?, price = ?, experienceDate = ?, quantity = ?
      WHERE id = ?
    `;
    db.query(
      updateSql,
      [name, sku, price, experienceDate, quantity, id],
      (err2) => {
        if (err2) {
          console.error("שגיאה בעדכון מוצר:", err2);
          return res.status(500).json({ message: "שגיאה בעדכון מוצר" });
        }

        res.json({ message: "המוצר עודכן בהצלחה" });
      }
    );
  });
});

// מחיקת מוצר בודד (מעודכן נכון)
router.delete("/products/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;

  // שלב 1: מחיקת לוגים מהמוצר
  db.query("DELETE FROM inventory_logs WHERE product_id = ?", [id], (err) => {
    if (err) {
      console.error("Error deleting logs:", err);
      return res.status(500).json({ message: "Error deleting product logs" });
    }

    // שלב 2: מחיקת המוצר עצמו
    db.query("DELETE FROM products WHERE id = ?", [id], (err2) => {
      if (err2) {
        console.error("Error deleting product:", err2);
        return res.status(500).json({ message: "Error deleting product" });
      }
      res.json({ message: "Product and related logs deleted successfully" });
    });
  });
});

router.delete("/products", isAuthenticated, async (req, res) => {
  try {
    // מחיקת כל הלוגים
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM inventory_logs", (err) => {
        if (err) {
          console.error("שגיאה במחיקת לוגים:", err.message);
          return reject(new Error("שגיאה במחיקת לוגים: " + err.message));
        }
        console.log("כל הלוגים נמחקו");
        resolve();
      });
    });

    // מחיקת כל המוצרים + איפוס מזהה
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM products", (err) => {
        if (err) {
          console.error("שגיאה במחיקת מוצרים:", err.message);
          return reject(new Error("שגיאה במחיקת מוצרים: " + err.message));
        }

        // איפוס מזהה ID של products
        db.query("ALTER TABLE products AUTO_INCREMENT = 1", (err2) => {
          if (err2) {
            console.error("שגיאה באיפוס מזהה:", err2.message);
            return reject(new Error("שגיאה באיפוס מזהה: " + err2.message));
          }

          console.log("כל המוצרים נמחקו והמזהה אופס");
          resolve();
        });
      });
    });

    // מחזירים תשובה אחרי ששתי המחיקות הצליחו
    res.json({ message: "כל המוצרים והלוגים נמחקו בהצלחה והמזהה אופס" });
  } catch (error) {
    console.error("מחיקה נכשלה:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✔️ הוספת מוצרים בכמות גדולה (Bulk Insert)
router.post("/productsAll", isAuthenticated, async (req, res) => {
  const products = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "נדרש לספק רשימת מוצרים לשמירה" });
  }

  const values = products.map(
    ({ name, SKU, price, experienceDate, quantity }) => [
      name,
      SKU,
      price,
      experienceDate,
      quantity,
    ]
  );

  const sql = `
    INSERT INTO products (name, SKU, price, experienceDate, quantity)
    VALUES ${values.map(() => "(?, ?, ?, ?, ?)").join(", ")}
  `;

  db.query(sql, values.flat(), (err, result) => {
    // 🔥 חשווב מאוד - flat!!!
    if (err) {
      console.error("שגיאה בהוספת מוצרים:", err);
      return res.status(500).json({ error: "שגיאה בהוספת מוצרים" });
    }
    res.status(201).json({
      message: "כל המוצרים נוספו בהצלחה",
      insertedCount: result.affectedRows,
    });
  });
});

// ✔️ עדכון כמות עם לוג
router.put("/quantity/:id", isAuthenticated, (req, res) => {
  const { amount, reason } = req.body;
  const productId = req.params.id;
  const userId = req.session.user?.id;

  db.query(
    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
    [amount, productId],
    (err) => {
      if (err) return res.status(500).json({ error: "שגיאה בעדכון" });

      const actionType = amount > 0 ? "increase" : "decrease";
      const logSql = `
      INSERT INTO inventory_logs (product_id, user_id, change_amount, action_type, reason)
      VALUES (?, ?, ?, ?, ?)
    `;
      db.query(
        logSql,
        [productId, userId, amount, actionType, reason || ""],
        () => {
          res.json({ message: "המלאי עודכן, והפעולה נרשמה" });
        }
      );
    }
  );
});


// ✔️ שליפת מוצרים עם כמות נמוכה (פחות מ־10)
router.get("/low-stock", (req, res) => {
  const sql = "SELECT * FROM products WHERE quantity < 10";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("שגיאה בשליפת חוסרים:", err);
      return res.status(500).json({ error: "שגיאה במסד הנתונים" });
    }
    res.json(results);
  });
});






module.exports = router;
