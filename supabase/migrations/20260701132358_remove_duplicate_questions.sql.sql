-- Remove duplicate questions, keeping the version in the more specific topic
-- Duplicates identified by same question text + same answer content (ignoring order) + same solution

-- TF03-007 (topic 3) vs TF07-001 (topic 7) - Keep TF07-001 (more specific: IT-Grundschutz-Check topic)
DELETE FROM questions WHERE id = 'TF03-007';

-- TF10-019 (topic 10) vs TF13-001 (topic 13) - Keep TF13-001 (more specific: Audit preparation topic)
DELETE FROM questions WHERE id = 'TF10-019';

-- TF03-004, TF05-007, TF12-001 - All about IT-Grundschutz-Profil
-- Keep TF12-001 (IT-Grundschutz-Profile specific topic), remove others
DELETE FROM questions WHERE id = 'TF03-004';
DELETE FROM questions WHERE id = 'TF05-007';

-- TF04-011 vs TF06-011 - Nutzungskonzept
-- Keep TF06-011 (Umsetzung topic is more specific), remove TF04-011
DELETE FROM questions WHERE id = 'TF04-011';

-- TF04-007 vs TF06-007 - Sicherheitskonzept
-- Keep TF06-007 (Umsetzung topic), remove TF04-007
DELETE FROM questions WHERE id = 'TF04-007';

-- TF06-031 vs TF14-001 - Sicherheitsvorfall
-- Keep TF14-001 (Sicherheitsvorfallbehandlung specific topic), remove TF06-031
DELETE FROM questions WHERE id = 'TF06-031';

-- TF04-009 vs TF06-009 - Maßnahmenplan
-- Keep TF06-009 (Umsetzung topic), remove TF04-009
DELETE FROM questions WHERE id = 'TF04-009';

-- TF05-008 vs TF12-003 - IT-Grundschutz-Profile (different answer ordering)
-- Keep TF12-003 (IT-Grundschutz-Profile specific topic), remove TF05-008
DELETE FROM questions WHERE id = 'TF05-008';

-- TF04-012, TF06-012, TF07-004 - IT-Grundschutz-Check
-- Keep TF07-004 (IT-Grundschutz-Check specific topic), remove others
DELETE FROM questions WHERE id = 'TF04-012';
DELETE FROM questions WHERE id = 'TF06-012';

-- TF04-010 vs TF06-010 - Risikoanalyse
-- Keep TF06-010 (Umsetzung topic), remove TF04-010
DELETE FROM questions WHERE id = 'TF04-010';

-- TF04-006 vs TF06-006 - Dokumente in Vorgehensweise
-- Keep TF06-006 (Umsetzung topic), remove TF04-006
DELETE FROM questions WHERE id = 'TF04-006';

-- TF04-008 vs TF06-008 - Rollen in Vorgehensweise
-- Keep TF06-008 (Umsetzung topic), remove TF04-008
DELETE FROM questions WHERE id = 'TF04-008';