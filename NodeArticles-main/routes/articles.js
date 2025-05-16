const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection('products_db');


/**
 * GET / - Fetch all articles from the database
 * Input: No specific input required from the request.
 * Output: Returns a JSON array of article objects from the 'articles' table.
 *         In case of an error, returns a JSON object with an error message.
 */
router.get('/', (req, res) => {
  const query = 'SELECT * FROM articles';
  db.query(query, (err, results) => {
    if (err) {
      console.error('שגיאה בקבלת מאמרים:', err);
      return res.status(500).json({ error: 'שגיאה בקבלת מאמרים' });
    }
    res.json(results);
  });
});

module.exports = router;
