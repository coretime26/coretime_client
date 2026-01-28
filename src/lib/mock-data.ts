

// --- Types ---

export type TSID = string;
export type UserRole = 'OWNER' | 'INSTRUCTOR' | 'MEMBER' | 'SYSTEM_ADMIN';

// Shared User Interface
export interface User {
    id: TSID;
    name: string;
    role: UserRole;
    avatarUrl?: string; // For UI display
    email?: string;
    status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE';
}

// Stats for the top grid
export interface DashboardStats {
    revenue: {
        total: number;
        trend: number[]; // For sparkline
        last7Days: number[];
    };
    attendance: {
        rate: number; // 0-100
        totalClasses: number;
        attended: number;
    };
    newMembers: {
        count: number;
        diff: number; // vs yesterday
    };
    instructorClasses: {
        todayCount: number;
        upcoming: number;
    };
}

// Chart Data
export interface RevenueChartData {
    date: string;
    revenue: number;
    appointments: number;
}

// Activity Log
export interface ActivityLog {
    id: TSID;
    type: 'RESERVATION' | 'ATTENDANCE' | 'NEW_MEMBER' | 'PAYMENT' | 'SYSTEM';
    message: string;
    timestamp: Date;
    meta?: {
        userId?: TSID;
        value?: string;
    };
}

// Schedule Types
export interface InstructorColor {
    instructorId: TSID;
    color: string; // Hex or Mantine color name
}

export interface Room {
    id: TSID;
    name: string;
    capacity: number;
}

export interface ClassSession {
    id: TSID;
    title: string;
    instructorId: TSID;
    instructorName: string;
    roomId: TSID;
    roomName: string;
    startTime: Date;
    endTime: Date;
    maxCapacity: number;
    reservedCount: number;
    status: 'OPEN' | 'FULL' | 'CLOSED';
    color: string; // Derived from instructor
}

// Reservation Types
export interface Reservation {
    id: TSID;
    classId: TSID;
    userId: TSID;
    userName: string;
    classTitle: string;
    instructorName: string;
    date: Date;
    status: 'RESERVED' | 'CANCELED' | 'WAITING' | 'NOSHOW' | 'CANCELED_BY_ADMIN';
    attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | 'NONE';
    channel?: 'APP' | 'ADMIN';
    createdAt: Date;
    updatedAt?: Date;
    remainingTickets?: number; // Snapshot at time of reservation or dynamic check
}

// Center Alerts
export interface CenterAlert {
    id: TSID;
    type: 'EXPIRY' | 'PAYMENT' | 'BIRTHDAY';
    severity: 'high' | 'medium' | 'low';
    message: string;
    details?: string;
    targetUser?: User;
}

// --- Generators ---

// Helper to generate TSID-like string - DETERMINISTIC for Hydration Safety
let idCounter = 1000;
const generateTSID = () => `TSID_${idCounter++}`;

export const MOCK_OWNER: User = {
    id: 'TSID_OWNER_01',
    name: '맹성철 원장',
    role: 'OWNER',
    avatarUrl: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png',
    email: 'owner@coretime.com',
};

export const MOCK_INSTRUCTOR: User = {
    id: 'TSID_INSTRUCTOR_01',
    name: '김필라 강사',
    role: 'INSTRUCTOR',
    avatarUrl: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png',
    email: 'jane@coretime.com',
};

// Generate Stats based on role (some fields might be hidden in UI but data can exist)
export const getMockStats = (): DashboardStats => ({
    revenue: {
        total: 12500000,
        trend: [10, 20, 15, 30, 25, 40, 35],
        last7Days: [120, 150, 180, 130, 200, 250, 300],
    },
    attendance: {
        rate: 85,
        totalClasses: 120,
        attended: 102,
    },
    newMembers: {
        count: 12,
        diff: 3, // +3
    },
    instructorClasses: {
        todayCount: 4,
        upcoming: 12,
    },
});

// FIXED CHART DATA
export const getRevenueChartData = (): RevenueChartData[] => {
    return [
        { date: '1/13', revenue: 1200000, appointments: 15 },
        { date: '1/14', revenue: 900000, appointments: 12 },
        { date: '1/15', revenue: 1500000, appointments: 18 },
        { date: '1/16', revenue: 800000, appointments: 10 },
        { date: '1/17', revenue: 1100000, appointments: 14 },
        { date: '1/18', revenue: 2000000, appointments: 25 },
        { date: '1/19', revenue: 1300000, appointments: 16 },
    ];
};

// Schedule data moved to @/features/schedule/model/mock-data.ts

export const getRecentActivity = (role: UserRole): ActivityLog[] => {
    const logs: ActivityLog[] = [
        { id: 'LOG_01', type: 'PAYMENT', message: '김회원 10회 수강권 결제', timestamp: new Date('2026-01-19T11:45:00'), meta: { value: '300,000원' } },
        { id: 'LOG_02', type: 'RESERVATION', message: '이회원 필라테스 베이직 예약', timestamp: new Date('2026-01-19T10:30:00') },
        { id: 'LOG_03', type: 'ATTENDANCE', message: '최회원 모닝 플로우 출석', timestamp: new Date('2026-01-19T09:00:00') },
        { id: 'LOG_04', type: 'NEW_MEMBER', message: '신규 회원 등록: 정회원', timestamp: new Date('2026-01-19T08:15:00') },
    ];

    if (role === 'INSTRUCTOR') {
        return logs.filter(l => l.type === 'RESERVATION' || l.type === 'ATTENDANCE');
    }
    return logs;
};

export const getCenterAlerts = (): CenterAlert[] => [
    { id: 'ALERT_01', type: 'EXPIRY', severity: 'medium', message: '회원권 만료 예정 3명', details: '회원 목록 확인 필요' },
    { id: 'ALERT_02', type: 'PAYMENT', severity: 'high', message: '미납 회원 2명', details: '연락 요망' },
    { id: 'ALERT_03', type: 'BIRTHDAY', severity: 'low', message: '오늘 생일: 김회원', details: '생일 쿠폰 발송' },
];

