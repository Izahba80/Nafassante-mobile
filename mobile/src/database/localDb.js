// src/database/localDb.js
import * as SQLite from 'expo-sqlite';

let db = null;

export const getDb = () => {
  if (!db) {
    db = SQLite.openDatabaseSync('nafassante.db');
  }
  return db;
};

export const initLocalDb = async () => {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS local_patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      sex TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      phone TEXT,
      locality TEXT,
      region TEXT,
      blood_type TEXT,
      created_by INTEGER,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS local_consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      patient_local_id TEXT NOT NULL,
      agent_id INTEGER,
      date TEXT NOT NULL,
      symptoms TEXT,
      diagnosis TEXT NOT NULL,
      treatment TEXT,
      weight REAL,
      temperature REAL,
      blood_pressure TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS local_pregnancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      patient_local_id TEXT NOT NULL,
      agent_id INTEGER,
      start_date TEXT,
      last_menstrual_period TEXT,
      expected_delivery_date TEXT,
      status TEXT DEFAULT 'active',
      complications TEXT,
      delivery_date TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS local_vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      patient_local_id TEXT NOT NULL,
      agent_id INTEGER,
      vaccine_name TEXT NOT NULL,
      dose_number INTEGER DEFAULT 1,
      date_administered TEXT NOT NULL,
      next_dose_date TEXT,
      batch_number TEXT,
      location TEXT,
      observations TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('Base de donnees locale initialisee');
};

// =====================================================
// PATIENTS
// =====================================================
export const localPatientsDb = {
  getAll: () => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM local_patients ORDER BY created_at DESC');
  },

  getById: (localId) => {
    const database = getDb();
    return database.getFirstSync('SELECT * FROM local_patients WHERE local_id = ?', [localId]);
  },

  create: (patient) => {
    const database = getDb();
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.runSync(
      `INSERT INTO local_patients (local_id, name, sex, birth_date, phone, locality, region, blood_type, created_by, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [localId, patient.name, patient.sex, patient.birth_date, patient.phone || null,
       patient.locality || null, patient.region || null, patient.blood_type || null, patient.created_by || null]
    );
    return { ...patient, local_id: localId, synced: 0 };
  },

  update: (localId, patient) => {
    const database = getDb();
    database.runSync(
      `UPDATE local_patients SET name=?, sex=?, birth_date=?, phone=?, locality=?, region=?, blood_type=?, 
       synced=0, updated_at=datetime('now') WHERE local_id=?`,
      [patient.name, patient.sex, patient.birth_date, patient.phone || null,
       patient.locality || null, patient.region || null, patient.blood_type || null, localId]
    );
  },

  getUnsynced: () => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM local_patients WHERE synced = 0');
  },

  markSynced: (localId) => {
    const database = getDb();
    database.runSync('UPDATE local_patients SET synced = 1 WHERE local_id = ?', [localId]);
  },
};

// =====================================================
// CONSULTATIONS
// =====================================================
export const localConsultationsDb = {
  getAll: () => {
    const database = getDb();
    return database.getAllSync(`
      SELECT lc.*, lp.name as patient_name 
      FROM local_consultations lc
      LEFT JOIN local_patients lp ON lc.patient_local_id = lp.local_id
      ORDER BY lc.created_at DESC
    `);
  },

  create: (consultation) => {
    const database = getDb();
    const localId = `local_c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.runSync(
      `INSERT INTO local_consultations 
       (local_id, patient_local_id, agent_id, date, symptoms, diagnosis, treatment, weight, temperature, blood_pressure, notes, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [localId, consultation.patient_local_id, consultation.agent_id || null, consultation.date,
       JSON.stringify(consultation.symptoms || []), consultation.diagnosis, consultation.treatment || null,
       consultation.weight || null, consultation.temperature || null, consultation.blood_pressure || null,
       consultation.notes || null]
    );
    return { ...consultation, local_id: localId, synced: 0 };
  },

  getUnsynced: () => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM local_consultations WHERE synced = 0');
  },

  markSynced: (localId) => {
    const database = getDb();
    database.runSync('UPDATE local_consultations SET synced = 1 WHERE local_id = ?', [localId]);
  },
};

// =====================================================
// GROSSESSES
// =====================================================
export const localPregnanciesDb = {
  getAll: () => {
    const database = getDb();
    return database.getAllSync(`
      SELECT lp.*, pat.name as patient_name 
      FROM local_pregnancies lp
      LEFT JOIN local_patients pat ON lp.patient_local_id = pat.local_id
      ORDER BY lp.created_at DESC
    `);
  },

  create: (pregnancy) => {
    const database = getDb();
    const localId = `local_p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.runSync(
      `INSERT INTO local_pregnancies 
       (local_id, patient_local_id, agent_id, start_date, last_menstrual_period, expected_delivery_date, status, complications, delivery_date, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [localId, pregnancy.patient_local_id, pregnancy.agent_id || null, pregnancy.start_date,
       pregnancy.last_menstrual_period || null, pregnancy.expected_delivery_date || null,
       pregnancy.status || 'active', pregnancy.complications ? JSON.stringify(pregnancy.complications) : null,
       pregnancy.delivery_date || null]
    );
    return { ...pregnancy, local_id: localId, synced: 0 };
  },

  getUnsynced: () => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM local_pregnancies WHERE synced = 0');
  },

  markSynced: (localId) => {
    const database = getDb();
    database.runSync('UPDATE local_pregnancies SET synced = 1 WHERE local_id = ?', [localId]);
  },
};

// =====================================================
// VACCINATIONS
// =====================================================
export const localVaccinationsDb = {
  getAll: () => {
    const database = getDb();
    return database.getAllSync(`
      SELECT lv.*, lp.name as patient_name 
      FROM local_vaccinations lv
      LEFT JOIN local_patients lp ON lv.patient_local_id = lp.local_id
      ORDER BY lv.created_at DESC
    `);
  },

  create: (vaccination) => {
    const database = getDb();
    const localId = `local_v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.runSync(
      `INSERT INTO local_vaccinations 
       (local_id, patient_local_id, agent_id, vaccine_name, dose_number, date_administered, next_dose_date, batch_number, location, observations, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [localId, vaccination.patient_local_id, vaccination.agent_id || null, vaccination.vaccine_name,
       vaccination.dose_number || 1, vaccination.date_administered, vaccination.next_dose_date || null,
       vaccination.batch_number || null, vaccination.location || null, vaccination.observations || null]
    );
    return { ...vaccination, local_id: localId, synced: 0 };
  },

  getUnsynced: () => {
    const database = getDb();
    return database.getAllSync('SELECT * FROM local_vaccinations WHERE synced = 0');
  },

  markSynced: (localId) => {
    const database = getDb();
    database.runSync('UPDATE local_vaccinations SET synced = 1 WHERE local_id = ?', [localId]);
  },
};
