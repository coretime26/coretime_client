'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TSID } from '@/lib/mock-data';

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

// --- Initial Mock Data ---

const MOCK_MEMBERS: Member[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `MEM_${i + 1}`,
    name: `User ${i + 1}`,
    phone: `010-${1000 + i}-${5000 + i}`,
    gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
    status: i < 5 ? 'DORMANT' : i > 40 ? 'EXPIRED' : 'ACTIVE',
    registeredAt: new Date(2025, 0, 1),
    lastAttendanceAt: i % 3 === 0 ? new Date(2026, 0, 18) : undefined,
    pinnedNote: i === 0 ? 'Herniated Disc L4-L5' : undefined,
}));

const MOCK_TICKETS: Ticket[] = MOCK_MEMBERS.map((m, i) => ({
    id: `TICKET_${i}`,
    memberId: m.id,
    name: i % 2 === 0 ? 'Private Pilates 10' : 'Group Pilates 30',
    totalCount: i % 2 === 0 ? 10 : 30,
    remainingCount: i % 2 === 0 ? 8 : 25, // Some used
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2026, 0, 1),
    status: 'ACTIVE',
}));

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
    const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [logs, setLogs] = useState<ConsultationLog[]>([]);

    const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const registerMember = (data: Omit<Member, 'id' | 'status' | 'registeredAt'>) => {
        const newMember: Member = {
            ...data,
            id: generateId('MEM'),
            status: 'ACTIVE',
            registeredAt: new Date(),
        };
        setMembers(prev => [newMember, ...prev]);
    };

    const updateMember = (id: TSID, data: Partial<Member>) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    };

    const addTicket = (ticket: Omit<Ticket, 'id'>) => {
        const newTicket = { ...ticket, id: generateId('TICKET') };
        setTickets(prev => [...prev, newTicket]);
        return newTicket;
    };

    const updateTicket = (id: TSID, data: Partial<Ticket>) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    };

    const pauseTicket = (id: TSID, paused: boolean) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: paused ? 'PAUSED' : 'ACTIVE' } : t));
    };

    const addLog = (log: Omit<ConsultationLog, 'id' | 'date'>) => {
        const newLog = { ...log, id: generateId('LOG'), date: new Date() };
        setLogs(prev => [newLog, ...prev]);
    };

    const value = {
        members, tickets, logs,
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
