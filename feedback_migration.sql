-- Feedback System Migration
-- Maak feedback tabel aan voor gebruikersfeedback

-- Drop existing policies first (in case of re-run)
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can manage all feedback" ON feedback;

-- Drop table if exists (voor clean slate)
DROP TABLE IF EXISTS feedback;

-- Feedback tabel
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT,
    type TEXT NOT NULL CHECK (type IN ('suggestion', 'bug', 'feature', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies voor feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Simpele policy: alle ingelogde gebruikers kunnen feedback toevoegen
CREATE POLICY "Authenticated users can insert feedback" ON feedback
    FOR INSERT TO authenticated WITH CHECK (true);

-- Gebruikers kunnen hun eigen feedback zien
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);

-- Admin policy - ALLEEN voor jouw email
CREATE POLICY "Admin can manage all feedback" ON feedback
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'email' = 'piedie@piedie.net'
    );

-- Index voor performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Trigger voor updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Commentaar
COMMENT ON TABLE feedback IS 'Gebruikersfeedback en suggesties';
COMMENT ON COLUMN feedback.type IS 'Type feedback: suggestion, bug, feature, other';
COMMENT ON COLUMN feedback.status IS 'Status: open, in_progress, resolved, closed';
