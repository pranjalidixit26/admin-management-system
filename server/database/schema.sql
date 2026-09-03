--Admin Management System - Database Schema
--Reference file
--Sprint 1- Foundation tables

--users table

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- roles table

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- permissions table

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- user_roles junction table (many-to-many)

CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

--role_permissions junction table (many-to-many)

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

Seed initial roles

INSERT INTO roles (name, description) VALUES
('ADMIN', 'Full access to all system features and settings'),
('EDITOR', 'Can create and edit content, limited administrative access'),
('VIEWER', 'Read-only access to system data');

Seed initial permissions

INSERT INTO permissions (name, description) VALUES
('USER_CREATE', 'Permission to create new users'),
('USER_EDIT', 'Permission to edit existing users'),
('USER_DELETE', 'Permission to delete users');

-- Schema fix: align with spec (status naming, permissions code/name split)

ALTER TABLE users CHANGE is_active status BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE roles ADD COLUMN status BOOLEAN NOT NULL DEFAULT true AFTER description;

ALTER TABLE permissions CHANGE name code VARCHAR(255) NOT NULL;
ALTER TABLE permissions ADD COLUMN name VARCHAR(255) NOT NULL AFTER code;
ALTER TABLE permissions ADD UNIQUE (code);

UPDATE permissions SET name = 'Create User' WHERE code = 'USER_CREATE';
UPDATE permissions SET name = 'Edit User' WHERE code = 'USER_EDIT';
UPDATE permissions SET name = 'Delete User' WHERE code = 'USER_DELETE';