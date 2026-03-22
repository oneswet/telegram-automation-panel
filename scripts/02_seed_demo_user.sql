-- Enable pgcrypto extension for crypt and gen_salt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth user or update password if already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'bogos300@gmail.com') THEN
        -- Update the existing user's password and ensure they are confirmed
        UPDATE auth.users 
        SET encrypted_password = crypt('lonake300@@', gen_salt('bf')),
            email_confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = 'bogos300@gmail.com';
    ELSE
        -- Insert a new demo user if not exists
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
        VALUES (
          '550e8400-e29b-41d4-a716-446655440000',
          'bogos300@gmail.com',
          crypt('lonake300@@', gen_salt('bf')),
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          '{"provider":"email","providers":["email"]}',
          '{}',
          false,
          'authenticated'
        );
    END IF;
END $$;

-- Insert demo profile data
INSERT INTO profiles (id, email, display_name)
SELECT id, email, 'Demo Admin'
FROM auth.users
WHERE email = 'bogos300@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Insert sample telegram accounts
INSERT INTO telegram_accounts (user_id, account_name, phone_number, status)
SELECT id, 'Main Account', '+1234567890', 'connected'
FROM auth.users
WHERE email = 'bogos300@gmail.com'
UNION ALL
SELECT id, 'Secondary Account', '+1987654321', 'connected'
FROM auth.users
WHERE email = 'bogos300@gmail.com'
ON CONFLICT DO NOTHING;

-- Insert sample campaigns
INSERT INTO campaigns (user_id, account_id, name, description, status, total_targets, sent_count, anti_ban_delay)
SELECT 
    u.id, 
    ta.id,
    'Marketing Campaign Q1', 'Quarterly marketing outreach', 'active', 1250, 847, 100
FROM auth.users u
JOIN telegram_accounts ta ON ta.user_id = u.id
WHERE u.email = 'bogos300@gmail.com' AND ta.account_name = 'Main Account'
ON CONFLICT DO NOTHING;

INSERT INTO campaigns (user_id, account_id, name, description, status, total_targets, sent_count, anti_ban_delay)
SELECT 
    u.id, 
    ta.id,
    'Premium User Announcement', 'Announce new premium features', 'completed', 500, 500, 150
FROM auth.users u
JOIN telegram_accounts ta ON ta.user_id = u.id
WHERE u.email = 'bogos300@gmail.com' AND ta.account_name = 'Main Account'
ON CONFLICT DO NOTHING;

-- Insert sample logs
INSERT INTO logs (user_id, campaign_id, action, message, status)
SELECT 
    u.id, 
    c.id,
    'campaign_started', 'Campaign started successfully', 'info'
FROM auth.users u
JOIN campaigns c ON c.user_id = u.id
WHERE u.email = 'bogos300@gmail.com' AND c.name = 'Marketing Campaign Q1'
ON CONFLICT DO NOTHING;

INSERT INTO logs (user_id, campaign_id, action, message, status)
SELECT 
    u.id, 
    c.id,
    'batch_sent', 'Sent 100 messages', 'info'
FROM auth.users u
JOIN campaigns c ON c.user_id = u.id
WHERE u.email = 'bogos300@gmail.com' AND c.name = 'Marketing Campaign Q1'
ON CONFLICT DO NOTHING;

INSERT INTO logs (user_id, campaign_id, action, message, status)
SELECT 
    u.id, 
    c.id,
    'rate_limit_warning', 'Approaching rate limit, increasing delay', 'warning'
FROM auth.users u
JOIN campaigns c ON c.user_id = u.id
WHERE u.email = 'bogos300@gmail.com' AND c.name = 'Marketing Campaign Q1'
ON CONFLICT DO NOTHING;
