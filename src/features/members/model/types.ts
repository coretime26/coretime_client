import { TSID } from '@/lib/mock-data';
export type { TSID };

export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'EXPIRED' | 'PENDING' | 'INACTIVE' | 'PENDING_APPROVAL' | 'WITHDRAWN' | 'REJECTED';

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
    profileImageUrl?: string | null;
    tickets: { id: TSID; name: string; remainingCount: number }[]; // Active tickets snapshot
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

export type ConsultationCategory = 'GENERAL' | 'RE_REGISTRATION' | 'COMPLAINT' | 'PHYSICAL' | 'OTHER';

export interface ConsultationLog {
    id: TSID;
    membershipId: TSID; // Changed from memberId to align with API
    operatorAccountId: TSID;
    // instructorName: string; // Removed, will need to be resolved from operatorAccountId if needed, or kept if UI requires it and we mock/fetch it
    category: ConsultationCategory;
    content: string;
    tags: string[]; // Converted from string "#tag,#tag"
    consultedAt: Date;
    createdAt: Date;
}
