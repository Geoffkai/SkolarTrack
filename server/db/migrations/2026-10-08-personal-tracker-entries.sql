-- Lets a student track a scholarship they added themselves (a "personal" entry):
-- a tracker row with no listing behind it. Brings a database created from the
-- previous schema.sql up to the current one.
--
-- Run once in the Neon SQL editor BEFORE running server code that reads these columns.
-- Safe on existing data: every current row has a scholarship_id and no personal_* values,
-- which is the first branch of the CHECK. The old server code keeps working afterwards.

BEGIN;

ALTER TABLE applications ALTER COLUMN scholarship_id DROP NOT NULL;

ALTER TABLE applications
  ADD COLUMN personal_title VARCHAR,
  ADD COLUMN personal_organization VARCHAR,
  ADD COLUMN personal_amount NUMERIC,
  ADD COLUMN personal_deadline DATE;

ALTER TABLE applications ADD CONSTRAINT applications_listing_or_personal CHECK (
  (scholarship_id IS NOT NULL
    AND personal_title IS NULL AND personal_organization IS NULL
    AND personal_amount IS NULL AND personal_deadline IS NULL)
  OR
  (scholarship_id IS NULL
    AND personal_title IS NOT NULL AND personal_organization IS NOT NULL)
);

COMMIT;

-- To undo. This deletes every personal entry, so only do it if that is acceptable:
--
-- BEGIN;
-- DELETE FROM applications WHERE scholarship_id IS NULL;
-- ALTER TABLE applications DROP CONSTRAINT applications_listing_or_personal;
-- ALTER TABLE applications
--   DROP COLUMN personal_title,
--   DROP COLUMN personal_organization,
--   DROP COLUMN personal_amount,
--   DROP COLUMN personal_deadline;
-- ALTER TABLE applications ALTER COLUMN scholarship_id SET NOT NULL;
-- COMMIT;
