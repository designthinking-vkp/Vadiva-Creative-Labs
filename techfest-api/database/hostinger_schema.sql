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
