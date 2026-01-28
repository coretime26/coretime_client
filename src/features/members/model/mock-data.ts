import { Member, Ticket } from './types';

export const getMockMembers = (): Member[] => Array.from({ length: 50 }).map((_, i) => ({
    id: `MEM_${i + 1}`,
    name: `User ${i + 1}`,
    phone: `010-${1000 + i}-${5000 + i}`,
    gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
    status: i < 5 ? 'DORMANT' : i > 40 ? 'EXPIRED' : 'ACTIVE',
    registeredAt: new Date(2025, 0, 1),
    lastAttendanceAt: i % 3 === 0 ? new Date(2026, 0, 18) : undefined,
    pinnedNote: i === 0 ? 'Herniated Disc L4-L5' : undefined,
    tickets: i < 3 ? [
        { id: `T_${i}_1`, name: '1:1 PT 30 Sessions', remainingCount: 15 },
        i === 0 ? { id: `T_${i}_2`, name: 'Group Pilates', remainingCount: 5 } : null
    ].filter(Boolean) as any[] : [],
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
