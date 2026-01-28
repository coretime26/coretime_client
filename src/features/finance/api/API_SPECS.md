# Finance Statistics API Specifications

This document outlines the API endpoints and response structures for the Finance Statistics Dashboard (`/finance/stats`).
It is designed to aggregate data from the **Payment & Unpaid (Receivables)** domain.

## Overview
The statistics API summarizes transaction data to provide insights into financial performance, including Total Revenue, Net Revenue, Refunds, and **Unpaid Amounts (Receivables)**.

## Base URL
`/api/v1/finance`

---

## 1. Get Revenue Summary
Retrieves key financial metrics for a specific period.
**Logic**: Aggregates `Payment` records where `paidAt` is within range.

- **Endpoint:** `GET /stats/summary`
- **Query Parameters:**
  - `startDate`: `YYYY-MM-DD` (Required)
  - `endDate`: `YYYY-MM-DD` (Required)
  - `period`: `daily` | `monthly` (Optional, default: `daily`)

- **Response Schema:**
```json
{
  "success": true,
  "data": {
    "totalSales": 15000000,       // [Gross Revenue] Sum of 'amount' for status='PAID'
    "refundAmount": 500000,       // [Refunds] Sum of 'amount' for status='REFUNDED'
    "netSales": 14500000,         // [Net Revenue] totalSales - refundAmount
    "unpaidAmount": 2500000,      // [Receivables] Total outstanding/unpaid amounts for the period
    "growthRate": 12.5,           // [Growth] (CurrentNet - PrevNet) / PrevNet * 100
    "topPaymentMethod": {         // Most frequent or highest volume method
      "method": "CARD",           // 'CARD' | 'CASH' | 'TRANSFER'
      "percentage": 65.0,
      "amount": 9750000
    }
  }
}
```

---

## 2. Get Revenue Trend (Area Chart)
Returns time-series data for visualizing revenue and refund trends.

- **Endpoint:** `GET /stats/trend`
- **Query Parameters:**
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`

- **Response Schema:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "revenue": 1200000,   // Daily Gross Revenue
      "refund": 0,          // Daily Refund Amount
      "unpaid": 50000       // Daily Unpaid Amount (Optional, if tracking receivables by date)
    },
    {
      "date": "2024-01-02",
      "revenue": 3500000,
      "refund": 100000,
      "unpaid": 0
    }
    // ... sorted by date ascending
  ]
}
```

---

## 3. Get Payment Method Breakdown (Donut Chart)
Aggregates payments by method (`CARD`, `TRANSFER`, `CASH`).

- **Endpoint:** `GET /stats/payment-methods`
- **Query Parameters:**
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`

- **Response Schema:**
```json
{
  "success": true,
  "data": [
    {
      "method": "CARD",
      "label": "신용카드",
      "amount": 9750000,
      "percentage": 65.0,
      "color": "indigo.6"
    },
    {
      "method": "TRANSFER",
      "label": "계좌이체",
      "amount": 4500000,
      "percentage": 30.0,
      "color": "teal.6"
    },
    {
      "method": "CASH",
      "label": "현금",
      "amount": 750000,
      "percentage": 5.0,
      "color": "gray.6"
    }
  ]
}
```

---

## 4. Get Detailed Transaction Log (Table)
Retrieves a paginated list of payment transactions, corresponding to the "Detailed Transaction Log" UI.
**Source**: Matches the data model of the Payment Page table.

- **Endpoint:** `GET /stats/transactions`
- **Query Parameters:**
  - `page`: `number` (Default: 1)
  - `limit`: `number` (Default: 20)
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`
  - `search`: `string` (Member Name or Product Name)

- **Response Schema:**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "PAY_17064212@1",       // Payment ID
        "paidAt": "2024-01-27T10:00:00Z", // Transaction Date
        "productName": "1:1 Pilates 30 Sessions",
        "memberName": "Kim Cheol-su",
        "method": "CARD",             // 'CARD' | 'TRANSFER' | 'CASH'
        "amount": 1500000,
        "status": "PAID"              // 'PAID' | 'REFUNDED' | 'CANCELLED'
        // 'type' field removed as 'status' covers Paid/Refund state.
        // For partial refunds, separate transaction records or 'refundAmount' field may be added.
      }
    ],
    "pagination": {
      "total": 52,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```
