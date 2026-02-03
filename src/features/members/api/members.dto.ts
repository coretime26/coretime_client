import { TSID } from '@/lib/mock-data';

export interface MemberDto {
    id: number | string;
    name: string;
    phone: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
    status: string;
    role: string;
    createdAt: string;
    lastAttendanceAt?: string;
    pinnedNote?: string;
    profileImageUrl?: string | null;
    tickets: MemberTicketInfo[];
}

export interface MemberTicketInfo {
    id: number | string;
    name: string;
    remainingCount: number;
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
    memberName: string;
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
