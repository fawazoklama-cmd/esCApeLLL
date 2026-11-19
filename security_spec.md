# Security Specification — esCApeLL Firestore Rules

## 1. Data Invariants
1. **Identity Ownership**: `/users/{userId}` documents and their `/private/*` and `/matches/*` subcollections may only be created or modified by `request.auth.uid == userId`.
2. **PII Isolation**: Player email addresses are stored exclusively in `/users/{userId}/private/info` and are readable only by `request.auth.uid == userId`.
3. **Immutable Ownership & Timestamps**: `uid` and `createdAt` cannot be modified after creation (`createdAt == request.time` on create, `updatedAt == request.time` on update).
4. **Validated Leaderboard Submissions**: Leaderboard entries must carry a non-empty `validationSig`, bounded non-negative scores (`0 <= score <= 10000000`), bounded distance (`0 <= distance <= 500000`), and `uid == request.auth.uid`, and cannot be updated once created.
5. **Duel Room Integrity**:
   - Only signed-in users can create a `DuelRoom`, and `hostUid == request.auth.uid`, initial `status == 'waiting'`, and `guestUid == ''`.
   - Join action is only allowed when `status == 'waiting'` and `existing().guestUid == ''`, setting `guestUid == request.auth.uid`.
   - Ready, telemetry (`hostDistance`/`hostScore`/`hostAlive` or `guest*`), status transitions (`waiting -> countdown -> racing -> finished`) are restricted strictly to participants (`hostUid` or `guestUid`).
   - Once `status == 'finished'`, terminal outcome fields (`winnerUid`, `status`) are locked against further updates.

## 2. Dirty Dozen Payloads (Must All Be Rejected with PERMISSION_DENIED)
1. Unauthenticated read/write to `/users/user_1`.
2. Shadow update adding `isAdmin: true` to `/users/{userId}`.
3. Identity spoofing creating `/users/other_uid` while signed in as `attacker_uid`.
4. Reading `/users/victim_uid/private/info` as `attacker_uid`.
5. Poisoning `username` with a 500-char string (`> 24` chars).
6. Poisoning `documentId` with invalid characters or `> 128` chars.
7. Updating `createdAt` or `uid` on an existing `/users/{userId}` document.
8. Submitting a leaderboard entry with `uid` belonging to another user or negative `score`.
9. Updating an existing `/leaderboard/{entryId}` entry to inflate score.
10. Joining a `/duelRooms/{roomId}` that already has a `guestUid` or is not in `waiting` state.
11. Modifying `hostDistance` in a duel room as the `guestUid` (or non-participant).
12. Mutating `winnerUid` or `status` on a `/duelRooms/{roomId}` whose `status` is already `'finished'`.
