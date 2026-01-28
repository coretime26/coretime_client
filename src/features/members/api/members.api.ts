import { api, ApiResponse } from '@/lib/api';
import { MemberDto, RegisterMemberCommand } from './members.dto';

export const membersApi = {
    // 1. Get Members
    getMembers: async (status?: string) => {
        const response = await api.get<ApiResponse<MemberDto[]>>('/memberships/members', {
            params: { status }
        });
        return response.data.data;
    },

    // 2. Register Member
    registerMember: async (command: RegisterMemberCommand) => {
        const response = await api.post<ApiResponse<MemberDto>>('/memberships/members', command);
        return response.data.data;
    },

    // 3. Get Membership Detail
    getMember: async (membershipId: string) => {
        const response = await api.get<ApiResponse<MemberDto>>(`/memberships/${membershipId}`);
        return response.data.data;
    },

    // 4. Update Member Note
    updateNote: async (membershipId: string, note: string) => {
        const response = await api.patch<ApiResponse<void>>(`/memberships/${membershipId}/note`, { note });
        return response.data;
    },

    // 5. Update Member Profile (General update)
    updateMember: async (membershipId: string, data: Partial<MemberDto>) => {
        // Assuming endpoint exists or reusing what was in the context logic
        const response = await api.put<ApiResponse<MemberDto>>(`/memberships/${membershipId}`, data);
        return response.data.data;
    }
};
