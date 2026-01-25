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

export interface ReissueResult {
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

// --- Interceptors ---

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request: Attach Access Token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            if (!config.headers) {
                config.headers = {} as any;
            }
            // console.log('[API] Attaching Token:', token.substring(0, 10) + '...');
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response: Handle 401 & 403 & Refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 1. Handle 403 Forbidden -> Immediate Logout
        if (error.response?.status === 403) {
            clearTokens();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // 2. Handle 401 Unauthorized -> Token Refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            const accessToken = getAccessToken(); // Some backends might need old access token

            if (refreshToken) {
                try {
                    // Call Reissue Endpoint
                    const { data } = await axios.post<ApiResponse<ReissueResult>>(`${BASE_URL}/auth/reissue`, {
                        accessToken: accessToken || '', // Send current (expired) access token if available
                        refreshToken,
                    });

                    // Check success based on ApiResponse wrapper
                    // Adapting to user's provided structure which might wrap data
                    const newTokens = data.data || data;
                    // @ts-ignore
                    const finalAccessToken = newTokens.accessToken;
                    // @ts-ignore
                    const finalRefreshToken = newTokens.refreshToken;

                    if (!finalAccessToken) {
                        throw new Error('No access token returned');
                    }

                    // Save new tokens
                    setTokens(finalAccessToken, finalRefreshToken);

                    // Process Queue
                    processQueue(null, finalAccessToken);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${finalAccessToken}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    // Refresh failed - Logout
                    clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // No tokens to refresh
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
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
    reissue: async (command: { accessToken: string; refreshToken: string }) => {
        const response = await api.post<ApiResponse<ReissueResult>>('/auth/reissue', command);
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
