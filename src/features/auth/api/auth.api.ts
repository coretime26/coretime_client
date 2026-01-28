import { apiClient, InternalAxiosRequestConfig } from '@/shared/lib/http/axios-client';
import { AxiosRequestConfig } from 'axios';
import {
    ApiResponse,
    OAuth2LoginCommand,
    OAuth2LoginResult,
    SignUpCommand,
    SignUpResult,
    MeResult,
    ReissueResult,
    JoinOrganizationCommand,
    InviteCodeValidationResult,
    RegisterOrganizationCommand,
    RegisterOrganizationResult,
    OrganizationResult,
    InviteCodeResult,
    InstructorDto,
    UpdateProfileCommand,
    NotificationSettings
} from './auth.dto';

export const authApi = {
    // 1. Auth & Account
    login: async (command: OAuth2LoginCommand) => {
        const response = await apiClient.post<ApiResponse<OAuth2LoginResult>>('/auth/login', command);
        return response.data.data;
    },
    signUp: async (command: SignUpCommand) => {
        const response = await apiClient.post<ApiResponse<SignUpResult>>('/auth/signup', command);
        return response.data.data;
    },
    getMe: async (config?: AxiosRequestConfig & { _skipAuthRedirect?: boolean }) => {
        const response = await apiClient.get<ApiResponse<MeResult>>('/auth/me', config);
        return response.data.data;
    },
    logout: async () => {
        await apiClient.post('/auth/logout');
    },
    reissue: async (command: { accessToken: string; refreshToken: string }) => {
        const response = await apiClient.post<ApiResponse<ReissueResult>>('/auth/reissue', command);
        return response.data.data;
    },

    // 1.1 Memberships (Join)
    joinOrganization: async (command: JoinOrganizationCommand) => {
        const response = await apiClient.post<ApiResponse<any>>('/memberships', command);
        return response.data.data;
    },

    // 2. Invite Code Validation
    validateInviteCode: async (code: string) => {
        const response = await apiClient.get<ApiResponse<InviteCodeValidationResult>>('/invite-codes/validate', {
            params: { code }
        });
        return response.data.data;
    },

    // 3. Center Management (Owner)
    registerOrganization: async (command: RegisterOrganizationCommand, config?: AxiosRequestConfig) => {
        const response = await apiClient.post<ApiResponse<RegisterOrganizationResult>>('/management/organizations', command, config);
        return response.data.data;
    },
    // 3.3 Get Single (Public/Protected?)
    getOrganization: async (organizationId: string, config?: AxiosRequestConfig) => {
        const response = await apiClient.get<ApiResponse<OrganizationResult>>(`/management/organizations/${organizationId}`, config);
        return response.data.data;
    },
    // 3.1 Get Organizations (All or Specific List)
    getOrganizations: async (ids?: string[], config?: AxiosRequestConfig & { _skipAuthRedirect?: boolean }) => {
        let url = '/management/organizations';
        if (ids && ids.length > 0) {
            url += `/${ids.join(',')}`;
        }
        const response = await apiClient.get<ApiResponse<OrganizationResult[]>>(url, config);
        return response.data.data;
    },
    // 3.2 Get My Organizations (for switcher)
    getMyOrganizations: async () => {
        const response = await apiClient.get<ApiResponse<OrganizationResult[]>>('/management/organizations/my');
        return response.data.data;
    },

    // 4. Invite Code Management (Owner)
    getInviteCode: async (organizationId: string) => {
        const response = await apiClient.get<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes`);
        return response.data.data;
    },
    reissueInviteCode: async (organizationId: string) => {
        const response = await apiClient.post<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes/reissue`);
        return response.data.data;
    },

    // 5. Instructor Management (HR)
    getActiveInstructors: async () => {
        const response = await apiClient.get<ApiResponse<InstructorDto[]>>('/management/instructors');
        return response.data.data;
    },
    getPendingInstructors: async () => {
        const response = await apiClient.get<ApiResponse<InstructorDto[]>>('/management/pending-instructors');
        return response.data.data;
    },
    // 5.3 Approve/Reject
    updateMembershipStatus: async (membershipId: string, isApproved: boolean) => {
        const response = await apiClient.patch<ApiResponse<any>>(`/management/memberships/${membershipId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    },
    // 5.4 Update Status
    updateInstructorStatus: async (membershipId: string, status: string) => {
        const response = await apiClient.patch<ApiResponse<any>>(`/management/instructors/${membershipId}/management`, { status });
        return response.data.data;
    },

    // 6. Super Admin
    getPendingOrganizations: async () => {
        // Use OrganizationResult instead of OrganizationDto since they are aliased in api.ts
        const response = await apiClient.get<ApiResponse<OrganizationResult[]>>('/admin/organizations/pending');
        return response.data.data;
    },
    approveOrganization: async (organizationId: string, isApproved: boolean) => {
        const response = await apiClient.patch<ApiResponse<any>>(`/admin/organizations/${organizationId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    },

    // Profile API (Moved here as it relates to Auth/User)
    updateProfile: async (command: UpdateProfileCommand) => {
        const response = await apiClient.put<ApiResponse<MeResult>>('/profile/me', command);
        return response.data.data;
    },
    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<ApiResponse<string>>('/profile/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { profileImageUrl: response.data.data };
    },
    getNotificationSettings: async () => {
        const response = await apiClient.get<ApiResponse<NotificationSettings>>('/profile/me/notifications');
        return response.data.data;
    },
    updateNotificationSettings: async (settings: NotificationSettings) => {
        const response = await apiClient.put<ApiResponse<void>>('/profile/me/notifications', settings);
        return settings;
    },
    deleteAccount: async () => {
        const response = await apiClient.delete<ApiResponse<void>>('/profile/me');
        return response.data;
    }
};
