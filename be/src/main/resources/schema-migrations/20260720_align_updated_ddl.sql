-- MySQL 8.x migration
-- Source: current team_manager schema -> updated CREATE TABLE definitions.
-- DDL statements in MySQL implicitly commit. Back up the database first.

-- 1. Preflight checks. Resolve every returned row before the corresponding ALTER TABLE.
SELECT id, username
FROM users
WHERE email IS NULL OR TRIM(email) = '';

SELECT username, COUNT(*) AS duplicate_count
FROM users
GROUP BY username
HAVING COUNT(*) > 1;

SELECT email, COUNT(*) AS duplicate_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. Add the new nullable column, then backfill real values before making it required.
ALTER TABLE users
    ADD COLUMN birth_date DATE NULL AFTER name;

SELECT id, username
FROM users
WHERE birth_date IS NULL;

-- Apply a domain-approved backfill here. Do not use a fabricated date value.
-- Example only:
-- UPDATE users SET birth_date = 'YYYY-MM-DD' WHERE id = <user_id>;

-- 3. After the preflight results and birth_date values have been resolved, enforce the target constraints.
ALTER TABLE users
    MODIFY COLUMN birth_date DATE NOT NULL,
    MODIFY COLUMN email VARCHAR(255) NOT NULL,
    DROP INDEX idx_users_username,
    DROP INDEX idx_users_email,
    ADD UNIQUE KEY uk_users_username (username),
    ADD UNIQUE KEY uk_users_email (email);

-- 4. New team audit table.
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Team-member rejection state and status lookup index.
ALTER TABLE team_members
    MODIFY COLUMN status ENUM('ACTIVE', 'PENDING', 'REJECTED', 'LEFT', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    ADD KEY idx_team_members_team_status (team_id, status);

-- 6. Convert existing team/opponent score semantics to home/away naming.
-- This assumes team_score represents the home score. Verify internal-match rows before running.
ALTER TABLE match_records
    CHANGE COLUMN team_score home_score INT UNSIGNED NOT NULL,
    CHANGE COLUMN opponent_score away_score INT UNSIGNED NOT NULL,
    MODIFY COLUMN result ENUM('WIN', 'DRAW', 'LOSE', 'HOME_WIN', 'AWAY_WIN') NOT NULL;

UPDATE match_records
SET result = CASE result
    WHEN 'WIN' THEN 'HOME_WIN'
    WHEN 'LOSE' THEN 'AWAY_WIN'
    ELSE result
END;

ALTER TABLE match_records
    MODIFY COLUMN result ENUM('HOME_WIN', 'DRAW', 'AWAY_WIN') NOT NULL;

-- 7. Add each participant's side and its match-level lookup index.
ALTER TABLE match_participants
    ADD COLUMN team_side ENUM('HOME', 'AWAY') NOT NULL DEFAULT 'HOME' AFTER team_member_id,
    ADD KEY idx_match_participants_match_side (match_id, team_side);
