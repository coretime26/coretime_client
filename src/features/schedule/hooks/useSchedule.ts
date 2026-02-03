import { useQuery, UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../api/schedule.api';
import { CreateScheduleCommand, UpdateScheduleCommand, scheduleApi as rawScheduleApi, reservationApi, roomApi as rawRoomApi, CreateReservationCommand, CreateReservationByAdminCommand, CreateRoomCommand, UpdateRoomCommand } from '@/lib/api';
import { ClassSession, Reservation, Room } from '../model/types';

export const scheduleKeys = {
    all: ['schedule'] as const,
    week: (date: string) => ['schedule', 'week', date] as const,
    reservations: ['reservations'] as const,
    rooms: ['rooms'] as const,
    instructors: ['schedule', 'instructors'] as const,
};

export function useWeeklySchedule(date: Date, options?: Omit<UseQueryOptions<ClassSession[], Error>, 'queryKey' | 'queryFn'>) {
    // Round to start of week effectively in cache key
    const dateKey = date.toISOString().split('T')[0];
    return useQuery({
        queryKey: scheduleKeys.week(dateKey),
        queryFn: () => scheduleApi.getWeeklySchedule(date),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useReservations(options?: Omit<UseQueryOptions<Reservation[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: scheduleKeys.reservations,
        queryFn: scheduleApi.getReservations,
        staleTime: 1 * 60 * 1000, // Reservations change often
        ...options
    });
}

export function useRooms(options?: Omit<UseQueryOptions<Room[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: scheduleKeys.rooms,
        queryFn: scheduleApi.getRooms,
        staleTime: 60 * 60 * 1000, // Rooms rarely change
        ...options
    });
}

export function useScheduleInstructors(options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: scheduleKeys.instructors,
        queryFn: scheduleApi.getInstructors,
        staleTime: 10 * 60 * 1000,
        ...options
    });
}

export function useSessionReservations(classSessionId: string, options?: Omit<UseQueryOptions<Reservation[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['reservations', 'session', classSessionId],
        queryFn: () => reservationApi.getSessionReservations(classSessionId).then(data => data.map(r => ({
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
        }))),
        enabled: !!classSessionId,
        staleTime: 30 * 1000,
        ...options
    });
}

// --- Mutations ---

export function useScheduleMutations() {
    const queryClient = useQueryClient();

    const createClass = useMutation({
        mutationFn: (command: CreateScheduleCommand) => rawScheduleApi.create(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
        }
    });

    const updateClass = useMutation({
        mutationFn: ({ id, command }: { id: string; command: UpdateScheduleCommand }) => rawScheduleApi.update(id, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
        }
    });

    const deleteClass = useMutation({
        mutationFn: (id: string) => rawScheduleApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
        }
    });

    return { createClass, updateClass, deleteClass };
}

export function useReservationMutations() {
    const queryClient = useQueryClient();

    const createReservation = useMutation({
        mutationFn: (command: CreateReservationCommand) => reservationApi.create(command),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['reservations', 'session', variables.classSessionId] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
    });

    const createReservationByAdmin = useMutation({
        mutationFn: (command: CreateReservationByAdminCommand) => reservationApi.createByAdmin(command),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['reservations', 'session', variables.classSessionId] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
    });

    const cancelReservation = useMutation({
        mutationFn: (id: string) => reservationApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
    });

    const updateAttendance = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOSHOW' }) => reservationApi.updateAttendance(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
    });

    return { createReservation, createReservationByAdmin, cancelReservation, updateAttendance };
}

export function useRoomMutations() {
    const queryClient = useQueryClient();

    const createRoom = useMutation({
        mutationFn: (command: CreateRoomCommand) => rawRoomApi.create(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.rooms });
        }
    });

    const updateRoom = useMutation({
        mutationFn: ({ id, command }: { id: string; command: UpdateRoomCommand }) => rawRoomApi.update(id, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.rooms });
        }
    });

    const deleteRoom = useMutation({
        mutationFn: (id: string) => rawRoomApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scheduleKeys.rooms });
        }
    });

    return { createRoom, updateRoom, deleteRoom };
}
