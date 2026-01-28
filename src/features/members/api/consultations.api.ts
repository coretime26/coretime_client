import { api, ApiResponse } from '@/lib/api';
import { ConsultationLog, ConsultationCategory, TSID } from '../model/types';

// API DTOs
// API DTOs
interface ConsultationLogDto {
    id: string; // Transformed to string by api.ts axios interceptor
    membershipId: string;
    operatorAccountId: string;
    category: ConsultationCategory;
    content: string;
    tags?: string; // "#tag1,#tag2"
    consultedAt: string; // ISO 8601
    createdAt: string;
}

interface CreateConsultationCommand {
    membershipId: number | string;
    category: ConsultationCategory;
    content: string;
    tags?: string;
    consultedAt: string;
}

interface UpdateConsultationCommand {
    membershipId: number | string;
    category: ConsultationCategory;
    content: string;
    tags?: string;
    consultedAt: string;
}

// Helper to convert DTO to Domain
const mapDtoToDomain = (dto: ConsultationLogDto): ConsultationLog => ({
    id: dto.id,
    membershipId: dto.membershipId,
    operatorAccountId: dto.operatorAccountId,
    category: dto.category,
    content: dto.content,
    tags: dto.tags ? dto.tags.split(',').filter(t => t.trim().length > 0) : [],
    consultedAt: new Date(dto.consultedAt),
    createdAt: new Date(dto.createdAt)
});

export const consultationsApi = {
    // 4. Get Logs
    getLogs: async (membershipId: TSID) => {
        // Pass as string to preserve precision
        const response = await api.get<ApiResponse<ConsultationLogDto[]>>(`/membership/member/consultation/${membershipId}`);
        return response.data.data.map(mapDtoToDomain);
    },

    // 1. Create Log
    createLog: async (log: Omit<ConsultationLog, 'id' | 'operatorAccountId' | 'createdAt'>) => {
        const command: CreateConsultationCommand = {
            membershipId: log.membershipId, // Pass as string, Jackson handles it
            category: log.category,
            content: log.content,
            tags: log.tags.join(','),
            consultedAt: log.consultedAt.toISOString()
        };

        const response = await api.post<ApiResponse<ConsultationLogDto>>('/membership/member/consultation', command);
        return mapDtoToDomain(response.data.data);
    },

    // 2. Update Log
    updateLog: async (logId: TSID, log: Omit<ConsultationLog, 'id' | 'operatorAccountId' | 'createdAt'>) => {
        const command: UpdateConsultationCommand = {
            membershipId: log.membershipId,
            category: log.category,
            content: log.content,
            tags: log.tags.join(','),
            consultedAt: log.consultedAt.toISOString()
        };

        const response = await api.patch<ApiResponse<ConsultationLogDto>>(`/membership/member/consultation/${logId}`, command);
        return mapDtoToDomain(response.data.data);
    },

    // 3. Delete Log
    deleteLog: async (logId: TSID) => {
        await api.delete<ApiResponse<null>>(`/membership/member/consultation/${logId}`);
    }
};
