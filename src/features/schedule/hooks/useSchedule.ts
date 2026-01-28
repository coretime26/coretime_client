import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { scheduleApi } from '../api/schedule.api';
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
