<?php
/**
 * Auto-Schema Initializer & Migrations
 * Ensures all required tables and seed data exist in Hostinger MySQL
 */

function ensureSchemaTables($pdo) {
    if (!$pdo || !($pdo instanceof PDO)) return;

    try {
        // 1. PARTICIPANTS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS participants (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                participant_id VARCHAR(50) UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                grade INT NOT NULL,
                section VARCHAR(10) NULL,
                school VARCHAR(255) NULL,
                date_of_birth DATE NOT NULL,
                guardian_name VARCHAR(255) NOT NULL,
                guardian_mobile VARCHAR(20) NOT NULL,
                band ENUM('JUNIOR', 'INTERMEDIATE', 'SENIOR') NOT NULL,
                entry_status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
                entry_payment_id BIGINT UNSIGNED NULL,
                qr_token VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Ensure school column exists if table already existed
        try {
            $pdo->exec("ALTER TABLE participants ADD COLUMN school VARCHAR(255) NULL AFTER section");
        } catch (Exception $e) {}

        // 2. SCHOOLS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS schools (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                school_name VARCHAR(255) NOT NULL UNIQUE,
                city VARCHAR(100) DEFAULT 'Chennai',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed schools if empty
        $checkSchools = $pdo->query("SELECT COUNT(*) as cnt FROM schools")->fetch();
        if (($checkSchools['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO schools (school_name, city) VALUES
                ('Velammal Vidyalaya - Mogappair', 'Chennai'),
                ('Velammal Vidyalaya - Mel Ayanambakkam', 'Chennai'),
                ('Velammal Vidyalaya - Paruthipattu', 'Chennai'),
                ('Velammal Vidyalaya - Avadi', 'Chennai'),
                ('Velammal Vidyalaya - Poonamallee', 'Chennai'),
                ('Velammal Vidyalaya - Karambakkam', 'Chennai'),
                ('Velammal Vidyalaya - Alapakkam', 'Chennai'),
                ('Velammal Vidyalaya - Annexure', 'Chennai'),
                ('Velammal Vidyalaya - Madhavaram', 'Chennai'),
                ('Velammal Bodhi Campus - Ponneri', 'Ponneri'),
                ('Velammal Bodhi Campus - Kolapakkam', 'Chennai'),
                ('Velammal New Gen Edu Network', 'Chennai'),
                ('Velammal Matriculation - Mogappair', 'Chennai'),
                ('Velammal Main School - Mogappair', 'Chennai'),
                ('DAV Boys Senior Secondary School - Mogappair', 'Chennai'),
                ('DAV Girls Senior Secondary School - Mogappair', 'Chennai'),
                ('DAV Public School - Velachery', 'Chennai'),
                ('PSBB Millennium School - Gerugambakkam', 'Chennai'),
                ('Padma Seshadri Bala Bhavan (PSBB) - KK Nagar', 'Chennai'),
                ('Padma Seshadri Bala Bhavan (PSBB) - Nungambakkam', 'Chennai'),
                ('Chettinad Vidyashram - R.A. Puram', 'Chennai'),
                ('SBOA School and Junior College - Anna Nagar', 'Chennai'),
                ('Chennai Public School (CPS) - Anna Nagar', 'Chennai'),
                ('Chennai Public School (CPS) - Thirumazhisai', 'Chennai'),
                ('Bala Vidya Mandir - Adyar', 'Chennai'),
                ('Kendriya Vidyalaya - IIT Madras', 'Chennai'),
                ('Kendriya Vidyalaya - CLRI', 'Chennai'),
                ('Kendriya Vidyalaya - Ashok Nagar', 'Chennai'),
                ('National Public School (NPS) - Gopalapuram', 'Chennai'),
                ('Chinmaya Vidyalaya - Kilpauk', 'Chennai'),
                ('Chinmaya Vidyalaya - Taylors Road', 'Chennai'),
                ('St. Johns International Residential School', 'Chennai'),
                ('Don Bosco Matriculation School - Egmore', 'Chennai'),
                ('The Schram Academy - Maduravoyal', 'Chennai'),
                ('Maharishi Vidya Mandir - Chetpet', 'Chennai');
            ");
        }

        // 3. VELAMMAL STUDENTS TABLE
        $pdo->exec("
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
                UNIQUE KEY uq_campus_admission (campus_name, admission_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 4. CONSENTS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS consents (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                participant_id BIGINT UNSIGNED NOT NULL,
                consent_type ENUM('GUARDIAN', 'MEDIA', 'LAPTOP', 'NON_REFUNDABLE') NOT NULL,
                is_given BOOLEAN DEFAULT FALSE,
                ip_address VARCHAR(45) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 5. WORKSHOP BOOKINGS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS workshop_bookings (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_reference VARCHAR(50) NOT NULL UNIQUE,
                participant_id BIGINT UNSIGNED NULL,
                workshop_id BIGINT UNSIGNED NOT NULL,
                workshop_type ENUM('PAID', 'FREE') NOT NULL,
                batch_id BIGINT UNSIGNED NULL,
                free_session_id BIGINT UNSIGNED NULL,
                status ENUM('SOFT_LOCK', 'CONFIRMED', 'CANCELLED', 'WAITLISTED') DEFAULT 'SOFT_LOCK',
                is_standby BOOLEAN DEFAULT FALSE,
                locked_until TIMESTAMP NULL,
                confirmed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 6. QR TOKENS TABLE (Opaque Token Source of Truth)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS qr_tokens (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                participant_id BIGINT UNSIGNED NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_qr_token (token),
                INDEX idx_qr_participant (participant_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 7. ATTENDANCE TABLE (Gate, Zone, Workshop Door, Theatre Door, Competition Marshalling)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                participant_id BIGINT UNSIGNED NOT NULL,
                checkpoint_type ENUM('GATE', 'ZONE', 'WORKSHOP', 'THEATRE', 'COMPETITION') NOT NULL DEFAULT 'GATE',
                checkpoint_name VARCHAR(255) NOT NULL DEFAULT 'Main Gate',
                session_id BIGINT UNSIGNED NULL,
                competition_window_id BIGINT UNSIGNED NULL,
                operator_name VARCHAR(255) DEFAULT 'Operator',
                operator_user_id BIGINT UNSIGNED NULL,
                status ENUM('VERIFIED', 'NOT_BOOKED', 'DUPLICATE_SILENT', 'DENIED') DEFAULT 'VERIFIED',
                device_timestamp BIGINT UNSIGNED NULL,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_att_participant (participant_id),
                INDEX idx_att_checkpoint (checkpoint_type, scanned_at),
                INDEX idx_att_dup_check (participant_id, checkpoint_type, checkpoint_name, scanned_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Ensure photo_url column exists in participants
        try {
            $pdo->exec("ALTER TABLE participants ADD COLUMN photo_url VARCHAR(500) NULL AFTER school");
        } catch (Exception $e) {}

        // Ensure tier column exists in participants if needed
        try {
            $pdo->exec("ALTER TABLE participants ADD COLUMN tier VARCHAR(50) DEFAULT 'STANDARD' AFTER band");
        } catch (Exception $e) {}

        // Ensure school_id column exists in participants
        try {
            $pdo->exec("ALTER TABLE participants ADD COLUMN school_id BIGINT UNSIGNED NULL AFTER school");
        } catch (Exception $e) {}

        // Ensure coordinator_user_id column exists in schools
        try {
            $pdo->exec("ALTER TABLE schools ADD COLUMN coordinator_user_id BIGINT UNSIGNED NULL AFTER city");
        } catch (Exception $e) {}

        // 8. SCHOOL ESCORTING TEACHERS TABLE (1:20 Ratio Checker)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS school_escorts (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                school_id BIGINT UNSIGNED NULL,
                school_name VARCHAR(255) NOT NULL,
                escort_name VARCHAR(255) NOT NULL,
                phone VARCHAR(30) NOT NULL,
                email VARCHAR(255) NULL,
                designation VARCHAR(100) DEFAULT 'Escorting Teacher',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_escort_school (school_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 9. SEED VELAMMAL CAMPUSES IF EMPTY
        $checkCampuses = $pdo->query("SELECT COUNT(*) as cnt FROM velammal_campuses")->fetch();
        if (($checkCampuses['cnt'] ?? 0) == 0) {
            $pdo->exec("
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
                (14, 'VEL-MAIN-MOG', 'Velammal Main School - Mogappair', 'Chennai', TRUE);
            ");
        }

        // 7. SEED VELAMMAL STUDENTS IF EMPTY
        $checkStudents = $pdo->query("SELECT COUNT(*) as cnt FROM velammal_students")->fetch();
        if (($checkStudents['cnt'] ?? 0) == 0) {
            $pdo->exec("
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
                (11, 'Velammal Bodhi Campus - Kolapakkam', 'BODHI-KOL-202', 'Swetha Ravichandran', 10, 'A');
            ");
        // 10. AUDIT LOGS TABLE (Immutable log)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                actor_user_id BIGINT UNSIGNED NULL,
                actor_name VARCHAR(255) DEFAULT 'System Admin',
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                entity_id BIGINT UNSIGNED NOT NULL,
                reason TEXT NULL,
                before_json LONGTEXT NULL,
                after_json LONGTEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_actor (actor_user_id),
                INDEX idx_audit_entity (entity_type, entity_id),
                INDEX idx_audit_action (action),
                INDEX idx_audit_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 11. FEE BANDS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS fee_bands (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                label VARCHAR(255) NOT NULL,
                price_velammal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                price_other DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                effective_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed fee bands if empty
        $checkFee = $pdo->query("SELECT COUNT(*) as cnt FROM fee_bands")->fetch();
        if (($checkFee['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO fee_bands (code, label, price_velammal, price_other, effective_from) VALUES
                ('BAND-ENTRY', 'Standard Registration Fee', 0.00, 250.00, NOW()),
                ('BAND-WS-PREM', 'Premium Maker Masterclass', 300.00, 500.00, NOW()),
                ('BAND-WS-STD', 'Standard Design Workshop', 150.00, 250.00, NOW()),
                ('BAND-COMP-ROBO', 'Robotics & Rover Challenge', 200.00, 400.00, NOW()),
                ('BAND-COMP-AI', 'AI Hackathon & Buildathon', 100.00, 300.00, NOW());
            ");
        }

        // 12. VENUES TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS venues (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                building VARCHAR(255) DEFAULT 'Main Campus',
                capacity INT NOT NULL DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed venues if empty
        $checkVenues = $pdo->query("SELECT COUNT(*) as cnt FROM venues")->fetch();
        if (($checkVenues['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO venues (name, building, capacity) VALUES
                ('Lab 101 (AI Lab)', 'Block A - 1st Floor', 40),
                ('Lab 204 (Robotics Arena)', 'Block B - 2nd Floor', 60),
                ('Auditorium Main Theatre', 'Central Block', 350),
                ('Makerspace Studio', 'Innovation Wing', 45),
                ('Seminar Hall C', 'Block C - Ground Floor', 80);
            ");
        }

        // 13. WORKSHOPS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS workshops (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                is_paid BOOLEAN DEFAULT FALSE,
                fee_band_id BIGINT UNSIGNED NULL,
                price DECIMAL(10, 2) DEFAULT 0.00,
                min_grade INT DEFAULT 4,
                max_grade INT DEFAULT 12,
                laptop_required BOOLEAN DEFAULT FALSE,
                reg_open_at DATETIME NULL,
                reg_close_at DATETIME NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Ensure workshops columns
        try { $pdo->exec("ALTER TABLE workshops ADD COLUMN reg_open_at DATETIME NULL AFTER laptop_required"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE workshops ADD COLUMN reg_close_at DATETIME NULL AFTER reg_open_at"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE workshops ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER reg_close_at"); } catch (Exception $e) {}

        // Seed workshops if empty
        $checkWs = $pdo->query("SELECT COUNT(*) as cnt FROM workshops")->fetch();
        if (($checkWs['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO workshops (name, description, is_paid, price, min_grade, max_grade, laptop_required, is_active, reg_open_at, reg_close_at) VALUES
                ('Autonomous Robotics & Micro-ROS', 'Build and code ROS-powered autonomous obstacle avoiding rovers.', TRUE, 500.00, 7, 12, TRUE, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('Generative AI & LLM Agents', 'Build custom multimodal reasoning agents and local neural networks.', TRUE, 450.00, 8, 12, TRUE, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('Bio-Inspired Industrial Design', 'Clay sculpting, rapid 3D CAD modeling, and ergonomic prototyping.', FALSE, 0.00, 4, 10, FALSE, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('Cybersecurity Defense & Ethical Hacking', 'Hands-on capture-the-flag network defense and cryptography.', TRUE, 400.00, 9, 12, TRUE, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('AR/VR Spatial UI with Unity', 'Craft immersive 3D spatial user experiences and holographic widgets.', FALSE, 0.00, 6, 12, TRUE, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59');
            ");
        }

        // 14. BATCHES TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS batches (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                workshop_id BIGINT UNSIGNED NOT NULL,
                name VARCHAR(100) NOT NULL,
                capacity INT NOT NULL DEFAULT 40,
                seats_taken INT NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_batch_ws (workshop_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed batches if empty
        $checkBatches = $pdo->query("SELECT COUNT(*) as cnt FROM batches")->fetch();
        if (($checkBatches['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO batches (workshop_id, name, capacity, seats_taken) VALUES
                (1, 'Batch A - Day 1 Morning', 40, 18),
                (1, 'Batch B - Day 2 Morning', 40, 32),
                (2, 'Batch A - Day 1 Afternoon', 45, 41),
                (2, 'Batch B - Day 3 Morning', 45, 12),
                (3, 'Batch A - Day 1 Morning', 50, 48),
                (4, 'Batch A - Day 2 Afternoon', 40, 25),
                (5, 'Batch A - Day 3 Afternoon', 45, 20);
            ");
        }

        // 15. SESSIONS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS sessions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                batch_id BIGINT UNSIGNED NOT NULL,
                venue_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
                starts_at DATETIME NOT NULL,
                ends_at DATETIME NOT NULL,
                capacity INT NOT NULL DEFAULT 40,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_sess_batch (batch_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed sessions if empty
        $checkSessions = $pdo->query("SELECT COUNT(*) as cnt FROM sessions")->fetch();
        if (($checkSessions['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO sessions (batch_id, venue_id, starts_at, ends_at, capacity) VALUES
                (1, 2, '2026-11-06 09:30:00', '2026-11-06 12:30:00', 40),
                (2, 2, '2026-11-07 09:30:00', '2026-11-07 12:30:00', 40),
                (3, 1, '2026-11-06 13:30:00', '2026-11-06 16:30:00', 45),
                (4, 1, '2026-11-08 09:30:00', '2026-11-08 12:30:00', 45),
                (5, 4, '2026-11-06 09:30:00', '2026-11-06 12:30:00', 50),
                (6, 1, '2026-11-07 13:30:00', '2026-11-07 16:30:00', 40),
                (7, 5, '2026-11-08 13:30:00', '2026-11-08 16:30:00', 45);
            ");
        }

        // 16. COMPETITIONS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS competitions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                is_team BOOLEAN DEFAULT TRUE,
                min_team_size INT DEFAULT 1,
                max_team_size INT DEFAULT 4,
                allow_reserve BOOLEAN DEFAULT TRUE,
                fee_band_id BIGINT UNSIGNED NULL,
                price DECIMAL(10, 2) DEFAULT 0.00,
                reg_open_at DATETIME NULL,
                reg_close_at DATETIME NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed competitions if empty
        $checkComp = $pdo->query("SELECT COUNT(*) as cnt FROM competitions")->fetch();
        if (($checkComp['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO competitions (name, description, is_team, min_team_size, max_team_size, allow_reserve, price, is_active, reg_open_at, reg_close_at) VALUES
                ('Autonomous Rover Grand Prix', 'Multi-terrain obstacle race for autonomous rovers with live telemetry scoring.', TRUE, 2, 4, TRUE, 400.00, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('24-Hour AI Innovation Hackathon', 'Rapid prototyping of generative AI solutions for climate and healthcare.', TRUE, 3, 4, FALSE, 300.00, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('Speed CAD Modeling Sprint', 'Individual timed 3D parametric modeling challenge for industrial mechanical parts.', FALSE, 1, 1, FALSE, 150.00, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59'),
                ('Cyber Defend CTF Clash', 'Team offensive & defensive cybersecurity capture-the-flag showdown.', TRUE, 2, 3, TRUE, 250.00, TRUE, '2026-09-01 09:00:00', '2026-10-30 23:59:59');
            ");
        }

        // 17. COMPETITION WINDOWS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS competition_windows (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                competition_id BIGINT UNSIGNED NOT NULL,
                venue_id BIGINT UNSIGNED NOT NULL DEFAULT 3,
                stage ENUM('PRELIMINARY', 'FINAL') DEFAULT 'PRELIMINARY',
                name VARCHAR(255) NOT NULL DEFAULT 'Prelims Round',
                starts_at DATETIME NOT NULL,
                ends_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_comp_win (competition_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed competition windows if empty
        $checkWin = $pdo->query("SELECT COUNT(*) as cnt FROM competition_windows")->fetch();
        if (($checkWin['cnt'] ?? 0) == 0) {
            $pdo->exec("
                INSERT INTO competition_windows (competition_id, venue_id, stage, name, starts_at, ends_at) VALUES
                (1, 2, 'PRELIMINARY', 'Rover Prelims - Heat 1', '2026-11-06 14:00:00', '2026-11-06 17:00:00'),
                (1, 2, 'PRELIMINARY', 'Rover Prelims - Heat 2', '2026-11-07 14:00:00', '2026-11-07 17:00:00'),
                (1, 2, 'FINAL', 'Rover Grand Finale Championship', '2026-11-08 14:30:00', '2026-11-08 17:30:00'),
                (2, 3, 'PRELIMINARY', 'AI Hackathon Initial Pitching', '2026-11-06 16:00:00', '2026-11-06 19:00:00'),
                (2, 3, 'FINAL', 'AI Hackathon Grand Finals & Live Demo', '2026-11-08 10:00:00', '2026-11-08 13:00:00'),
                (3, 4, 'FINAL', 'Speed CAD Finals Sprint', '2026-11-07 10:00:00', '2026-11-07 13:00:00');
            ");
        }

        // 18. COMPETITION ENTRIES TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS competition_entries (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                competition_window_id BIGINT UNSIGNED NOT NULL,
                participant_id BIGINT UNSIGNED NULL,
                team_id BIGINT UNSIGNED NULL,
                status ENUM('CONFIRMED', 'CANCELLED', 'QUALIFIED') DEFAULT 'CONFIRMED',
                score DECIMAL(6, 2) DEFAULT 0.00,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_entry_win (competition_window_id),
                INDEX idx_entry_part (participant_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 19. WAITLISTS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS waitlists (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                participant_id BIGINT UNSIGNED NOT NULL,
                batch_id BIGINT UNSIGNED NOT NULL,
                position INT NOT NULL DEFAULT 1,
                state ENUM('WAITING', 'OFFERED', 'ACCEPTED', 'EXPIRED') DEFAULT 'WAITING',
                offered_at TIMESTAMP NULL,
                offer_expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_waitlist_batch (batch_id, state)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 20. PAYMENTS TABLE
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payments (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                order_ref VARCHAR(100) UNIQUE NOT NULL,
                gateway_ref VARCHAR(100) NULL,
                payer_user_id BIGINT UNSIGNED NULL,
                payer_name VARCHAR(255) NULL,
                payer_email VARCHAR(255) NULL,
                payer_phone VARCHAR(30) NULL,
                school_name VARCHAR(255) NULL,
                amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                currency VARCHAR(10) DEFAULT 'INR',
                status ENUM('PAID', 'PENDING', 'FAILED', 'REFUNDED') DEFAULT 'PAID',
                method VARCHAR(50) DEFAULT 'UPI / Razorpay',
                refund_reason TEXT NULL,
                refunded_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_pay_order (order_ref),
                INDEX idx_pay_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 21. NOTIFICATIONS TABLE (Communications Hub)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                recipient_user_id BIGINT UNSIGNED NULL,
                recipient_phone VARCHAR(30) NULL,
                recipient_email VARCHAR(255) NULL,
                channel ENUM('SMS', 'EMAIL') NOT NULL DEFAULT 'EMAIL',
                segment VARCHAR(100) NOT NULL DEFAULT 'ALL',
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'SENT',
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_notif_seg (segment)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Column upgrades for participants (dietary, medical, laptop)
        try { $pdo->exec("ALTER TABLE participants ADD COLUMN dietary_pref VARCHAR(100) DEFAULT 'Standard' AFTER photo_url"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE participants ADD COLUMN medical_info VARCHAR(255) DEFAULT 'None' AFTER dietary_pref"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE participants ADD COLUMN needs_laptop BOOLEAN DEFAULT FALSE AFTER medical_info"); } catch (Exception $e) {}

        // Column upgrades for schools (tier, status)
        try { $pdo->exec("ALTER TABLE schools ADD COLUMN tier ENUM('STANDARD', 'VELAMMAL', 'PARTNER') DEFAULT 'STANDARD' AFTER city"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE schools ADD COLUMN status ENUM('APPROVED', 'PENDING') DEFAULT 'APPROVED' AFTER tier"); } catch (Exception $e) {}

        // Column upgrades for workshop_bookings (override_reason)
        try { $pdo->exec("ALTER TABLE workshop_bookings ADD COLUMN override_reason TEXT NULL AFTER is_standby"); } catch (Exception $e) {}

        // Column upgrades for bookings if using bookings table
        try { $pdo->exec("ALTER TABLE bookings ADD COLUMN override_reason TEXT NULL"); } catch (Exception $e) {}

    } catch (Exception $e) {
        error_log("Schema auto-init error: " . $e->getMessage());
    }
}
?>
