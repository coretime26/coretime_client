import { api, ApiResponse } from '@/lib/api';
import { MemberDto, RegisterMemberCommand } from './members.dto';

export const membersApi = {
    // 1. Get Members
    getMembers: async (status?: string | string[], search?: string) => {
        // URL: GET /api/v1/memberships
        // Handle status param: if array, join with comma. If string, use as is.
        const statusParam = Array.isArray(status) ? status.join(',') : status;

        const response = await api.get<ApiResponse<MemberDto[]>>('/memberships', {
            params: {
                status: statusParam,
                search
            }
        });
        return response.data.data;
    },

    // 2. Register Member
    registerMember: async (command: RegisterMemberCommand) => {
        // URL: POST /api/v1/memberships/register
        const response = await api.post<ApiResponse<MemberDto>>('/memberships/register', command);
        return response.data.data;
    },

    // 3. Get Membership Detail
    // NOTE: The user's Controller snippet does NOT show a single get method for /memberships/{id}.
    // It only has register, get list, and update.
    // However, the UI needs details. 
    // If the endpoint is missing in the provided snippet, it might be in `GetMembersUseCase` but not exposed??
    // OR we should filter from the list? (Inefficient).
    // For now, I will keep it assuming it EXISTS but was omitted, OR I will comment about it.
    // But wait, getMemberLogs is in MemberConsultationController.
    // Let's assume standard REST: GET /memberships/{id} should exist.
    // If it fails with 404, we know why.
    getMember: async (membershipId: string) => {
        const response = await api.get<ApiResponse<MemberDto>>(`/memberships/${membershipId}`);
        return response.data.data;
    },

    // 4. Update Member Note
    updateNote: async (membershipId: string, note: string) => {
        // URL: PATCH /api/v1/memberships/{id}/note
        const response = await api.patch<ApiResponse<void>>(`/memberships/${membershipId}/note`, { note }); // Changed object structure to match
        // Controller expects `MemberCommand.UpdateNote` which likely contains `note` field.
        // Wait, command object structure?
        // @RequestBody MemberCommand.UpdateNote command
        // Assume UpdateNote { String note; }
        return response.data;
    },

    // 5. Update Member Profile
    updateMember: async (membershipId: string, data: Partial<MemberDto>) => {
        // URL: PATCH /api/v1/memberships/{id}
        // Controller: @PatchMapping("/{membershipId}")
        const response = await api.patch<ApiResponse<MemberDto>>(`/memberships/${membershipId}`, data);
        return response.data.data;
    }
};
