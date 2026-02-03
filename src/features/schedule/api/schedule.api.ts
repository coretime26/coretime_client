import { scheduleApi as apiSchedule, reservationApi as apiReservation, roomApi as apiRoom, ScheduleResult, ReservationResult, authApi } from '@/lib/api';

import { ClassSession, Reservation, Room } from '../model/types';
import dayjs from 'dayjs';

// Color map cache
const COLORS = ['indigo', 'cyan', 'teal', 'grape', 'violet', 'pink', 'orange', 'lime'];
const instructorColors: Record<string, string> = {};

const getColor = (id: string, index?: number) => {
    if (instructorColors[id]) return instructorColors[id];
    const color = COLORS[(index ?? 0) % COLORS.length];
    instructorColors[id] = color;
    return color;
};

export const scheduleApi = {
    getWeeklySchedule: async (date: Date): Promise<ClassSession[]> => {
        const start = dayjs(date).startOf('week').toISOString();
        const end = dayjs(date).endOf('week').toISOString();
        const data = await apiSchedule.getList(start, end);

        // Map API Result to Internal Type
        return data.map((item, idx) => ({
            id: item.id,
            title: item.title,
            instructorId: item.instructorMembershipId,
            instructorName: item.instructorName,
            roomId: item.roomId,
            roomName: item.roomName,
            startTime: new Date(item.startDateTime),
            endTime: new Date(item.endDateTime),
            maxCapacity: item.maxCapacity,
            reservedCount: item.currentReservedCount,
            status: item.status as any,
            color: getColor(item.instructorMembershipId, idx)
        }));
    },

    getReservations: async (): Promise<Reservation[]> => {
        // [TODO] Use proper filter or getAll endpoint if available
        // For now, assume this page wants "ALL" which we mapped to apiReservation.getAll (Note: Assumed endpoint)
        const data = await apiReservation.getAll();

        return data.map(r => ({
            id: r.id,
            classId: r.classSessionId,
            userId: r.membershipId,
            userName: r.memberName,
            classTitle: r.classTitle,
            instructorName: r.instructorName,
            date: new Date(r.startDateTime),
            status: r.status,
            attendanceStatus: r.attendanceStatus,
            channel: (r.channel as any) || 'APP',
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
        }));
    },

    getRooms: async (): Promise<Room[]> => {
        const data = await apiRoom.getAll();
        return data.map(r => ({
            id: r.id,
            name: r.name,
            capacity: r.capacity
        }));
    },

    getInstructors: async () => {
        const instructors = await authApi.getActiveInstructors();
        return instructors.map((inst, idx) => ({
            instructorId: inst.membershipId,
            name: inst.name,
            avatarUrl: inst.profileImageUrl,
            color: getColor(inst.membershipId, idx)
        }));
    }

    // Additional methods for Attendance
};
