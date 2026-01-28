import { TSID } from '@/lib/mock-data';

export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'EXPIRED' | 'PENDING';

export interface Member {
    id: TSID;
    name: string;
    phone: string; // "010-1234-5678"
    gender: 'MALE' | 'FEMALE';
    birthDate?: string;
    status: MemberStatus;
    registeredAt: Date;
    lastAttendanceAt?: Date;
    pinnedNote?: string; // High priority note
}

export interface Ticket {
    id: TSID;
    memberId: TSID;
    name: string; // "1:1 PT 10 Sessions"
    totalCount: number;
    remainingCount: number;
    startDate: Date;
    endDate: Date;
    status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
}

export interface ConsultationLog {
    id: TSID;
    memberId: TSID;
    instructorId: TSID; // Who wrote it
    instructorName: string; // Denormalized for display
    date: Date;
    content: string;
    tags: string[]; // ["#renewal", "#pain"]
}
