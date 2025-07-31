-- Migration script to copy development data to production database
-- Run this script in your PRODUCTION database through Replit's database interface

-- Clear existing data (if any) in production
DELETE FROM user_teams;
DELETE FROM users;
DELETE FROM teams;

-- Reset sequences
SELECT setval('users_id_seq', 1, false);
SELECT setval('teams_id_seq', 1, false);
SELECT setval('user_teams_id_seq', 1, false);

-- Insert user data from development
INSERT INTO users (id, name, email, company, employee_count, industry, password, role, google_id, reset_token, reset_token_expiry, created_at, updated_at) VALUES 
(1, 'Bican Marian Valeriu', 'bican.valeriu@myzone.ai', 'MyZone AI Ltd', '10-49', '541511', '$2b$10$Lka2IM6dlLY5PP92GMm9tevRMMcEIgXexudzGvPSl/SG2skFtElF6', 'admin', NULL, NULL, NULL, '2025-07-22 07:44:02.596682', '2025-07-22 08:00:07.26479');

-- Insert teams data from development
INSERT INTO teams (id, name, created_at, updated_at) VALUES 
(1, 'MyZone', '2025-07-22 07:47:32.187522', '2025-07-22 07:47:32.187522'),
(2, 'Client', '2025-07-22 07:47:32.187522', '2025-07-22 07:47:32.187522'),
(3, 'Keeran', '2025-07-29 12:50:53.354019', '2025-07-29 12:50:53.354019');

-- Insert user team assignments from development
INSERT INTO user_teams (id, user_id, team_id, role, created_at, updated_at) VALUES 
(1, 1, 1, 'admin', '2025-07-22 07:47:33.020322', '2025-07-22 08:00:08.473562'),
(2, 1, 3, 'admin', '2025-07-29 12:50:53.431705', '2025-07-29 12:50:53.431705');

-- Fix sequences to match the highest IDs
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
SELECT setval('user_teams_id_seq', (SELECT MAX(id) FROM user_teams));

-- Verify the migration
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Teams' as table_name, COUNT(*) as count FROM teams  
UNION ALL
SELECT 'User Teams' as table_name, COUNT(*) as count FROM user_teams;