-- Insert demo user directly
INSERT INTO "user" (id, email, name, "emailVerified", image, "createdAt")
VALUES (
  'demo-user-001',
  'demo@futbol.uz',
  'Demo Player',
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoPlayer',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert demo account for password
INSERT INTO "account" (id, "userId", type, provider, "providerAccountId", password, "createdAt")
VALUES (
  'demo-account-001',
  'demo-user-001',
  'email',
  'email',
  'demo@futbol.uz',
  -- Password hash for "Demo123456!" using bcrypt
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36MB6DlO',
  NOW()
) ON CONFLICT DO NOTHING;

SELECT * FROM "user" WHERE email = 'demo@futbol.uz';
