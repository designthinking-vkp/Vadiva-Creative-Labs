-- ==========================================================================
-- VADIVA TECH FEST 3.0 — PART E: SLOT AND CAPACITY MODEL DATABASE SCHEMA
-- Specification Reference: Part E (E1, E2, E3, E4)
-- ==========================================================================

-- 1. SLOTS TABLE (Paid & Free Master Time Windows)
CREATE TABLE IF NOT EXISTS festival_slots (
    slot_code VARCHAR(20) PRIMARY KEY,
    slot_type ENUM('PAID', 'FREE') NOT NULL,
    day_number INT NOT NULL,
    time_window VARCHAR(50) NOT NULL,
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. VALID BATCH PAIRINGS (Data Table for E2)
-- Store valid pairings in a table so operations can add, remove, or re-time a batch without code deployment
CREATE TABLE IF NOT EXISTS batch_pairings (
    batch_code VARCHAR(20) PRIMARY KEY,
    session_1_slot VARCHAR(20) NOT NULL,
    session_2_slot VARCHAR(20) NOT NULL,
    notes VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_1_slot) REFERENCES festival_slots(slot_code),
    FOREIGN KEY (session_2_slot) REFERENCES festival_slots(slot_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. WORKSHOPS MASTER TABLE (E3 Paid + E4 Free)
CREATE TABLE IF NOT EXISTS workshops (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workshop_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_desc TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    price_velammal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_other DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    binding_constraint VARCHAR(255) NULL,
    default_capacity_per_batch INT NOT NULL DEFAULT 40,
    min_grade INT NOT NULL DEFAULT 4,
    max_grade INT NOT NULL DEFAULT 12,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PAID WORKSHOP BATCHES (Per-batch capacity & occupancy)
CREATE TABLE IF NOT EXISTS workshop_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workshop_id BIGINT UNSIGNED NOT NULL,
    batch_code VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 40,
    seats_taken INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_workshop_batch (workshop_id, batch_code),
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_code) REFERENCES batch_pairings(batch_code) ON DELETE RESTRICT,
    CHECK (capacity >= 0),
    CHECK (seats_taken >= 0 AND seats_taken <= capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. FREE THEATRES TABLE (E4)
CREATE TABLE IF NOT EXISTS free_theatres (
    theatre_code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. FREE WORKSHOP SESSIONS (20 instances = 10 slots x 2 theatres)
CREATE TABLE IF NOT EXISTS free_workshop_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workshop_id BIGINT UNSIGNED NOT NULL,
    slot_code VARCHAR(20) NOT NULL,
    theatre_code VARCHAR(10) NOT NULL,
    total_seats INT NOT NULL DEFAULT 100,
    public_booking_seats INT NOT NULL DEFAULT 80,    -- 80% public booking
    standby_holdback_seats INT NOT NULL DEFAULT 20,   -- 20% standby holdback
    seats_taken INT NOT NULL DEFAULT 0,
    standby_taken INT NOT NULL DEFAULT 0,
    standby_released BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_session_theatre_slot (slot_code, theatre_code),
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_code) REFERENCES festival_slots(slot_code) ON DELETE RESTRICT,
    FOREIGN KEY (theatre_code) REFERENCES free_theatres(theatre_code) ON DELETE RESTRICT,
    CHECK (seats_taken >= 0 AND seats_taken <= total_seats)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SEAT RESERVATION SOFT-LOCKS & BOOKINGS (Real-Time Availability Engine)
CREATE TABLE IF NOT EXISTS workshop_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(50) NOT NULL UNIQUE,
    participant_id BIGINT UNSIGNED NULL,
    workshop_id BIGINT UNSIGNED NOT NULL,
    workshop_type ENUM('PAID', 'FREE') NOT NULL,
    batch_id BIGINT UNSIGNED NULL,           -- For paid workshops
    free_session_id BIGINT UNSIGNED NULL,    -- For free workshops
    status ENUM('SOFT_LOCK', 'CONFIRMED', 'CANCELLED', 'WAITLISTED') DEFAULT 'SOFT_LOCK',
    is_standby BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id),
    FOREIGN KEY (batch_id) REFERENCES workshop_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (free_session_id) REFERENCES free_workshop_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- SEED DATA: E1 PAID WORKSHOP SLOTS
-- ==========================================================================
INSERT INTO festival_slots (slot_code, slot_type, day_number, time_window, starts_at, ends_at, is_available, notes) VALUES
('D1-AM', 'PAID', 1, '09:30 – 11:30', '09:30:00', '11:30:00', TRUE, 'Day 1 Morning Session'),
('D1-PM', 'PAID', 1, '13:30 – 15:30', '13:30:00', '15:30:00', TRUE, 'Day 1 Afternoon Session'),
('D2-AM', 'PAID', 2, '09:30 – 11:30', '09:30:00', '11:30:00', TRUE, 'Day 2 Morning Session'),
('D2-PM', 'PAID', 2, '13:30 – 15:30', '13:30:00', '15:30:00', TRUE, 'Day 2 Afternoon Session'),
('D3-AM', 'PAID', 3, '09:30 – 11:30', '09:30:00', '11:30:00', TRUE, 'Day 3 Morning Session'),
('D3-PM', 'PAID', 3, '13:30 – 15:30', '13:30:00', '15:30:00', FALSE, 'NO — reserved for finals and grand awards');

-- ==========================================================================
-- SEED DATA: E2 VALID BATCH PAIRINGS (DATA TABLE)
-- ==========================================================================
INSERT INTO batch_pairings (batch_code, session_1_slot, session_2_slot, notes, is_active) VALUES
('B-01', 'D1-AM', 'D2-AM', 'Morning track, Days 1–2', TRUE),
('B-02', 'D1-PM', 'D2-PM', 'Afternoon track, Days 1–2', TRUE),
('B-03', 'D2-AM', 'D3-AM', 'Morning track, Days 2–3', TRUE),
('B-04', 'D2-PM', 'D3-AM', 'Afternoon into morning — cross-slot pairing (Day 3 PM unavailable)', TRUE);

-- ==========================================================================
-- SEED DATA: E4 FREE WORKSHOP SLOTS
-- ==========================================================================
INSERT INTO festival_slots (slot_code, slot_type, day_number, time_window, starts_at, ends_at, is_available, notes) VALUES
('F-D1-1', 'FREE', 1, '10:00 – 11:00', '10:00:00', '11:00:00', TRUE, 'Day 1 Slot 1'),
('F-D1-2', 'FREE', 1, '12:00 – 13:00', '12:00:00', '13:00:00', TRUE, 'Day 1 Slot 2'),
('F-D1-3', 'FREE', 1, '14:00 – 15:00', '14:00:00', '15:00:00', TRUE, 'Day 1 Slot 3'),
('F-D1-4', 'FREE', 1, '16:00 – 17:00', '16:00:00', '17:00:00', TRUE, 'Day 1 Slot 4'),
('F-D2-1', 'FREE', 2, '10:00 – 11:00', '10:00:00', '11:00:00', TRUE, 'Day 2 Slot 1'),
('F-D2-2', 'FREE', 2, '12:00 – 13:00', '12:00:00', '13:00:00', TRUE, 'Day 2 Slot 2'),
('F-D2-3', 'FREE', 2, '14:00 – 15:00', '14:00:00', '15:00:00', TRUE, 'Day 2 Slot 3'),
('F-D2-4', 'FREE', 2, '16:00 – 17:00', '16:00:00', '17:00:00', TRUE, 'Day 2 Slot 4'),
('F-D3-1', 'FREE', 3, '10:00 – 11:00', '10:00:00', '11:00:00', TRUE, 'Day 3 Slot 1'),
('F-D3-2', 'FREE', 3, '12:00 – 13:00', '12:00:00', '13:00:00', TRUE, 'Day 3 Slot 2 — last free sessions of festival');

-- ==========================================================================
-- SEED DATA: E4 THEATRES
-- ==========================================================================
INSERT INTO free_theatres (theatre_code, name, total_capacity, is_active) VALUES
('A', 'Theatre Alpha (Innovation Arena)', 100, TRUE),
('B', 'Theatre Beta (Discovery Hall)', 100, TRUE);

-- ==========================================================================
-- SEED DATA: E3 10 PAID WORKSHOPS WITH BINDING CONSTRAINTS & CAPACITIES
-- ==========================================================================
INSERT INTO workshops (id, workshop_code, name, short_desc, is_paid, price_velammal, price_other, binding_constraint, default_capacity_per_batch, min_grade, max_grade, image_url) VALUES
(1, 'WS-ROCKET', 'Rocket Lab', 'Build pneumatic and solid-propellant rockets. Test thrust curves, stability, and aerodynamics with live outdoor launches.', TRUE, 400.00, 550.00, 'Launch cycles at the outdoor pad', 20, 5, 12, 'https://images.unsplash.com/photo-1517976487541-05bf47990176?auto=format&fit=crop&w=600&q=80'),
(2, 'WS-SATELLITE', 'Satellite Makers', 'Assemble functioning CubeSat scale model payloads with environmental sensors, telemetry transceivers, and ground-station tracking.', TRUE, 450.00, 600.00, 'Sensor kits and bench space', 25, 6, 12, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'),
(3, 'WS-DRONE', 'Drone Pilot Academy', 'Learn quadcopter aerodynamics, optical-flow positioning, and manual FPV flight maneuvers inside the safety flight cage.', TRUE, 450.00, 600.00, 'Cage flight time per pilot', 20, 5, 12, 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80'),
(4, 'WS-AEROFORGE', 'Aeroforge', 'Craft RC high-lift gliders from carbon composite and foam boards. Master transmitter trims, stall recovery, and arena flight physics.', TRUE, 400.00, 550.00, 'Transmitter and Air Arena flight time', 20, 5, 12, 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=600&q=80'),
(5, 'WS-ARVR', 'AR/VR Experience Lab', 'Develop immersive 3D spatial environments in WebXR. Deploy interactive holographic scenes directly to VR headsets.', TRUE, 350.00, 500.00, 'Headset viewers and floor space', 40, 5, 12, 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&q=80'),
(6, 'WS-AI', 'AI Inventors Lab', 'Train computer vision and voice classification neural networks using edge accelerators. Build interactive gesture-controlled apps.', TRUE, 400.00, 550.00, 'Instructor-to-student ratio', 40, 6, 12, 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=600&q=80'),
(7, 'WS-GAMEFORGE', 'Game Forge', 'Design and script 2D physics-based arcade and platformer games with custom sprite animations, sound effects, and enemy AI.', TRUE, 350.00, 500.00, 'Instructor-to-student ratio', 40, 4, 12, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'),
(8, 'WS-3DMAKERS', '3D Makers Lab', 'Parametric 3D CAD modeling with live slicer optimization and multi-filament 3D printer calibration and physical manufacturing.', TRUE, 350.00, 500.00, '3D printer throughput', 20, 4, 12, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
(9, 'WS-ARDUINO', 'Arduino Inventors Lab', 'Microcontroller circuits, PWM motor drives, ultrasonic sonar radar, and hardware sensor integration on breadboards.', TRUE, 350.00, 500.00, 'Bench space and power outlets', 25, 5, 12, 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80'),
(10, 'WS-ANIMATION', 'Animation Lab', 'Stop-motion, vector tweening, character rigging, and frame-by-frame visual storytelling for digital media production.', TRUE, 300.00, 450.00, 'Instructor-to-student ratio', 40, 4, 12, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80');

-- ==========================================================================
-- SEED DATA: WORKSHOP BATCHES (4 Batches per Paid Workshop: B-01 to B-04)
-- ==========================================================================
INSERT INTO workshop_batches (workshop_id, batch_code, capacity, seats_taken)
SELECT w.id, bp.batch_code, w.default_capacity_per_batch, 
       FLOOR(RAND() * (w.default_capacity_per_batch * 0.75)) -- initial simulated seed occupancy
FROM workshops w
CROSS JOIN batch_pairings bp
WHERE w.is_paid = TRUE;

-- ==========================================================================
-- SEED DATA: E4 10 FREE WORKSHOP TOPICS
-- ==========================================================================
INSERT INTO workshops (id, workshop_code, name, short_desc, is_paid, price_velammal, price_other, binding_constraint, default_capacity_per_batch, min_grade, max_grade, image_url) VALUES
(11, 'FREE-DT', 'Design Thinking Bootcamp', '5-stage human-centered innovation method — rapid problem framing, ideation, and paper prototyping.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 4, 12, 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'),
(12, 'FREE-SKETCH', 'Sketching & Visual Thinking', 'Transform complex technical thoughts into visual frameworks, wireframe sketches, and graphic representations.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 4, 12, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80'),
(13, 'FREE-PITCH', 'Public Speaking & Pitching', 'Story arcs, vocal projection, body language, and elevator pitch structuring for young startup creators.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 5, 12, 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80'),
(14, 'FREE-SCIENCE', 'Science Demonstrations', 'Spectacular live physics and chemistry experiments exploring cryogenics, vortex dynamics, and electromagnetism.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 4, 12, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80'),
(15, 'FREE-ENTREP', 'Student Entrepreneurship', 'Validating customer pain points, unit economics, and building viable student-led venture blueprints.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 6, 12, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80'),
(16, 'FREE-CODE', 'Creative Coding with p5.js', 'Generate generative art, interactive visualizers, and mathematical beauty through introductory JavaScript.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 5, 12, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80'),
(17, 'FREE-ELEC', 'Electronics Playground', 'Introductory circuitry, polarity, breadboard basics, and making your first light-chaser gadget.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 4, 12, 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80'),
(18, 'FREE-CAD', 'CAD & 3D Modeling Intro', 'Beginner spatial design in Tinkercad, Boolean operations, and understanding 3D coordinate geometry.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 4, 12, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
(19, 'FREE-SPACE', 'Space Exploration Lab', 'Astrophysics basics, orbital mechanics, planetary landers, and future lunar/Martian habitat engineering.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 5, 12, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'),
(20, 'FREE-CYBER', 'Cyber Safety & AI Ethics', 'Protecting digital identity, understanding algorithmic bias, deepfake detection, and responsible online citizenship.', FALSE, 0.00, 0.00, 'Theatre seat capacity', 100, 5, 12, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80');

-- ==========================================================================
-- SEED DATA: E4 20 FREE THEATRE SESSIONS (10 slots x 2 theatres, 2 repeats each)
-- ==========================================================================
INSERT INTO free_workshop_sessions (workshop_id, slot_code, theatre_code, total_seats, public_booking_seats, standby_holdback_seats, seats_taken) VALUES
(11, 'F-D1-1', 'A', 100, 80, 20, 45),
(12, 'F-D1-1', 'B', 100, 80, 20, 32),
(13, 'F-D1-2', 'A', 100, 80, 20, 60),
(14, 'F-D1-2', 'B', 100, 80, 20, 55),
(15, 'F-D1-3', 'A', 100, 80, 20, 40),
(16, 'F-D1-3', 'B', 100, 80, 20, 68),
(17, 'F-D1-4', 'A', 100, 80, 20, 28),
(18, 'F-D1-4', 'B', 100, 80, 20, 72),
(19, 'F-D2-1', 'A', 100, 80, 20, 58),
(20, 'F-D2-1', 'B', 100, 80, 20, 44),
(11, 'F-D2-2', 'A', 100, 80, 20, 62), -- repeat topic 11
(12, 'F-D2-2', 'B', 100, 80, 20, 39), -- repeat topic 12
(13, 'F-D2-3', 'A', 100, 80, 20, 51), -- repeat topic 13
(14, 'F-D2-3', 'B', 100, 80, 20, 77), -- repeat topic 14
(15, 'F-D2-4', 'A', 100, 80, 20, 33), -- repeat topic 15
(16, 'F-D2-4', 'B', 100, 80, 20, 48), -- repeat topic 16
(17, 'F-D3-1', 'A', 100, 80, 20, 65), -- repeat topic 17
(18, 'F-D3-1', 'B', 100, 80, 20, 54), -- repeat topic 18
(19, 'F-D3-2', 'A', 100, 80, 20, 70), -- repeat topic 19
(20, 'F-D3-2', 'B', 100, 80, 20, 64); -- repeat topic 20
