-- ============================================================
-- Add Test Mode Tracking Columns to registrations
-- Run this in phpMyAdmin to update the existing tables.
-- ============================================================

ALTER TABLE registrations
ADD COLUMN is_test_registration BOOLEAN DEFAULT FALSE AFTER registration_status,
ADD COLUMN environment VARCHAR(20) DEFAULT 'production' AFTER is_test_registration,
ADD COLUMN payment_mode VARCHAR(50) DEFAULT 'razorpay' AFTER environment,
ADD COLUMN otp_status VARCHAR(50) DEFAULT 'VERIFIED' AFTER payment_mode,
ADD COLUMN test_session_id VARCHAR(255) NULL AFTER otp_status;

ALTER TABLE payments MODIFY COLUMN status ENUM('created','pending','processing','paid','failed','cancelled','refunded','TEST_SUCCESS') DEFAULT 'created';
ALTER TABLE payment_attempts MODIFY COLUMN status ENUM('created','pending','paid','failed','cancelled','TEST_SUCCESS') DEFAULT 'created';