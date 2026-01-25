import axios, { AxiosError, InternalAxiosRequestConfig as OriginalInternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { notifications } from '@mantine/notifications';

// Extend the internal config type
interface InternalAxiosRequestConfig extends OriginalInternalAxiosRequestConfig {
    _skipAuthRedirect?: boolean;
}

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
    phone: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
}

export interface JoinOrganizationCommand {
    organizationId?: number;
    inviteCode?: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1" || 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Token Management ---

// Session cache to prevent infinite getSession() calls
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 1000; // 1 second cache

// Helper to get session with caching
const getCachedSession = async () => {
    const now = Date.now();

    // Return cached session if still valid
    if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_TTL) {
        return sessionCache.session;
    }

    // Fetch fresh session
    const session = await getSession();
    sessionCache = { session, timestamp: now };
    return session;
};

// Helper to get token for requests
const getAccessToken = async () => {
    const session = await getCachedSession();
    return session?.accessToken;
};

// --- Interceptors ---

// Request: Attach Access Token and Organization ID
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Skip token for auth endpoints if needed, but usually safe to attach
        // Allow manual override
        if (config.headers && config.headers.Authorization) {
            return config;
        }

        const session = await getCachedSession();

        // Attach Access Token
        if (session?.accessToken) {
            if (!config.headers) {
                config.headers = {} as any;
            }
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

        // Attach Organization ID
        if (session?.user?.organizationId) {
            if (!config.headers) {
                config.headers = {} as any;
            }
            config.headers['X-Organization-ID'] = String(session.user.organizationId);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response: Handle 401 & 403
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // 1. Handle 403 Forbidden -> Access Denied
        if (error.response?.status === 403) {
            // Show notification before redirecting
            if (typeof window !== 'undefined') {
                notifications.show({
                    title: '접근 권한 없음',
                    message: '해당 기능에 접근할 권한이 없습니다. 다시 로그인해 주세요.',
                    color: 'red',
                    autoClose: 3000
                });

                // Optional: Delay slightly to let user see message, or just redirect
                // Await signOut to ensure it clears state
                if (!window.location.pathname.startsWith('/login')) {
                    setTimeout(() => {
                        signOut({ callbackUrl: '/login' });
                    }, 1500);
                }
            }
            return Promise.reject(error);
        }

        // 2. Handle 401 Unauthorized -> Session Invalid
        // Try to refresh token if we have a refresh token
        if (error.response?.status === 401) {
            const config = error.config as InternalAxiosRequestConfig;

            // Skip if this request specifically opted out
            if (config && config._skipAuthRedirect) {
                return Promise.reject(error);
            }

            console.error("401 Unauthorized: Session may have expired.");
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                await signOut({ callbackUrl: '/login' });
            }
        }

        return Promise.reject(error);
    }
);

export interface RegisterOrganizationResult {
    organizationId: number;
}

export interface RegisterOrganizationCommand {
    organizationName: string;
    representativeName: string;
    businessNumber: string;
    category: string;
    address: string;
    organizationPhone: string;
}

export interface OrganizationResult {
    id: number;
    name: string;
    address: string;
    phone?: string;
    representativeName?: string;
    status: 'ACTIVE' | 'PENDING' | 'PENDING_APPROVAL' | 'REJECTED';
}

// Keeping OrganizationDto alias if needed for backward compat, or just use OrganizationResult
export type OrganizationDto = OrganizationResult;

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
    getMe: async (config?: AxiosRequestConfig & { _skipAuthRedirect?: boolean }) => {
        const response = await api.get<ApiResponse<MeResult>>('/auth/me', config);
        return response.data.data; // Unwrapping data
    },
    logout: async () => {
        await api.post('/auth/logout');
    },
    reissue: async (command: { accessToken: string; refreshToken: string }) => {
        const response = await api.post<ApiResponse<ReissueResult>>('/auth/reissue', command);
        return response.data.data;
    },

    // 1.1 Memberships (Join)
    joinOrganization: async (command: JoinOrganizationCommand) => {
        const response = await api.post<ApiResponse<any>>('/memberships', command);
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
    registerOrganization: async (command: RegisterOrganizationCommand, config?: AxiosRequestConfig) => {
        const response = await api.post<ApiResponse<RegisterOrganizationResult>>('/management/organizations', command, config);
        return response.data.data;
    },
    // 3.3 Get Single (Public/Protected?)
    getOrganization: async (organizationId: number | string, config?: AxiosRequestConfig) => {
        const response = await api.get<ApiResponse<OrganizationResult>>(`/management/organizations/${organizationId}`, config);
        return response.data.data;
    },
    // 3.1 Get Organizations (All or Specific List)
    getOrganizations: async (ids?: (number | string)[], config?: AxiosRequestConfig & { _skipAuthRedirect?: boolean }) => {
        let url = '/management/organizations';
        if (ids && ids.length > 0) {
            url += `/${ids.join(',')}`;
        }
        const response = await api.get<ApiResponse<OrganizationResult[]>>(url, config);
        return response.data.data;
    },
    // 3.2 Get My Organizations (for switcher)
    getMyOrganizations: async () => {
        const response = await api.get<ApiResponse<OrganizationResult[]>>('/management/organizations/my');
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
