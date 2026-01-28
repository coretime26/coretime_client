export type TSID = string;

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
