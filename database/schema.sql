-- SecureX Manager Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS securex_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE securex_manager;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB;

-- Cards table (Access entries)
CREATE TABLE IF NOT EXISTS cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  username VARCHAR(255),
  password VARCHAR(500),
  creator_id INT NOT NULL,
  creator_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_creator (creator_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Card Items table (Additional fields)
CREATE TABLE IF NOT EXISTS card_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  type ENUM('title', 'link', 'login', 'password', 'custom') NOT NULL,
  label VARCHAR(255) NOT NULL,
  value TEXT,
  custom_field VARCHAR(255),
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_card_id (card_id),
  INDEX idx_order (card_id, order_index),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date DATE,
  assigned_to INT,
  assignee_name VARCHAR(255),
  creator_id INT NOT NULL,
  creator_name VARCHAR(255) NOT NULL,
  card_id INT,
  card_title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_creator (creator_id),
  INDEX idx_card (card_id),
  INDEX idx_due_date (due_date),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert default admin user
-- Password: 32Ipubib5429 (hashed with bcrypt, 10 rounds)
-- IMPORTANT: Run the setup script (node database/setup.js) to create the admin user with proper password hash
-- Or manually hash the password using bcrypt and insert here
-- INSERT INTO users (username, password, role) 
-- VALUES ('PROXT', '$2a$10$HASHED_PASSWORD_HERE', 'admin')
-- ON DUPLICATE KEY UPDATE username = username;
