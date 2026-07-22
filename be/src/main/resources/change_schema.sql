-- Apply schema changes to an existing database in this file.
-- Run each change block only once, after taking a backup.

-- Separate participation response timestamps from generic updates such as memo edits.
ALTER TABLE match_participants
    ADD COLUMN responded_at DATETIME NULL AFTER memo;

-- Store monthly team-fee payment status and notes for each team member.
CREATE TABLE team_fee_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    team_member_id BIGINT UNSIGNED NOT NULL,
    payment_year SMALLINT UNSIGNED NOT NULL,
    payment_month TINYINT UNSIGNED NOT NULL,
    status ENUM('PAID', 'UNPAID', 'INJURED') NOT NULL DEFAULT 'UNPAID',
    memo VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_team_fee_payments_team_year (team_id, payment_year),
    KEY idx_team_fee_payments_member_year (team_member_id, payment_year)
);

-- Generalize the team table and keep existing football teams in the SOCCER category.
RENAME TABLE soccer_teams TO teams;

ALTER TABLE teams
    ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'SOCCER' AFTER created_by_user_id;

ALTER TABLE teams
    RENAME INDEX idx_soccer_teams_created_by_user_id TO idx_teams_created_by_user_id,
    RENAME INDEX idx_soccer_teams_name TO idx_teams_name;

-- Store final scores on the match and player statistics on each match participant.
ALTER TABLE matches
    ADD COLUMN team_score INT UNSIGNED NULL AFTER location,
    ADD COLUMN opponent_score INT UNSIGNED NULL AFTER team_score;

ALTER TABLE match_participants
    ADD COLUMN goal_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER participated,
    ADD COLUMN assist_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER goal_count,
    ADD COLUMN clean_sheet_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER assist_count;

