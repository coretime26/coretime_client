import axios, { AxiosError, InternalAxiosRequestConfig as OriginalInternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

// --- Types ---
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: { code: string; message: string; };
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
    accountId?: string; // TSID: string
    identity?: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
    isPending?: boolean;
    organizationId?: string; // TSID: string
}

export interface InviteCodeValidationResult {
    valid: boolean;
    organizationId: string;
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
    organizationId?: string;
    inviteCode?: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
}

export interface SignUpResult {
    accountId: string;
    organizationId: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
    status: 'ACTIVE' | 'PENDING_APPROVAL';
    accessToken: string;
    refreshToken: string;
}

export interface ReissueResult {
    accessToken: string;
    refreshToken: string;
}

export interface MeResult {
    accountId: string;
    name: string;
    identity: 'OWNER' | 'INSTRUCTOR' | 'MEMBER' | 'SYSTEM_ADMIN';
    organizationId: string | null;
    organizationName: string | null;
    profileImageUrl?: string | null;
}

export interface Payment {
    id: string;
    membershipId: string;
    memberName: string;
    productName: string;
    amount: number;
    method: 'CARD' | 'TRANSFER' | 'CASH';
    status: 'PAID' | 'REFUNDED' | 'CANCELLED';
    paidAt: string;
}

export interface TicketProduct {
    id: string;
    name: string;
    type: 'ONE_TO_ONE' | 'GROUP';
    sessionCount: number;
    durationDays: number;
    price: number;
    isActive: boolean;
    createdAt: string;
}

export interface MemberTicketResult {
    id: string;
    membershipId: string;
    ticketName: string;
    totalCount: number;
    remainingCount: number;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED' | 'DELETED';
}

export interface InstructorDto {
    membershipId: string;
    accountId: string;
    name: string;
    email: string;
    phone: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'WITHDRAWN';
}

// --- API Client ---
const getBaseUrl = () => {
    const root = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    return `${root.replace(/\/$/, '')}/api/v1`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
});

// --- Session Cache & Utils ---
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 1000;

export const clearSessionCache = () => { sessionCache = null; };

const getCachedSession = async () => {
    const now = Date.now();
    if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_TTL) return sessionCache.session;
    const session = await getSession();
    sessionCache = { session, timestamp: now };
    return session;
};

// --- Interceptors ---
interface InternalAxiosRequestConfig extends OriginalInternalAxiosRequestConfig { _skipAuthRedirect?: boolean; }

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (config.headers && config.headers.Authorization) return config;
    const session = await getCachedSession();
    if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
    if (session?.user?.organizationId) config.headers['X-Organization-ID'] = String(session.user.organizationId);
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                await signOut({ callbackUrl: '/login' });
            }
        }
        return Promise.reject(error);
    }
);

// --- API Objects (복구 완료) ---

export const authApi = {
    login: async (cmd: OAuth2LoginCommand) => (await api.post<ApiResponse<OAuth2LoginResult>>('/auth/login', cmd)).data.data,
    signUp: async (cmd: SignUpCommand) => (await api.post<ApiResponse<SignUpResult>>('/auth/signup', cmd)).data.data,
    getMe: async () => (await api.get<ApiResponse<MeResult>>('/auth/me')).data.data,
    logout: async () => { await api.post('/auth/logout'); },
    reissue: async (cmd: { accessToken: string; refreshToken: string }) => (await api.post<ApiResponse<ReissueResult>>('/auth/reissue', cmd)).data.data,
    getMyOrganizations: async () => (await api.get<ApiResponse<any[]>>('/management/organizations/my')).data.data,
    getPendingInstructors: async () => (await api.get<ApiResponse<InstructorDto[]>>('/management/pending-instructors')).data.data,
    getActiveInstructors: async () => (await api.get<ApiResponse<InstructorDto[]>>('/management/instructors')).data.data,
};

export const memberApi = {
    getMembers: async (params?: any) => (await api.get<ApiResponse<any[]>>('/memberships', { params })).data.data,
    updateMember: async (id: string, cmd: any) => (await api.patch<ApiResponse<any>>(`/memberships/${id}`, cmd)).data.data,
};

export const paymentApi = {
    getAll: async () => (await api.get<ApiResponse<Payment[]>>('/finance/payments')).data.data,
    refund: async (id: string) => (await api.post<ApiResponse<any>>(`/finance/payments/${id}/refund`)).data,
    getAvailable: async (membershipId: string) => (await api.get<ApiResponse<Payment[]>>('/finance/payments/available', { params: { membershipId } })).data.data,
};

export const ticketProductApi = {
    getAll: async () => (await api.get<ApiResponse<TicketProduct[]>>('/finance/tickets/products')).data.data,
};

export const memberTicketApi = {
    getTickets: async () => (await api.get<ApiResponse<MemberTicketResult[]>>('/memberships/tickets')).data.data,
};

export const profileApi = {
    getNotificationSettings: async () => (await api.get<ApiResponse<any>>('/profile/me/notifications')).data.data,
};

// --- React Query Hooks (복구 완료) ---
export const queryKeys = {
    userProfile: ['user', 'profile'] as const,
    myOrganizations: ['organizations', 'my'] as const,
    dashboard: {
        stats: (role: string) => ['dashboard', 'stats', role] as const,
        activity: (role: string) => ['dashboard', 'activity', role] as const,
        alerts: ['dashboard', 'alerts'] as const,
    }
};

export function useUserProfile() { return useQuery({ queryKey: queryKeys.userProfile, queryFn: authApi.getMe }); }
export function useMyOrganizations() { return useQuery({ queryKey: queryKeys.myOrganizations, queryFn: authApi.getMyOrganizations }); }
export function useActiveInstructors() { return useQuery({ queryKey: ['instructors', 'active'], queryFn: authApi.getActiveInstructors }); }
export function usePendingInstructors() { return useQuery({ queryKey: ['instructors', 'pending'], queryFn: authApi.getPendingInstructors }); }
export function useMemberTickets() { return useQuery({ queryKey: ['memberTickets'], queryFn: memberTicketApi.getTickets }); }
export function useMembersList() { return useQuery({ queryKey: ['members'], queryFn: () => memberApi.getMembers() }); }
export function useTicketsList() { return useQuery({ queryKey: ['tickets'], queryFn: () => memberApi.getMembers() }); } // 기존 로직 유지
export function useAvailablePayments(id: string) { return useQuery({ queryKey: ['payments', 'available', id], queryFn: () => paymentApi.getAvailable(id), enabled: !!id }); }

// Mock Hooks (기존 로직 유지를 위해 남겨둠)
export function useDashboardStats(role: string) { return useQuery({ queryKey: queryKeys.dashboard.stats(role), queryFn: () => ({}) }); }
export function useRecentActivity(role: string) { return useQuery({ queryKey: queryKeys.dashboard.activity(role), queryFn: () => [] }); }
export function useCenterAlerts() { return useQuery({ queryKey: queryKeys.dashboard.alerts, queryFn: () => [] }); }
export function useWeeklySchedule(date: Date) { return useQuery({ queryKey: ['schedule', date], queryFn: () => [] }); }
export function useRooms() { return useQuery({ queryKey: ['rooms'], queryFn: () => [] }); }
export function useScheduleInstructors() { return useQuery({ queryKey: ['schedule', 'instructors'], queryFn: () => [] }); }

export default api;
