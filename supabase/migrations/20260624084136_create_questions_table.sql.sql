CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic_nr INTEGER NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Basis', 'Experte')),
  question TEXT NOT NULL,
  answer_a TEXT NOT NULL,
  answer_b TEXT NOT NULL,
  answer_c TEXT NOT NULL,
  answer_d TEXT NOT NULL,
  solution TEXT[] NOT NULL,
  source_hint TEXT
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_read_all" ON questions FOR SELECT
  TO PUBLIC USING (true);