-- ==========================================================================
-- VADIVA TECH FEST 3.0 — VELAMMAL VERIFICATION & UPDATED REGISTRATION SCHEMA
-- ==========================================================================

USE techfest_db;

-- 1. VELAMMAL CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS velammal_campuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campus_code VARCHAR(50) NOT NULL UNIQUE,
    campus_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) DEFAULT 'Chennai',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. VELAMMAL STUDENTS VERIFICATION DATABASE (Source of Truth)
CREATE TABLE IF NOT EXISTS velammal_students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campus_id BIGINT UNSIGNED NOT NULL,
    campus_name VARCHAR(255) NOT NULL,
    admission_number VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    grade INT NOT NULL,
    section VARCHAR(10) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_campus_admission (campus_name, admission_number),
    FOREIGN KEY (campus_id) REFERENCES velammal_campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. UPDATE PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    participant_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    grade INT NOT NULL,
    section VARCHAR(10) NULL,
    date_of_birth DATE NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_mobile VARCHAR(20) NOT NULL,
    band ENUM('JUNIOR', 'INTERMEDIATE', 'SENIOR') NOT NULL,
    is_velammal_student BOOLEAN DEFAULT FALSE,
    velammal_verified BOOLEAN DEFAULT FALSE,
    campus_id BIGINT UNSIGNED NULL,
    campus_name VARCHAR(255) NULL,
    admission_number VARCHAR(100) NULL,
    velammal_verified_at TIMESTAMP NULL,
    tier ENUM('VELAMMAL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    entry_status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
    entry_payment_id BIGINT UNSIGNED NULL,
    qr_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SEED DATA: APPROVED VELAMMAL CAMPUSES
INSERT INTO velammal_campuses (id, campus_code, campus_name, city, is_active) VALUES
(1, 'VEL-MOG', 'Velammal Vidyalaya - Mogappair', 'Chennai', TRUE),
(2, 'VEL-MEL-AYAN', 'Velammal Vidyalaya - Mel Ayanambakkam', 'Chennai', TRUE),
(3, 'VEL-PARUTHI', 'Velammal Vidyalaya - Paruthipattu', 'Chennai', TRUE),
(4, 'VEL-AVADI', 'Velammal Vidyalaya - Avadi', 'Chennai', TRUE),
(5, 'VEL-POONA', 'Velammal Vidyalaya - Poonamallee', 'Chennai', TRUE),
(6, 'VEL-KARAM', 'Velammal Vidyalaya - Karambakkam', 'Chennai', TRUE),
(7, 'VEL-ALAP', 'Velammal Vidyalaya - Alapakkam', 'Chennai', TRUE),
(8, 'VEL-ANNEX', 'Velammal Vidyalaya - Annexure', 'Chennai', TRUE),
(9, 'VEL-MADHAV', 'Velammal Vidyalaya - Madhavaram', 'Chennai', TRUE),
(10, 'VEL-BODHI-PON', 'Velammal Bodhi Campus - Ponneri', 'Ponneri', TRUE),
(11, 'VEL-BODHI-KOL', 'Velammal Bodhi Campus - Kolapakkam', 'Chennai', TRUE),
(12, 'VEL-NEWGEN', 'Velammal New Gen Edu Network', 'Chennai', TRUE),
(13, 'VEL-MATRIC-MOG', 'Velammal Matriculation - Mogappair', 'Chennai', TRUE),
(14, 'VEL-MAIN-MOG', 'Velammal Main School - Mogappair', 'Chennai', TRUE)
ON DUPLICATE KEY UPDATE campus_name=VALUES(campus_name), city=VALUES(city), is_active=VALUES(is_active);

-- 5. SEED DATA: SAMPLE VELAMMAL STUDENTS DATABASE FOR VERIFICATION
INSERT INTO velammal_students (campus_id, campus_name, admission_number, student_name, grade, section) VALUES
(1, 'Velammal Vidyalaya - Mogappair', 'VEL-MOG-1001', 'Aarav Sharma', 5, 'A'),
(1, 'Velammal Vidyalaya - Mogappair', 'VEL-MOG-1002', 'Diya Ramesh', 8, 'B'),
(1, 'Velammal Vidyalaya - Mogappair', 'VEL-MOG-1003', 'Karthik Raja', 10, 'C'),
(1, 'Velammal Vidyalaya - Mogappair', 'MOG202601', 'Sanjay Kumar', 6, 'A'),
(1, 'Velammal Vidyalaya - Mogappair', 'MOG202602', 'Pooja Sundaram', 9, 'B'),

(2, 'Velammal Vidyalaya - Mel Ayanambakkam', 'VEL-MEL-2001', 'Rithanya Shree', 5, 'A'),
(2, 'Velammal Vidyalaya - Mel Ayanambakkam', 'VEL-MEL-2002', 'Adithya Narayanan', 7, 'C'),
(2, 'Velammal Vidyalaya - Mel Ayanambakkam', 'VEL-MEL-2003', 'Naveen Vignesh', 11, 'A'),
(2, 'Velammal Vidyalaya - Mel Ayanambakkam', 'AYAN202601', 'Harish Balaji', 8, 'B'),

(3, 'Velammal Vidyalaya - Paruthipattu', 'VEL-PAR-3001', 'Meenakshi Iyer', 6, 'A'),
(3, 'Velammal Vidyalaya - Paruthipattu', 'VEL-PAR-3002', 'Vishal Anand', 9, 'D'),
(3, 'Velammal Vidyalaya - Paruthipattu', 'PAR202601', 'Ananya Krishnan', 12, 'A'),

(4, 'Velammal Vidyalaya - Avadi', 'VEL-AVD-4001', 'Saravanan M', 4, 'B'),
(4, 'Velammal Vidyalaya - Avadi', 'VEL-AVD-4002', 'Keerthana R', 8, 'A'),
(4, 'Velammal Vidyalaya - Avadi', 'AVD202601', 'Manoj Kumar', 10, 'B'),

(5, 'Velammal Vidyalaya - Poonamallee', 'VEL-POO-5001', 'Akash Sundar', 5, 'C'),
(5, 'Velammal Vidyalaya - Poonamallee', 'VEL-POO-5002', 'Sneha Lakshmi', 7, 'B'),

(6, 'Velammal Vidyalaya - Karambakkam', 'VEL-KAR-6001', 'Niranjan Swamy', 6, 'A'),
(6, 'Velammal Vidyalaya - Karambakkam', 'VEL-KAR-6002', 'Divya Prakash', 10, 'A'),

(7, 'Velammal Vidyalaya - Alapakkam', 'VEL-ALA-7001', 'Kavitha Nathan', 5, 'B'),
(7, 'Velammal Vidyalaya - Alapakkam', 'VEL-ALA-7002', 'Siddharth V', 8, 'A'),

(8, 'Velammal Vidyalaya - Annexure', 'VEL-ANN-8001', 'Praveen Chandran', 7, 'A'),
(8, 'Velammal Vidyalaya - Annexure', 'VEL-ANN-8002', 'Shreya Mohan', 11, 'B'),

(9, 'Velammal Vidyalaya - Madhavaram', 'VEL-MAD-9001', 'Gowtham Raj', 6, 'A'),
(9, 'Velammal Vidyalaya - Madhavaram', 'VEL-MAD-9002', 'Lavanya S', 9, 'C'),

(10, 'Velammal Bodhi Campus - Ponneri', 'BODHI-PON-101', 'Vikramaditya S', 8, 'A'),
(10, 'Velammal Bodhi Campus - Ponneri', 'BODHI-PON-102', 'Tarun Verma', 11, 'A'),

(11, 'Velammal Bodhi Campus - Kolapakkam', 'BODHI-KOL-201', 'Sai Pranav', 7, 'B'),
(11, 'Velammal Bodhi Campus - Kolapakkam', 'BODHI-KOL-202', 'Swetha Ravichandran', 10, 'A')
ON DUPLICATE KEY UPDATE student_name=VALUES(student_name), grade=VALUES(grade), section=VALUES(section);
