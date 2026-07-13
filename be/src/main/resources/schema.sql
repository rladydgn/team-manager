CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    phone_number VARCHAR(30) NULL,
    profile_image_url VARCHAR(500) NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE soccer_teams (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(30) NULL,
    logo_url VARCHAR(500) NULL,
    description TEXT NULL,
    region VARCHAR(100) NULL,
    home_stadium VARCHAR(100) NULL,
    founded_at DATE NULL,
    team_color VARCHAR(20) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_soccer_teams_created_by_user_id (created_by_user_id),
    KEY idx_soccer_teams_name (name),
    CONSTRAINT fk_soccer_teams_created_by_user_id
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE TABLE team_members (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('OWNER', 'SUB_MANAGER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    status ENUM('ACTIVE', 'PENDING', 'LEFT', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_team_members_team_user (team_id, user_id),
    KEY idx_team_members_user_id (user_id),
    KEY idx_team_members_team_role (team_id, role),
    CONSTRAINT fk_team_members_team_id
        FOREIGN KEY (team_id) REFERENCES soccer_teams (id),
    CONSTRAINT fk_team_members_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
);
