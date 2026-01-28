import { ClassSession, Reservation, Room } from '../model/types';
import { getInstructorsWithColors, getReservations, getRooms, getWeeklySchedule } from '../model/mock-data';

// Mimic API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scheduleApi = {
    getWeeklySchedule: async (date: Date): Promise<ClassSession[]> => {
        await delay(800);
        return getWeeklySchedule(date);
    },
    getReservations: async (): Promise<Reservation[]> => {
        await delay(600);
        return getReservations();
    },
    getRooms: async (): Promise<Room[]> => {
        await delay(400);
        return getRooms();
    },
    getInstructors: async () => {
        await delay(400);
        return getInstructorsWithColors();
    }
};
