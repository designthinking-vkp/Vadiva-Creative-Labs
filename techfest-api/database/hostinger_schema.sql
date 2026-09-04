-- ============================================================
-- Hostinger MySQL Database Schema for Vadiva TechFest
-- Vadiva Creative Labs - Tech & Design Fest '26
-- NOTE: On Hostinger, select your database (e.g. u847742361_techfest) 
-- in phpMyAdmin first, then run this SQL script directly.
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS techfest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE techfest_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('student', 'parent', 'admin', 'developer', 'participant') DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(50) NULL,
    school_name VARCHAR(255) NULL,
    class_name VARCHAR(100) NULL,
    student_phone VARCHAR(30) NULL,
    student_email VARCHAR(255) NULL,
    parent_name VARCHAR(255) NULL,
    parent_phone VARCHAR(30) NULL,
    parent_email VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. WORKSHOPS TABLE
CREATE TABLE IF NOT EXISTS workshops (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workshop_code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    event_date DATE NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    venue VARCHAR(255) NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_velammal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT TRUE,
    capacity INT NULL DEFAULT 40,
    registered_count INT NOT NULL DEFAULT 0,
    min_grade INT DEFAULT 4,
    max_grade INT DEFAULT 12,
    status ENUM('draft', 'active', 'closed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    student_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    registration_status ENUM(
        'initiated',
        'pending_payment',
        'payment_processing',
        'confirmed',
        'payment_failed',
        'cancelled'
    ) DEFAULT 'initiated',
    confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. REGISTRATION_WORKSHOPS TABLE (Many-to-Many with Snapshot)
CREATE TABLE IF NOT EXISTS registration_workshops (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id BIGINT UNSIGNED NOT NULL,
    workshop_id BIGINT UNSIGNED NOT NULL,
    workshop_name_snapshot VARCHAR(255) NOT NULL,
    workshop_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_registration_workshop (registration_id, workshop_id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    razorpay_order_id VARCHAR(255) NULL,
    razorpay_payment_id VARCHAR(255) NULL,
    razorpay_signature VARCHAR(512) NULL,
    status ENUM(
        'created',
        'pending',
        'processing',
        'paid',
        'failed',
        'cancelled',
        'refunded'
    ) DEFAULT 'created',
    payment_method VARCHAR(100) NULL,
    failure_reason TEXT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_razorpay_payment (razorpay_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PAYMENT_ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id BIGINT UNSIGNED NOT NULL,
    razorpay_order_id VARCHAR(255) NULL,
    razorpay_payment_id VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM(
        'created',
        'pending',
        'paid',
        'failed',
        'cancelled'
    ) DEFAULT 'created',
    failure_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PERFORMANCE & LOOKUP INDEXES
-- ============================================================
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(registration_status);
CREATE INDEX idx_registration_workshops_registration ON registration_workshops(registration_id);
CREATE INDEX idx_registration_workshops_workshop ON registration_workshops(workshop_id);
CREATE INDEX idx_payments_registration ON payments(registration_id);
CREATE INDEX idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_attempts_registration ON payment_attempts(registration_id);

-- ============================================================
-- INITIAL SEED DATA FOR WORKSHOPS
-- ============================================================
INSERT INTO workshops (id, workshop_code, title, description, event_date, start_time, end_time, venue, price, price_velammal, is_paid, capacity, status)
VALUES
(1, 'WS-ROBOTICS', 'Robotics & Automation', 'Build and programme your own robot using sensors, servos and a micro-controller.', '2026-11-20', '10:00:00', '13:00:00', 'Robotics Lab, Hall A', 550.00, 400.00, TRUE, 40, 'active'),
(2, 'WS-AIML', 'AI & Machine Learning Basics', 'Hands-on intro to ML concepts — train your first model using real datasets.', '2026-11-20', '14:00:00', '17:00:00', 'Computer Lab 1', 550.00, 400.00, TRUE, 40, 'active'),
(3, 'WS-3DPRINT', '3D Printing & Design', 'Design objects in Tinkercad and print them on a live 3D printer.', '2026-11-21', '10:00:00', '13:00:00', 'Makerspace Studio', 500.00, 350.00, TRUE, 30, 'active'),
(4, 'WS-GAMEDEV', 'Game Development', 'Create your first 2D game from scratch using Unity — no prior experience needed.', '2026-11-21', '14:00:00', '17:00:00', 'Media & Coding Lab', 550.00, 400.00, TRUE, 35, 'active'),
(5, 'WS-CIRCUITS', 'Electronics & Circuits', 'Bread-board circuits, LEDs, resistors, and basic electronics for young engineers.', '2026-11-20', '10:00:00', '13:00:00', 'Innovation Hub', 450.00, 300.00, TRUE, 25, 'active'),
(6, 'WS-PYTHON', 'Python for Beginners', 'From variables to loops to functions — your first real Python coding workshop.', '2026-11-22', '10:00:00', '13:00:00', 'Computer Lab 2', 500.00, 350.00, TRUE, 40, 'active'),
(7, 'WS-DESIGNTHINK', 'Design Thinking Bootcamp', 'Learn the 5-stage design thinking process through fun group activities and challenges.', '2026-11-20', '11:00:00', '13:00:00', 'Auditorium Hall', 250.00, 250.00, FALSE, 80, 'active'),
(8, 'WS-SKETCHING', 'Sketching & Visual Thinking', 'Turn your ideas into visual stories — no artistic talent required.', '2026-11-21', '11:00:00', '13:00:00', 'Design Studio', 250.00, 250.00, FALSE, 60, 'active'),
(9, 'WS-PITCHING', 'Public Speaking & Pitching', 'Build confidence, structure your message, and pitch your idea like a pro.', '2026-11-21', '14:00:00', '16:00:00', 'Seminar Hall 1', 250.00, 250.00, FALSE, 60, 'active'),
(10, 'WS-SCIENCEDEMO', 'Science Demonstrations', 'Mind-blowing live science experiments exploring chemistry, physics, and biology.', '2026-11-22', '10:00:00', '12:00:00', 'Main Stage', 250.00, 250.00, FALSE, 100, 'active'),
(11, 'WS-ENTREPRENEUR', 'Student Entrepreneurship', 'Discover how to validate your idea, find your market, and build your first mini-business plan.', '2026-11-22', '14:00:00', '16:30:00', 'Seminar Hall 2', 250.00, 250.00, FALSE, 80, 'active')
ON DUPLICATE KEY UPDATE 
    title=VALUES(title),
    description=VALUES(description),
    price=VALUES(price),
    price_velammal=VALUES(price_velammal),
    venue=VALUES(venue);

-- ============================================================
-- 8. VELAMMAL CAMPUSES & STUDENT VERIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS velammal_campuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campus_code VARCHAR(50) NOT NULL UNIQUE,
    campus_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) DEFAULT 'Chennai',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
