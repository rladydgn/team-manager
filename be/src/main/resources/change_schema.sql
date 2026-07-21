-- Apply schema changes to an existing database in this file.
-- Run each change block only once, after taking a backup.

-- Separate participation response timestamps from generic updates such as memo edits.
ALTER TABLE match_participants
    ADD COLUMN responded_at DATETIME NULL AFTER memo;

