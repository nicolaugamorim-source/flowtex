-- Adiciona campos de verificação e role ao profiles
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'premium'));
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN email_verified_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'active', 'cancelled'));
ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Tabela para rastrear tentativas de fraude
CREATE TABLE IF NOT EXISTS fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para rastrear verificações de email
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_email ON fraud_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);

-- RLS Policy para fraud_logs
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view fraud logs" ON fraud_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy para email_verifications
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their email verifications" ON email_verifications
  FOR SELECT USING (user_id = auth.uid());
