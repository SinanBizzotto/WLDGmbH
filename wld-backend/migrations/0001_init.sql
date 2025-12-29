CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  plan TEXT,
  message TEXT NOT NULL,
  referrer TEXT,
  created_at TEXT NOT NULL
);
