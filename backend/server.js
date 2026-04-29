// backend/server.js
const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const multer = require('multer');
const authenticateToken = require('./middleware/auth');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const adminRoutes = require('./routes/admin');
const vaccinationRoutes = require('./routes/vaccinationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const stockRoutes = require('./routes/stockRoutes');
const consultationsRoutes = require('./routes/consultationsRoutes');
const pregnanciesRoutes = require('./routes/pregnanciesRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initializeDatabase, applyMigrations, pool } = require('./config/database');

const app = express();

// ==================== IP LOCALE ====================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const priority = ['Wi-Fi', 'en0', 'eth0', 'wlan0'];
  for (const name of priority) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();
const PORT = process.env.PORT || 3000;

// ==================== UPLOAD PHOTO ====================
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==================== MIDDLEWARE ====================
app.use(cors({ origin: '*', credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ==================== ROUTES PUBLIQUES ====================
app.get('/', (req, res) => res.json({ message: 'NafasSante API OK', version: '1.0.0' }));
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'pong', ip: LOCAL_IP, port: PORT }));
app.get('/api/health', (req, res) => res.json({ success: true, ip: LOCAL_IP, port: PORT, uptime: process.uptime() }));

// ==================== PHOTO PROFIL ====================
app.put('/api/users/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier recu' });
    const photoUrl = `http://${LOCAL_IP}:${PORT}/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET photo = ?, updated_at = NOW() WHERE id = ?', [photoUrl, req.user.id]);
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, role, region, phone, photo FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ success: false, error: 'Utilisateur non trouve' });
    res.json({ success: true, photo: photoUrl, user: users[0] });
  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur upload photo' });
  }
});

// ==================== ROUTES PRINCIPALS ====================
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/pregnancies', pregnanciesRoutes);
app.use('/api/chat', chatRoutes);

// ==================== PATIENTS (route directe) ====================
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const agentId = req.user.role === 'admin' ? null : req.user.id;
    let query = `
      SELECT p.id, p.local_id, p.name, p.sex, p.birth_date,
             TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) as age,
             p.phone, p.locality, p.region, p.blood_type,
             p.created_at, p.updated_at, p.created_by,
             u.full_name as agent_name
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.id
    `;
    const params = [];
    if (agentId) {
      query += ' WHERE p.created_by = ?';
      params.push(agentId);
    }
    query += ' ORDER BY p.created_at DESC';
    const [patients] = await pool.query(query, params);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { name, sex, birth_date, phone, locality, region, blood_type, local_id } = req.body;
    if (!name || !sex || !birth_date) {
      return res.status(400).json({ error: 'name, sex, birth_date requis' });
    }
    const [result] = await pool.query(
      `INSERT INTO patients (local_id, name, sex, birth_date, phone, locality, region, blood_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [local_id || null, name, sex, birth_date, phone || null, locality || null, region || null, blood_type || null, req.user.id]
    );
    const [newPatient] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json(newPatient[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) as age,
             u.full_name as agent_name
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Patient non trouve' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { name, sex, birth_date, phone, locality, region, blood_type } = req.body;
    await pool.query(
      `UPDATE patients SET name=?, sex=?, birth_date=?, phone=?, locality=?, region=?, blood_type=?, updated_at=NOW()
       WHERE id=?`,
      [name, sex, birth_date, phone || null, locality || null, region || null, blood_type || null, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== 404 & ERREURS ====================
app.use((req, res) => res.status(404).json({ error: 'Route non trouvee', path: req.url }));
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ error: err.message });
});

// ==================== DEMARRAGE ====================
const startServer = async () => {
  try {
    await initializeDatabase();
    await applyMigrations();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
=========================================
  NafasSante Backend v1.0.0
=========================================
  Local:   http://localhost:${PORT}
  Reseau:  http://${LOCAL_IP}:${PORT}
  Ping:    http://${LOCAL_IP}:${PORT}/api/ping
  
  Dans l'app mobile, utilisez:
  API_URL = "http://${LOCAL_IP}:${PORT}/api"
=========================================
      `);
    });
  } catch (err) {
    console.error('Impossible de demarrer le serveur:', err.message);
    process.exit(1);
  }
};

startServer();
