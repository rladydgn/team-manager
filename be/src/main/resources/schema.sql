CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
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
    KEY idx_soccer_teams_name (name)
);

CREATE TABLE team_histories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    action ENUM('UPDATE', 'DELETE') NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NOT NULL,
    before_snapshot TEXT NOT NULL,
    after_snapshot TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_team_histories_team_id (team_id),
    KEY idx_team_histories_changed_by_user_id (changed_by_user_id),
    KEY idx_team_histories_action (action)
);

CREATE TABLE team_members (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    role ENUM('OWNER', 'SUB_MANAGER', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'MEMBER',
    status ENUM('ACTIVE', 'PENDING', 'REJECTED', 'LEFT', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_team_members_team_user (team_id, user_id),
    KEY idx_team_members_user_id (user_id),
    KEY idx_team_members_team_role (team_id, role),
    KEY idx_team_members_team_status (team_id, status)
);

CREATE TABLE matches (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    match_type ENUM('EXTERNAL', 'INTERNAL') NOT NULL DEFAULT 'EXTERNAL',
    opponent_team_id BIGINT UNSIGNED NULL,
    opponent_team_name VARCHAR(100) NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    match_at DATETIME NOT NULL,
    location VARCHAR(255) NULL,
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'SCHEDULED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_matches_team_id (team_id),
    KEY idx_matches_team_type (team_id, match_type),
    KEY idx_matches_opponent_team_id (opponent_team_id),
    KEY idx_matches_created_by_user_id (created_by_user_id),
    KEY idx_matches_match_at (match_at)
);

CREATE TABLE match_records (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    match_id BIGINT UNSIGNED NOT NULL,
    home_score INT UNSIGNED NOT NULL,
    away_score INT UNSIGNED NOT NULL,
    result ENUM('HOME_WIN', 'DRAW', 'AWAY_WIN') NOT NULL,
    memo TEXT NULL,
    recorded_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_match_records_match_id (match_id),
    KEY idx_match_records_recorded_by_user_id (recorded_by_user_id)
);

CREATE TABLE match_participants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    match_id BIGINT UNSIGNED NOT NULL,
    team_member_id BIGINT UNSIGNED NOT NULL,
    team_side ENUM('HOME', 'AWAY') NOT NULL DEFAULT 'HOME',
    status ENUM('INVITED', 'AVAILABLE', 'UNAVAILABLE', 'PENDING') NOT NULL DEFAULT 'PENDING',
    participated TINYINT(1) NOT NULL DEFAULT 0,
    memo VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_match_participants_match_member (match_id, team_member_id),
    KEY idx_match_participants_team_member_id (team_member_id),
    KEY idx_match_participants_match_side (match_id, team_side),
    KEY idx_match_participants_status (match_id, status)
);
