# DM Chat Database Setup

Run these SQL files in Supabase SQL Editor in order:

1. migrations/001_create_user_profiles.sql
2. migrations/002_create_dm_conversations.sql
3. migrations/003_create_dm_messages.sql
4. migrations/004_create_dm_read_receipts.sql
5. migrations/010_enable_rls_and_helpers.sql
6. migrations/011_policies_user_profiles.sql
7. migrations/012_policies_dm_conversations.sql
8. migrations/013_policies_dm_messages.sql
9. migrations/014_policies_dm_read_receipts.sql
10. migrations/020_enable_realtime_publication.sql
11. migrations/030_create_user_follows.sql

## Notes

- This schema is for direct-message chat only (no group rooms yet).
- `participant_one < participant_two` is used to enforce one unique conversation per user pair.
- `client_message_id` helps prevent duplicate message inserts on reconnect/retry.
- Realtime publication is enabled for conversation and message tables.

## Quick policy check

- Authenticated user can only read conversations where they are a participant.
- Authenticated user can only send messages where sender is themselves and recipient belongs to same conversation.
- Guest/unauthenticated user has no chat access under these policies.
