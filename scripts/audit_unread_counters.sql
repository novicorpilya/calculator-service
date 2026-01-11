-- ============================================================
-- AUDIT SCRIPT: VERIFY UNREAD COUNTERS
-- Emulates frontend logic (ChatRepository.getUnreadCounts) 
-- to produce a "Server-Side Truth" report.
-- ============================================================

WITH 
-- 1. Direct Messages Unread Count (Legacy 'is_read')
direct_unread AS (
    SELECT 
        receiver_id,
        COUNT(*) as count
    FROM messages
    WHERE 
        calculation_id IS NULL 
        AND is_read = false
        AND sender_id IS NOT NULL
    GROUP BY receiver_id
),

-- 2. Project Messages Unread Count (Marker Logic)
project_unread_raw AS (
    SELECT 
        m.receiver_id as direct_receiver, 
        calc.user_id as client_id,
        calc.manager_id as manager_id,
        m.calculation_id,
        m.created_at as msg_time,
        m.sender_id
    FROM messages m
    JOIN calculations calc ON m.calculation_id = calc.id
    WHERE m.calculation_id IS NOT NULL
),
read_markers AS (
    SELECT user_id, calculation_id, last_read_at
    FROM chat_read_markers
),
project_counts AS (
    SELECT 
        u.id as user_id,
        COUNT(p.calculation_id) as count
    FROM auth.users u
    LEFT JOIN project_unread_raw p ON 
        (u.id = p.direct_receiver OR u.id = p.client_id OR u.id = p.manager_id)
        AND p.sender_id != u.id -- Don't count own messages
    LEFT JOIN read_markers rm ON rm.user_id = u.id AND rm.calculation_id = p.calculation_id
    WHERE p.msg_time > COALESCE(rm.last_read_at, '1970-01-01'::timestamptz)
    GROUP BY u.id
)

-- 3. Final Aggregated Report
SELECT 
    u.email,
    u.id,
    COALESCE(d.count, 0) as direct_unread,
    COALESCE(p.count, 0) as project_unread,
    (COALESCE(d.count, 0) + COALESCE(p.count, 0)) as total_expected_badge
FROM auth.users u
LEFT JOIN direct_unread d ON d.receiver_id = u.id
LEFT JOIN project_counts p ON p.user_id = u.id
ORDER BY total_expected_badge DESC;
