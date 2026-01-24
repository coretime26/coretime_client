import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// --- Types ---

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface OAuth2LoginCommand {
    provider: 'google' | 'kakao';
    providerId: string;
    email: string;
    username: string;
    avatarUrl?: string;
}

export interface OAuth2LoginResult {
    isSignUpRequired: boolean;
    signupToken?: string;
    accessToken?: string;
    refreshToken?: string;
    accountId?: string | number; // Updated: might be string or number
    identity?: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
    isPending?: boolean;
    organizationId?: number;
}

export interface InviteCodeValidationResult {
    valid: boolean;
    organizationId: number;
    organizationName: string;
    organizationAddress: string;
}

export interface SignUpCommand {
    signupToken: string;
    email: string;
    name: string;
    phone?: string;
    identity: 'OWNER' | 'INSTRUCTOR';
    inviteCode?: string;
    organizationId?: number;
}

export interface SignUpResult {
    accessToken: string;
    refreshToken: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL';
}

export interface ReissueTokenResult {
    accessToken: string;
    refreshToken: string;
}

export interface MeResult {
    accountId: string; // Updated to string as per JSON example, though DTO says Long (serialized as string often)
    name: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER' | 'SYSTEM_ADMIN';
    organizationId: number | null;
    organizationName: string | null;
    profileImageUrl?: string | null;
}

// --- API Client ---

const BASE_URL = 'https://core.api-talkterview.com/api/v1';
// const BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Token Management ---

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
};
export const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

// --- Interceptors ---

// Request: Attach Access Token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            if (!config.headers) {
                config.headers = {} as any; // safe cast for Axios headers
            }
            console.log('[API] Attaching Token:', token.substring(0, 10) + '...');
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log('[API] No Token found in localStorage');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response: Handle 401 & Refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = getRefreshToken();
            const accessToken = getAccessToken();

            if (refreshToken && accessToken) {
                try {
                    // Call Reissue Endpoint
                    // Note: Reissue might return nested data too depending on implementation, 
                    // but typically simple auth endpoints might be direct or wrapped. Assuming wrapped for safety or checking.
                    // Let's assume standard API wrapper for all 'api/v1' endpoints.
                    const { data } = await axios.post<ApiResponse<ReissueTokenResult>>(`${BASE_URL}/auth/reissue`, {
                        accessToken,
                        refreshToken,
                    });

                    // Unwrap if wrapped
                    const newTokens = data.data || data;
                    // @ts-ignore - handling both wrapped and direct just in case fallback
                    const finalTokens = newTokens.accessToken ? newTokens : data;

                    // Save new tokens
                    setTokens((finalTokens as any).accessToken, (finalTokens as any).refreshToken);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${(finalTokens as any).accessToken}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - Logout
                    clearTokens();
                    window.location.href = '/login'; // Force redirect
                    return Promise.reject(refreshError);
                }
            } else {
                // No tokens to refresh
                clearTokens();
                // Only redirect if not already on login page?
                // window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export interface RegisterOrganizationCommand {
    name: string;
    representativeName: string;
    businessNumber: string;
    category: string;
    address: string;
    phone: string;
}

export interface OrganizationDto {
    id: number;
    name: string;
    address: string;
    phone?: string;
    representativeName?: string;
    status?: 'ACTIVE' | 'PENDING' | 'REJECTED';
}

export interface InviteCodeResult {
    code: string;
    expireAt: string;
    remainingSeconds: number;
}

export interface InstructorDto {
    membershipId: number;
    accountId: string | number; // Updated
    name: string;
    email: string;
    phone: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'WITHDRAWN';
    joinedAt?: string;
}

// --- API Functions ---

export const authApi = {
    // 1. Auth & Account
    login: async (command: OAuth2LoginCommand) => {
        const response = await api.post<ApiResponse<OAuth2LoginResult>>('/auth/login', command);
        return response.data.data;
    },
    signUp: async (command: SignUpCommand) => {
        const response = await api.post<ApiResponse<SignUpResult>>('/auth/signup', command);
        return response.data.data;
    },
    getMe: async () => {
        const response = await api.get<ApiResponse<MeResult>>('/auth/me');
        return response.data.data; // Unwrapping data
    },
    logout: async () => {
        await api.post('/auth/logout');
    },
    reissue: async (refreshToken: string) => {
        const response = await api.post<ApiResponse<ReissueTokenResult>>('/auth/reissue', { refreshToken });
        return response.data.data;
    },

    // 2. Invite Code Validation
    validateInviteCode: async (code: string) => {
        const response = await api.get<ApiResponse<InviteCodeValidationResult>>('/invite-codes/validate', {
            params: { code }
        });
        return response.data.data;
    },

    // 3. Center Management (Owner)
    registerOrganization: async (command: RegisterOrganizationCommand) => {
        const response = await api.post<ApiResponse<OrganizationDto>>('/management/organizations', command);
        return response.data.data;
    },
    getOrganizations: async () => {
        // 3.2 Get All Centers (Active)
        const response = await api.get<ApiResponse<OrganizationDto[]>>('/management/organizations');
        return response.data.data;
    },

    // 4. Invite Code Management (Owner)
    getInviteCode: async (organizationId: number) => {
        const response = await api.get<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes`);
        return response.data.data;
    },
    reissueInviteCode: async (organizationId: number) => {
        const response = await api.post<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes/reissue`);
        return response.data.data;
    },

    // 5. Instructor Management (HR)
    getActiveInstructors: async () => {
        const response = await api.get<ApiResponse<InstructorDto[]>>('/management/instructors');
        return response.data.data;
    },
    getPendingInstructors: async () => {
        const response = await api.get<ApiResponse<InstructorDto[]>>('/management/pending-instructors');
        return response.data.data;
    },
    // 5.3 Approve/Reject
    updateMembershipStatus: async (membershipId: number, isApproved: boolean) => {
        const response = await api.patch<ApiResponse<any>>(`/management/memberships/${membershipId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    },
    // 5.4 Update Status
    updateInstructorStatus: async (membershipId: number, status: string) => {
        const response = await api.patch<ApiResponse<any>>(`/management/instructors/${membershipId}/management`, { status });
        return response.data.data;
    },

    // 6. Super Admin
    getPendingOrganizations: async () => {
        const response = await api.get<ApiResponse<OrganizationDto[]>>('/admin/organizations/pending');
        return response.data.data;
    },
    approveOrganization: async (organizationId: number, isApproved: boolean) => {
        const response = await api.patch<ApiResponse<any>>(`/admin/organizations/${organizationId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    }
};

export default api;
