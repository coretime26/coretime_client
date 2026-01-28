import { TSID } from '@/lib/mock-data';

export interface MemberDto {
    id: number | string;
    name: string;
    phone: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
    status: string;
    role: string;
    createdAt: string; // ISO Date
    lastAttendanceAt?: string; // ISO Date
    pinnedNote?: string;
}

export interface RegisterMemberCommand {
    name: string;
    phone: string;
    gender: 'MALE' | 'FEMALE';
    birthDate?: string;
    address?: string;
    memo?: string;
}

export interface MemberTicketResult {
    id: number | string;
    memberId: number | string;
    ticketName: string;
    remainingCount: number;
    totalCount: number;
    startDate: string;
    endDate: string;
    status: string;
}

export interface IssueTicketCommand {
    membershipId: string;
    ticketProductId: string;
    startDate?: string; // YYYY-MM-DD
    initialRemainingCount?: number; // Override default
}
