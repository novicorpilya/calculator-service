# Chat Isolation Verification Plan

## 1. SQL Level Verification

- Run the migration script `step1-chat-isolation-migration.sql`.
- Verify constraint:
  - Try inserting a message with both `receiver_id` and `calculation_id` ->
    Expected: Fails.
  - Try inserting a message with neither -> Expected: Fails.
  - Insert one of each -> Expected: Success.

## 2. Security (RLS) Verification

- Login as User A.
- Try to fetch messages for `calculation_id` where User A is not a participant
  -> Expected: Empty array (RLS blocked).
- Try to fetch Direct messages where User A is neither sender nor receiver ->
  Expected: Empty array.

## 3. UI/Logic Isolation

- **Direct Chat**:
  - Open "Messages" with a contact.
  - Send message -> Verify it has `calculation_id: null` in DB.
  - Verify unread count increases for the receiver in the sidebar.
  - Mark as read -> Verify `is_read` becomes `true` in `messages` table.
- **Project Chat**:
  - Open Project -> Debate tab.
  - Send message -> Verify it has `receiver_id: null` in DB.
  - Verify unread count increases for the counterpart in the project card.
  - Mark as read -> Verify a new entry (or updated) appears in
    `chat_read_markers`.

## 4. Unread Counts Consistency

- Ensure Direct unreads DON'T affect Project unreads, and vice versa.
- Check that "Mark all as read" (if exists) follows the domain boundaries.
