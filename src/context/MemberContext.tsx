'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TSID } from '@/lib/mock-data';
import { useMembersList, useTicketsList } from '@/lib/api';
import { useAuth } from '@/features/auth';

// --- Types ---

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
    instructorName: string;
    date: Date;
    content: string;
    tags: string[]; // ["#renewal", "#pain"]
}

interface MemberContextType {
    members: Member[];
    tickets: Ticket[];
    logs: ConsultationLog[];
    isLoading?: boolean;

    // Actions
    registerMember: (data: Omit<Member, 'id' | 'status' | 'registeredAt'>) => void;
    updateMember: (id: TSID, data: Partial<Member>) => void;

    // Ticket Actions
    addTicket: (ticket: Omit<Ticket, 'id'>) => Ticket;
    updateTicket: (id: TSID, data: Partial<Ticket>) => void;
    pauseTicket: (id: TSID, paused: boolean) => void;

    // Log Actions
    addLog: (log: Omit<ConsultationLog, 'id' | 'date'>) => void;
}

// --- Mock Data Generators (Exported for API simulation) ---

export const getMockMembers = (): Member[] => Array.from({ length: 50 }).map((_, i) => ({
    id: `MEM_${i + 1}`,
    name: `User ${i + 1}`,
    phone: `010-${1000 + i}-${5000 + i}`,
    gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
    status: i < 5 ? 'DORMANT' : i > 40 ? 'EXPIRED' : 'ACTIVE',
    registeredAt: new Date(2025, 0, 1),
    lastAttendanceAt: i % 3 === 0 ? new Date(2026, 0, 18) : undefined,
    pinnedNote: i === 0 ? 'Herniated Disc L4-L5' : undefined,
}));

export const getMockTickets = (): Ticket[] => {
    const members = getMockMembers();
    return members.map((m, i) => ({
        id: `TICKET_${i}`,
        memberId: m.id,
        name: i % 2 === 0 ? 'Private Pilates 10' : 'Group Pilates 30',
        totalCount: i % 2 === 0 ? 10 : 30,
        remainingCount: i % 2 === 0 ? 8 : 25, // Some used
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2026, 0, 1),
        status: 'ACTIVE',
    }));
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth(); // Get user from AuthContext

    // Only fetch members/tickets if user is authenticated and has appropriate role
    const shouldFetchData = user && (user.role === 'OWNER' || user.role === 'INSTRUCTOR');

    // Use React Query for data fetching - conditionally enabled
    const { data: memberDtos = [], isLoading: isMembersLoading } = useMembersList({
        enabled: !!shouldFetchData
    });
    const { data: tickets = [], isLoading: isTicketsLoading } = useTicketsList({
        enabled: !!shouldFetchData
    });

    // Map DTOs to UI Member type
    const members = memberDtos.map(dto => ({
        id: String(dto.id),
        name: dto.name,
        phone: dto.phone,
        gender: dto.gender || 'FEMALE',
        birthDate: dto.birthDate,
        status: dto.status === 'PENDING_APPROVAL' ? 'PENDING' : (dto.status as any),
        registeredAt: new Date(dto.createdAt),
        lastAttendanceAt: dto.lastAttendanceAt ? new Date(dto.lastAttendanceAt) : undefined,
        pinnedNote: dto.pinnedNote || undefined,
    } as Member));

    // Logs still local for now as no API hook created yet
    const [logs, setLogs] = useState<ConsultationLog[]>([]);

    const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Actions - These would be Mutations in a real app
    // For now we just log them as we can't easily mutate the query cache 
    // without full mutation implementation or local state overlay.
    // Given the task scope, we assume "read" caching is the priority.

    const registerMember = (data: Omit<Member, 'id' | 'status' | 'registeredAt'>) => {
        console.log("Mock Register:", data);
        // queryClient.invalidateQueries({ queryKey: memberKeys.all })
    };

    const updateMember = (id: TSID, data: Partial<Member>) => {
        console.log("Mock Update Member:", id, data);
    };

    const addTicket = (ticket: Omit<Ticket, 'id'>) => {
        console.log("Mock Add Ticket:", ticket);
        return { ...ticket, id: 'temp-id' } as Ticket;
    };

    const updateTicket = (id: TSID, data: Partial<Ticket>) => {
        console.log("Mock Update Ticket:", id, data);
    };

    const pauseTicket = (id: TSID, paused: boolean) => {
        console.log("Mock Pause Ticket:", id, paused);
    };

    const addLog = (log: Omit<ConsultationLog, 'id' | 'date'>) => {
        const newLog = { ...log, id: generateId('LOG'), date: new Date() };
        setLogs(prev => [newLog, ...prev]);
    };

    const value = {
        members, tickets, logs,
        isLoading: isMembersLoading || isTicketsLoading,
        registerMember, updateMember,
        addTicket, updateTicket, pauseTicket,
        addLog
    };

    return (
        <MemberContext.Provider value={value}>
            {children}
        </MemberContext.Provider>
    );
}

export function useMembers() {
    const context = useContext(MemberContext);
    if (!context) throw new Error('useMembers must be used within MemberProvider');
    return context;
}
