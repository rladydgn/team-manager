ALTER TABLE users
  ADD COLUMN birth_date DATE NULL AFTER name;

UPDATE users
SET birth_date = STR_TO_DATE(CONCAT(birth_year, '-01-01'), '%Y-%m-%d');

ALTER TABLE users
  MODIFY birth_date DATE NOT NULL,
  DROP COLUMN birth_year;
