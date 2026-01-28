import { ClassSession, Reservation, Room, TSID, InstructorColor } from './types';

// Helper to generate TSID-like string - DETERMINISTIC for Hydration Safety
let idCounter = 1000;
const generateTSID = () => `TSID_${idCounter++}`;

export const MOCK_OWNER = {
    id: 'TSID_OWNER_01',
    name: '맹성철 원장',
    role: 'OWNER',
    avatarUrl: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png',
    email: 'owner@coretime.com',
};

export const MOCK_INSTRUCTOR = {
    id: 'TSID_INSTRUCTOR_01',
    name: '김필라 강사',
    role: 'INSTRUCTOR',
    avatarUrl: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png',
    email: 'jane@coretime.com',
};

export const getRooms = (): Room[] => [
    { id: 'ROOM_A', name: 'Private Room A', capacity: 1 },
    { id: 'ROOM_B', name: 'Group Room B', capacity: 8 },
    { id: 'ROOM_C', name: 'Group Room C', capacity: 6 },
];

export const getInstructorsWithColors = (): (typeof MOCK_OWNER & { color: string })[] => [
    { ...MOCK_OWNER, color: 'indigo' }, // Owner usually manages too
    { ...MOCK_INSTRUCTOR, color: 'grape' },
    { id: 'TSID_INST_02', name: '이수민 강사', role: 'INSTRUCTOR', status: 'ACTIVE', color: 'teal', avatarUrl: '', email: 'sumin@test.com' } as any,
    { id: 'TSID_INST_03', name: '박지수 강사', role: 'INSTRUCTOR', status: 'ACTIVE', color: 'orange', avatarUrl: '', email: 'jisu@test.com' } as any,
];

export const getWeeklySchedule = (baseDate: Date): ClassSession[] => {
    // Generate a static schedule relative to the base date
    const schedule: ClassSession[] = [];
    const instructors = getInstructorsWithColors();
    const rooms = getRooms();

    // Helper to add hours to base
    const addHours = (d: Date, h: number) => {
        const newD = new Date(d);
        newD.setHours(h, 0, 0, 0);
        return newD;
    }

    // We'll generate dynamic dates based on input baseDate (Start of Week)
    const d1 = new Date(baseDate);
    // Mon 09:00
    schedule.push({
        id: 'CLASS_01', title: 'Morning Flow', instructorId: instructors[1].id, instructorName: instructors[1].name,
        roomId: rooms[1].id, roomName: rooms[1].name,
        startTime: addHours(d1, 9), endTime: addHours(d1, 10),
        maxCapacity: 8, reservedCount: 5, status: 'OPEN', color: instructors[1].color
    });

    // Mon 10:00 (Back to back)
    schedule.push({
        id: 'CLASS_02', title: 'Pilates Basic', instructorId: instructors[2].id, instructorName: instructors[2].name,
        roomId: rooms[1].id, roomName: rooms[1].name,
        startTime: addHours(d1, 10), endTime: addHours(d1, 11),
        maxCapacity: 8, reservedCount: 8, status: 'FULL', color: instructors[2].color
    });

    // Tue 18:00
    const d2 = new Date(baseDate); d2.setDate(d2.getDate() + 1);
    schedule.push({
        id: 'CLASS_03', title: 'Evening Stretch', instructorId: instructors[1].id, instructorName: instructors[1].name,
        roomId: rooms[2].id, roomName: rooms[2].name,
        startTime: addHours(d2, 18), endTime: addHours(d2, 19),
        maxCapacity: 6, reservedCount: 2, status: 'OPEN', color: instructors[1].color
    });

    // Wed 07:00 (Early Bird)
    const d3 = new Date(baseDate); d3.setDate(d3.getDate() + 2);
    schedule.push({
        id: 'CLASS_04', title: 'Early Bird', instructorId: instructors[3].id, instructorName: instructors[3].name,
        roomId: rooms[0].id, roomName: rooms[0].name,
        startTime: addHours(d3, 7), endTime: addHours(d3, 8),
        maxCapacity: 1, reservedCount: 0, status: 'OPEN', color: instructors[3].color
    });

    return schedule;
};

export const getReservations = (): Reservation[] => {
    return [
        {
            id: 'RES_01', classId: 'CLASS_01', userId: 'USER_01', userName: '김철수',
            classTitle: 'Morning Flow', instructorName: '김필라 강사', date: new Date('2026-01-19T09:00:00'),
            status: 'RESERVED', attendanceStatus: 'NONE', createdAt: new Date('2026-01-15T10:00:00')
        },
        {
            id: 'RES_02', classId: 'CLASS_02', userId: 'USER_02', userName: '이영희',
            classTitle: 'Pilates Basic', instructorName: '이수민 강사', date: new Date('2026-01-19T10:00:00'),
            status: 'WAITING', attendanceStatus: 'NONE', createdAt: new Date('2026-01-18T09:00:00')
        },
        {
            id: 'RES_03', classId: 'CLASS_01', userId: 'USER_03', userName: '박민수',
            classTitle: 'Morning Flow', instructorName: '김필라 강사', date: new Date('2026-01-19T09:00:00'),
            status: 'CANCELED', attendanceStatus: 'NONE', createdAt: new Date('2026-01-16T14:20:00')
        },
        {
            id: 'RES_04', classId: 'CLASS_03', userId: 'USER_01', userName: '김철수',
            classTitle: 'Evening Stretch', instructorName: '김필라 강사', date: new Date('2026-01-20T18:00:00'),
            status: 'RESERVED', attendanceStatus: 'NONE', createdAt: new Date('2026-01-19T09:00:00')
        },
        // More random data
        {
            id: 'RES_05', classId: 'CLASS_02', userId: 'USER_05', userName: '정수정',
            classTitle: 'Pilates Basic', instructorName: '이수민 강사', date: new Date('2026-01-19T10:00:00'),
            status: 'RESERVED', attendanceStatus: 'NONE', createdAt: new Date('2026-01-18T10:00:00')
        },
    ];
};

// Exports for usage in pages (legacy support)
export const CLASSES = getWeeklySchedule(new Date());
export const RESERVATIONS = getReservations();
