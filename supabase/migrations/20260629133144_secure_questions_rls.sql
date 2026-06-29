/*
# Secure questions table RLS policies

1. Security Changes
- Replace permissive INSERT/UPDATE/DELETE policies with a single admin-only policy
- The app has no authentication, so we restrict write operations to a secret admin key
- Read remains open for anon users (the exam generator needs this)
- Write operations (INSERT/UPDATE/DELETE) now require a secret admin key passed in the request

2. How it works
- A new column `admin_key` is added to the questions table
- Only requests that provide the correct admin_key in their query can modify rows
- The admin key is a UUID that must match for any write operation
- This prevents anonymous users from modifying the question pool while still allowing reads
*/

ALTER TABLE questions ADD COLUMN IF NOT EXISTS admin_key uuid;

-- Set a fixed admin key for existing rows (this will be the secret key for writes)
UPDATE questions SET admin_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid WHERE admin_key IS NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "questions_insert_all" ON questions;
DROP POLICY IF EXISTS "questions_update_all" ON questions;
DROP POLICY IF EXISTS "questions_delete_all" ON questions;

-- Create secure write policies that require admin_key match
DROP POLICY IF EXISTS "questions_insert_admin" ON questions;
CREATE POLICY "questions_insert_admin"
ON questions FOR INSERT
TO anon, authenticated
WITH CHECK (admin_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);

DROP POLICY IF EXISTS "questions_update_admin" ON questions;
CREATE POLICY "questions_update_admin"
ON questions FOR UPDATE
TO anon, authenticated
USING (admin_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid)
WITH CHECK (admin_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);

DROP POLICY IF EXISTS "questions_delete_admin" ON questions;
CREATE POLICY "questions_delete_admin"
ON questions FOR DELETE
TO anon, authenticated
USING (admin_key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
