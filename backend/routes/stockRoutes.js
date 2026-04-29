// backend/routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/stock - Liste tout le stock du mois courant
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT * FROM vaccine_stock WHERE month = ? ORDER BY vaccineName`,
      [targetMonth]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur recuperation stock:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/stock/all - Historique complet
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM vaccine_stock ORDER BY month DESC, vaccineName`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stock/predict - Prediction pour le mois suivant
router.get('/predict', async (req, res) => {
  try {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 2;
    if (targetMonth > 12) { targetMonth = 1; targetYear++; }

    const [vaccines] = await pool.query(
      `SELECT DISTINCT vaccineName FROM vaccinations WHERE vaccineName IS NOT NULL`
    );

    const predictions = [];
    for (const v of vaccines) {
      const vaccineName = v.vaccineName;
      const consumptions = [];

      for (let i = 1; i <= 3; i++) {
        let pastMonth = targetMonth - i;
        let pastYear = targetYear;
        if (pastMonth <= 0) { pastMonth += 12; pastYear--; }
        const pastMonthStr = `${pastYear}-${String(pastMonth).padStart(2, '0')}`;

        const [rows] = await pool.query(
          `SELECT COUNT(*) as count FROM vaccinations 
           WHERE vaccineName = ? AND DATE_FORMAT(dateAdministered, '%Y-%m') = ?`,
          [vaccineName, pastMonthStr]
        );
        consumptions.push(rows[0]?.count || 0);
      }

      const avg = consumptions.reduce((a, b) => a + b, 0) / 3;
      const recommended = Math.ceil(avg * 1.2);
      predictions.push({ vaccineName, average: parseFloat(avg.toFixed(1)), recommended });
    }

    res.json({
      targetPeriod: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      predictions
    });
  } catch (error) {
    console.error('Erreur prediction stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/stock - Initialiser/mettre a jour le stock d'un vaccin
router.post('/', async (req, res) => {
  try {
    const { vaccineId, vaccineName, month, initialStock, received } = req.body;
    if (!vaccineId || !vaccineName || !month) {
      return res.status(400).json({ error: 'vaccineId, vaccineName et month requis' });
    }

    const [year, monthNum] = month.split('-');
    const usedQuery = await pool.query(
      `SELECT COUNT(*) as count FROM vaccinations 
       WHERE vaccineName = ? AND DATE_FORMAT(dateAdministered, '%Y-%m') = ?`,
      [vaccineName, month]
    );
    const used = usedQuery[0][0]?.count || 0;
    const init = parseInt(initialStock) || 0;
    const recv = parseInt(received) || 0;
    const remaining = init + recv - used;

    await pool.query(
      `INSERT INTO vaccine_stock (vaccineId, vaccineName, month, year, monthNumber, initialStock, received, used, remaining)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         initialStock = VALUES(initialStock),
         received = VALUES(received),
         used = ?,
         remaining = VALUES(remaining),
         updated_at = NOW()`,
      [vaccineId, vaccineName, month, parseInt(year), parseInt(monthNum), init, recv, remaining, remaining, used]
    );

    res.json({ success: true, message: 'Stock mis a jour', remaining });
  } catch (error) {
    console.error('Erreur mise a jour stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/stock/consume - Consommer du stock
router.put('/consume', async (req, res) => {
  try {
    const { vaccineId, quantity, month } = req.body;
    if (!vaccineId || !quantity || !month) {
      return res.status(400).json({ error: 'vaccineId, quantity et month requis' });
    }

    const [result] = await pool.query(
      `UPDATE vaccine_stock 
       SET used = used + ?, remaining = initialStock + received - (used + ?)
       WHERE vaccineId = ? AND month = ?`,
      [quantity, quantity, vaccineId, month]
    );

    if (result.affectedRows === 0) {
      const [year, monthNum] = month.split('-');
      await pool.query(
        `INSERT INTO vaccine_stock (vaccineId, vaccineName, month, year, monthNumber, used, remaining)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vaccineId, vaccineId, month, parseInt(year), parseInt(monthNum), quantity, -quantity]
      );
    }

    res.json({ success: true, message: 'Stock consomme' });
  } catch (error) {
    console.error('Erreur consommation stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stock/alerts - Alertes de stock bas
router.get('/alerts', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [rows] = await pool.query(
      `SELECT * FROM vaccine_stock 
       WHERE month = ? AND remaining <= 5
       ORDER BY remaining ASC`,
      [currentMonth]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
