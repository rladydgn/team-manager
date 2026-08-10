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

-- Keep a team-specific display name for registered members, guests, and non-members.
ALTER TABLE team_members
    ADD COLUMN display_name VARCHAR(50) NULL AFTER user_id;

UPDATE team_members tm
LEFT JOIN users u ON u.id = tm.user_id
SET tm.display_name = COALESCE(u.name, '미등록 팀원')
WHERE tm.display_name IS NULL;

ALTER TABLE team_members
    MODIFY COLUMN display_name VARCHAR(50) NOT NULL;

-- Store manager-only notes for each team member.
ALTER TABLE team_members
    ADD COLUMN memo VARCHAR(500) NULL AFTER display_name;

-- Store a configurable participation deadline for each match.
ALTER TABLE matches
    ADD COLUMN participation_deadline_at DATETIME NULL AFTER match_at;

UPDATE matches
SET participation_deadline_at = DATE_SUB(match_at, INTERVAL 1 DAY)
WHERE participation_deadline_at IS NULL;

ALTER TABLE matches
    MODIFY COLUMN participation_deadline_at DATETIME NOT NULL;

-- Add the fee-payment exemption status.
ALTER TABLE team_fee_payments
    MODIFY COLUMN status ENUM('PAID', 'UNPAID', 'INJURED', 'EXEMPT') NOT NULL DEFAULT 'UNPAID';

-- Clarify the match participant's pre-match vote and post-match attendance.
ALTER TABLE match_participants
    RENAME COLUMN status TO vote_status,
    RENAME COLUMN participated TO actual_participated,
    RENAME INDEX idx_match_participants_status TO idx_match_participants_vote_status;

