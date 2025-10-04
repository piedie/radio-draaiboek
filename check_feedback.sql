-- Check feedback tabel
SELECT 'feedback table' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'open' THEN 1 END) as open_feedback,
       COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_feedback
FROM feedback;

-- Recente feedback
SELECT created_at, user_email, type, LEFT(message, 50) || '...' as preview, status
FROM feedback 
ORDER BY created_at DESC 
LIMIT 10;
