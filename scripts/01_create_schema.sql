-- Reset everything for a clean state
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS telegram_accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create telegram_accounts table
CREATE TABLE telegram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  phone_number TEXT,
  api_id TEXT,
  api_hash TEXT,
  status TEXT DEFAULT 'connected',
  last_activity TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES telegram_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  target_groups TEXT[] DEFAULT '{}',
  message_template TEXT,
  total_targets INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  anti_ban_delay INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_id_telegram BIGINT,
  first_name TEXT,
  last_name TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending'
);

-- Create logs table
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create RLS policies for telegram_accounts
CREATE POLICY "Users can view their telegram accounts" 
  ON telegram_accounts FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their telegram accounts" 
  ON telegram_accounts FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their telegram accounts" 
  ON telegram_accounts FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their telegram accounts" 
  ON telegram_accounts FOR DELETE 
  USING (user_id = auth.uid());

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their campaigns" 
  ON campaigns FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert campaigns" 
  ON campaigns FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their campaigns" 
  ON campaigns FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their campaigns" 
  ON campaigns FOR DELETE 
  USING (user_id = auth.uid());

-- Create RLS policies for members
CREATE POLICY "Users can view their members" 
  ON members FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert members" 
  ON members FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for logs
CREATE POLICY "Users can view their logs" 
  ON logs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert logs" 
  ON logs FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_telegram_accounts_user_id ON telegram_accounts(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_account_id ON campaigns(account_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_campaign_id ON members(campaign_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_campaign_id ON logs(campaign_id);
