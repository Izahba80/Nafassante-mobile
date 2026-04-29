-- backend/database/init.sql
CREATE DATABASE IF NOT EXISTS nafassante CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nafassante;

-- ==================== TABLE USERS ====================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('agent', 'admin') NOT NULL DEFAULT 'agent',
    region VARCHAR(100),
    phone VARCHAR(20),
    photo VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE PATIENTS ====================
CREATE TABLE IF NOT EXISTS patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    local_id VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    sex ENUM('M', 'F') NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    locality VARCHAR(100),
    region VARCHAR(100),
    blood_type VARCHAR(5),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_by INT,
    synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_local_id (local_id),
    INDEX idx_synced (synced),
    INDEX idx_locality (locality)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE CONSULTATIONS ====================
CREATE TABLE IF NOT EXISTS consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patientId INT NOT NULL,
    agentId INT,
    date DATE NOT NULL,
    symptoms JSON,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,1),
    bloodPressure VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patientId (patientId),
    INDEX idx_agentId (agentId),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE PREGNANCIES ====================
CREATE TABLE IF NOT EXISTS pregnancies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patientId INT NOT NULL,
    agentId INT,
    startDate DATE,
    lastMenstrualPeriod DATE,
    expectedDeliveryDate DATE,
    status ENUM('active', 'delivered', 'miscarriage', 'complicated') DEFAULT 'active',
    complications JSON,
    deliveryDate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patientId (patientId),
    INDEX idx_agentId (agentId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE VACCINATIONS ====================
CREATE TABLE IF NOT EXISTS vaccinations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patientId INT NOT NULL,
    agentId INT,
    vaccineName VARCHAR(100) NOT NULL,
    doseNumber INT DEFAULT 1,
    dateAdministered DATE NOT NULL,
    nextDoseDate DATE,
    batchNumber VARCHAR(50),
    location VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patientId (patientId),
    INDEX idx_agentId (agentId),
    INDEX idx_vaccineName (vaccineName),
    INDEX idx_dateAdministered (dateAdministered)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE VACCINE_STOCK ====================
CREATE TABLE IF NOT EXISTS vaccine_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vaccineId VARCHAR(50) NOT NULL,
    vaccineName VARCHAR(100) NOT NULL,
    month VARCHAR(7) NOT NULL,
    year INT NOT NULL,
    monthNumber INT NOT NULL,
    initialStock INT DEFAULT 0,
    received INT DEFAULT 0,
    used INT DEFAULT 0,
    remaining INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vaccine_month (vaccineId, month),
    INDEX idx_month (month),
    INDEX idx_vaccineId (vaccineId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE VACCINATION_STATS ====================
CREATE TABLE IF NOT EXISTS vaccination_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    month VARCHAR(7) NOT NULL,
    year INT NOT NULL,
    monthNumber INT NOT NULL,
    childrenVaccinated INT DEFAULT 0,
    womenVaccinated INT DEFAULT 0,
    totalVaccines INT DEFAULT 0,
    byVaccine JSON,
    bySex JSON,
    byAgeGroup JSON,
    coverage JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_year (month, year),
    INDEX idx_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE MIGRATIONS ====================
CREATE TABLE IF NOT EXISTS migrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ADMIN PAR DEFAUT ====================
INSERT IGNORE INTO users (username, password, email, full_name, role, active)
VALUES (
    'admin',
    '$2a$10$rBnKbFdPh8y3z7xmAqvhAOdV1iMBvFNe2Lc.KHQ5ZQxPfCfB3wYZW',
    'admin@nafassante.td',
    'Administrateur NafasSante',
    'admin',
    1
);
