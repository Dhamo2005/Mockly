# Security Spec

## Data Invariants
1. A User's preferences (`users/{userId}`) can only be read/written by the owner.
2. An active session (`users/{userId}/activeSessions/{testId}`) must have `userId` matching `request.auth.uid`.
3. An attempt (`users/{userId}/attempts/{attemptId}`) must have `userId` matching `request.auth.uid`.
4. Tests (`tests/{testId}`) can be read by anyone authenticated, but only modified by their owner (`ownerId == request.auth.uid`).

## The "Dirty Dozen" Payloads
1. Create user data as unauthenticated (Denied)
2. Create user data for another userId (Denied)
3. Modify another user's preferences (Denied)
4. Read another user's attempts (Denied)
5. Create attempt for another user (Denied)
6. Update attempt with wrong type for score (e.g. score is string) (Denied)
7. Create attempt without testId (Denied)
8. Create test with `ownerId` of another user (Denied)
9. Update a test they don't own (Denied)
10. Delete another user's test (Denied)
11. Add a ghost field `isAdmin: true` to user data (Denied)
12. Create test with an id size > 128 (Denied)
