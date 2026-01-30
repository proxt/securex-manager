/**
 * SecureX Manager - Database Setup Script
 * 
 * This script initializes the MySQL database with the required schema
 * and creates the default admin user.
 * 
 * Usage: node database/setup.js
 * 
 * Make sure to set the following environment variables:
 * - DATABASE_HOST (default: localhost)
 * - DATABASE_PORT (default: 3306)
 * - DATABASE_USER (default: root)
 * - DATABASE_PASSWORD (default: empty)
 * - DATABASE_NAME (default: securex_manager)
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
};

const DATABASE_NAME = process.env.DATABASE_NAME || 'securex_manager';

// Default admin credentials
const ADMIN_USERNAME = 'PROXT';
const ADMIN_PASSWORD = '32Ipubib5429';

async function setup() {
  let connection;
  
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(config);
    
    // Create database
    console.log(`Creating database "${DATABASE_NAME}"...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DATABASE_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.execute(`USE ${DATABASE_NAME}`);
    
    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      ) ENGINE=InnoDB
    `);
    
    // Create cards table
    console.log('Creating cards table...');
    await connection.execute(`
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
      ) ENGINE=InnoDB
    `);
    
    // Create card_items table
    console.log('Creating card_items table...');
    await connection.execute(`
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
      ) ENGINE=InnoDB
    `);
    
    // Create tasks table
    console.log('Creating tasks table...');
    await connection.execute(`
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
      ) ENGINE=InnoDB
    `);
    
    // Check if admin exists
    console.log('Checking for existing admin user...');
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [ADMIN_USERNAME]
    );
    
    if (existingUsers.length === 0) {
      // Create admin user
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [ADMIN_USERNAME, hashedPassword, 'admin']
      );
      console.log(`Admin user created: ${ADMIN_USERNAME}`);
    } else {
      console.log('Admin user already exists, skipping creation.');
    }
    
    console.log('\n========================================');
    console.log('Database setup completed successfully!');
    console.log('========================================');
    console.log(`\nAdmin credentials:`);
    console.log(`  Username: ${ADMIN_USERNAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\nMake sure to set the following environment variables:');
    console.log('  DATABASE_HOST=localhost');
    console.log('  DATABASE_PORT=3306');
    console.log('  DATABASE_USER=your_mysql_user');
    console.log('  DATABASE_PASSWORD=your_mysql_password');
    console.log('  DATABASE_NAME=securex_manager');
    console.log('  JWT_SECRET=your_secure_jwt_secret');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
