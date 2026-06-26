/*
# Add CRUD policies for questions table

1. Security Changes
- Add INSERT, UPDATE, DELETE policies for the questions table
- Allow anon and authenticated users to create, update, and delete questions
- The app has no auth, so anon role must be able to write
*/

DROP POLICY IF EXISTS "questions_insert_all" ON questions;
CREATE POLICY "questions_insert_all"
ON questions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "questions_update_all" ON questions;
CREATE POLICY "questions_update_all"
ON questions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "questions_delete_all" ON questions;
CREATE POLICY "questions_delete_all"
ON questions FOR DELETE
TO anon, authenticated
USING (true);
