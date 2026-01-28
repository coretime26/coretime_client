# 강사 관리 API 명세서 (Instructor Management API)
이 문서는 센터 내 강사 관리를 위한 API 명세입니다. 센터장(OWNER) 또는 시스템 관리자(SYSTEM_ADMIN) 권한이 필요합니다.

**Base Path**: `/api/v1/management`  
**권한**: `OWNER`, `SYSTEM_ADMIN`

---

## 1. 강사 직접 등록
초대 코드 없이 센터장이 강사를 직접 등록합니다. 가입 승인 절차 없이 즉시 활성화됩니다.

- **Endpoint**: `POST /instructors/register`
- **Request Body**:
```json
{
  "name": "김강사",           // 필수
  "phone": "010-1234-5678",   // 필수 (010-0000-0000 형식)
  "email": "kim@example.com",  // 선택 (기존 계정 연결 또는 신규 생성)
  "gender": "MALE",            // 필수 (MALE | FEMALE)
  "birthDate": "1990-01-01",   // 선택 (YYYY-MM-DD)
  "memo": "오전 PT 전문"        // 선택 (관리자 메모)
}
```
- **Response**: `ActiveInstructorResult` (wrapped in `ApiResponse`)

---

## 2. 소속 강사 리스트 조회
현재 센터에 소속된 모든 활성화된 강사 목록을 조회합니다.

- **Endpoint**: `GET /instructors`
- **Response Data**:
```json
[
  {
    "membershipId": 123456789,
    "accountId": 987654321,
    "name": "김강사",
    "phone": "010-1234-5678",
    "identity": "INSTRUCTOR",
    "profileImageUrl": "https://...",
    "status": "ACTIVE",
    "gender": "MALE",
    "birthDate": "1990-01-01",
    "memo": "오전 PT 전문"
  }
]
```

---

## 3. 승인 대기 강사 리스트 조회
초대 코드를 통해 가입 요청을 보낸 후 승인 대기 중인 강사 목록을 조회합니다.

- **Endpoint**: `GET /pending-instructors`
- **Response Data**:
```json
[
  {
    "membershipId": 123456789,
    "accountId": 987654321,
    "name": "신청강사",
    "phone": "010-9999-8888",
    "identity": "INSTRUCTOR",
    "profileImageUrl": "https://...",
    "createdAt": "2024-01-27T10:00:00Z",
    "status": "PENDING_APPROVAL",
    "gender": "FEMALE",
    "birthDate": "1995-05-05",
    "memo": null
  }
]
```

---

## 4. 강사 가입 승인/거절
강사의 가입 요청 상태를 업데이트합니다.

- **Endpoint**: `PATCH /memberships/{membershipId}/status`
- **Query Parameters**:
  - `isApproved`: `boolean` (필수, `true`: 승인/활성화, `false`: 거절)
- **Logic**:
  - `true` -> 상태가 `ACTIVE`로 변경됨
  - `false` -> 상태가 `REJECTED`로 변경됨

---

## 5. 강사 상태 및 권한 관리 (Lifecycle)
활성화된 강사의 상태(일시 정지, 퇴사 등)를 관리합니다.

- **Endpoint**: `PATCH /instructors/{membershipId}/management`
- **Request Body**:
```json
{
  "status": "INACTIVE" // ACTIVE | INACTIVE | WITHDRAWN
}
```

---

## NOTE
모든 API 응답은 `ApiResponse<T>` 공통 포맷으로 감싸져 반환됩니다. 성공 시 `success: true`와 함께 `data` 필드에 결과값이 포함됩니다.
