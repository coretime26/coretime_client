import { api, ApiResponse } from '@/lib/api';
import { ConsultationLog } from '../model/types';
// Mock logic since MemberContext was local state
// We will simulate API calls

export const consultationsApi = {
    getLogs: async (memberId: string) => {
        // Return empty list or mock
        return [] as ConsultationLog[];
    },

    addLog: async (log: Omit<ConsultationLog, 'id' | 'date'>) => {
        // Simulate
        const newLog: ConsultationLog = {
            ...log,
            id: `LOG_${Date.now()}`,
            date: new Date()
        };
        return newLog;
    }
};
