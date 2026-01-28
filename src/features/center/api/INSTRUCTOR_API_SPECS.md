# Instructor Management API Specifications

This document outlines the API endpoints for managing instructors within a center, specifically focusing on **Direct Registration** and **Approval** workflows.

## 1. Direct Instructor Registration
Allows an administrator (Owner) to register an instructor directly without an invite code.
**Pattern**: Derived from `POST /memberships/register` (Member Registration).

- **Endpoint:** `POST /management/instructors/register`
- **Request Body (JSON):**
```json
{
  "name": "Kim Kang-sa",       // Primary Name (Required)
  "phone": "010-1234-5678",   // Phone Number (Required, format: 010-0000-0000)
  "email": "kim@example.com",  // Email Address (Optional, used for account/login)
  "gender": "MALE",            // MALE | FEMALE (Required)
  "birthDate": "1990-01-01",   // YYYY-MM-DD (Optional)
  "memo": "Morning PT Specialist" // Admin Memo (Optional)
}
```
- **Behavior**:
  - Creates a new `Account` and `Membership` with role `INSTRUCTOR`.
  - Status is set to `ACTIVE` immediately (bypassing `PENDING_APPROVAL`).
  - If the account already exists, links the existing account to a new membership if permitted.

---

## 2. Get Pending Instructors
Lists all instructors who have requested to join via invite code and are awaiting approval.

- **Endpoint:** `GET /management/pending-instructors`
- **Response Schema:**
```json
{
  "success": true,
  "data": [
    {
      "membershipId": "MEM_123",
      "name": "Requested Instructor",
      "phone": "010-9999-8888",
      "status": "PENDING_APPROVAL",
      "requestedAt": "2024-01-27T10:00:00Z"
    }
  ]
}
```

---

## 3. Approve/Reject Instructor Request
Updates the status of a pending membership request.

- **Endpoint:** `PATCH /management/memberships/{membershipId}/status`
- **Query Parameters:**
  - `isApproved`: `boolean`
- **Logic**:
  - `true` -> Status becomes `ACTIVE`.
  - `false` -> Status becomes `REJECTED` (or deleted).

---

## 4. Update Instructor Status (Lifecycle)
Manages the active state of an instructor (e.g., suspension or resignation).

- **Endpoint:** `PATCH /management/instructors/{membershipId}/management`
- **Request Body:**
```json
{
  "status": "INACTIVE" // 'ACTIVE' | 'INACTIVE' | 'WITHDRAWN'
}
```
