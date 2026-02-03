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
    accountId?: string;
    identity?: 'OWNER' | 'INSTRUCTOR' | 'MEMBER';
    isPending?: boolean;
    organizationId?: string;
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

// Profile Management Types
export interface UpdateProfileCommand {
    name?: string;
    phone?: string;
}

export interface NotificationSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reservationReminder: boolean;
    marketingConsent: boolean;
}

// Ticket Product Types
export type TicketProductType = 'ONE_TO_ONE' | 'GROUP';

export interface TicketProduct {
    id: string;
    name: string;
    type: TicketProductType;
    sessionCount: number;
    durationDays: number;
    price: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateTicketProductCommand {
    name: string;
    type: TicketProductType;
    sessionCount: number;
    durationDays: number;
    price: number;
}

export interface UpdateTicketProductCommand {
    name: string;
    type: TicketProductType;
    sessionCount: number;
    durationDays: number;
    price: number;
}

// Payment Types
export type PaymentMethod = 'CARD' | 'TRANSFER' | 'CASH';
export type PaymentStatus = 'PAID' | 'REFUNDED' | 'CANCELLED';

export interface Payment {
    id: string;           // FIXED: String -> string
    membershipId: string; // FIXED: String -> string
    memberName: string;
    productName: string;
    amount: number;       // Paid amount
    totalAmount?: number;
    discountAmount?: number;
    unpaidAmount?: number;
    unpaidDueDate?: string;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: string;
    refundedAt?: string;
    linkedTicketId?: string | null;
}

// Member Ticket Types
export type TicketStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED' | 'DELETED';

export interface MemberTicketResult {
    id: string;
    membershipId: string;
    name: string;            // Added Member Name
    ticketName: string;
    totalCount: number;
    remainingCount: number;
    startDate: string;       // YYYY-MM-DD
    endDate: string;         // YYYY-MM-DD
    paymentId?: string;
    ticketProductId?: string;
    status: TicketStatus;
}

export interface IssueTicketCommand {
    membershipId: string;
    ticketName: string;
    totalCount: number;
    startDate: string;       // YYYY-MM-DD
    endDate: string;         // YYYY-MM-DD
    paymentId?: string;
    ticketProductId?: string;
}

export interface UpdateTicketStatusCommand {
    pause: boolean;
}

export interface ExtendTicketCommand {
    endDate: string;         // YYYY-MM-DD
}

export interface AddTicketCountCommand {
    count: number;
}

export interface CreatePaymentCommand {
    membershipId: string;
    productId: string;
    amount: number;
    totalAmount: number;
    discountAmount?: number;
    unpaidAmount?: number;
    unpaidDueDate?: string;
    method: PaymentMethod;
    linkedTicketId?: string | null;
    autoIssue?: boolean;
}

export interface PaymentQuery {
    startDate?: string;
    endDate?: string;
    hasUnpaid?: boolean;
    search?: string;
}

export interface RefundResult {
    status: PaymentStatus;
}

// Finance Statistics Types
export interface RevenueSummary {
    totalSales: number;
    refundAmount: number;
    netSales: number;
    unpaidAmount: number;
    growthRate: number;
    topPaymentMethod: {
        method: PaymentMethod;
        percentage: number;
        amount: number;
    };
}

export interface TrendData {
    date: string; // YYYY-MM-DD
    revenue: number;
    refund: number;
    unpaid: number;
}

export interface PaymentMethodStats {
    method: PaymentMethod;
    label: string;
    amount: number;
    percentage: number;
    color: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TransactionItem {
    id: string; // TSID or Long (Stringified)
    paidAt: string;
    productName: string;
    memberName: string;
    method: PaymentMethod;
    amount: number;
    status: PaymentStatus;
}

export interface TransactionList {
    list: TransactionItem[];
    pagination: Pagination;
}

// --- Schedule & Reservation Types ---

export interface RoomResult {
    id: string;
    name: string;
    capacity: number;
}

export interface CreateRoomCommand {
    name: string;
    capacity: number;
}

export interface UpdateRoomCommand {
    name?: string;
    capacity?: number;
}

export interface ScheduleResult {
    id: string; // classSessionId
    title: string;
    startDateTime: string; // ISO-8601
    endDateTime: string;   // ISO-8601
    instructorMembershipId: string;
    instructorName: string; // Derived from API or join
    roomId: string;
    roomName: string;       // Derived from API or join
    maxCapacity: number;
    currentReservedCount: number;
    status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELED';
    notes?: string;
}

export interface CreateScheduleCommand {
    title: string;
    instructorMembershipId: string; // ID
    roomId: string;                 // ID
    startDateTime: string;          // ISO-8601
    endDateTime: string;            // ISO-8601
    maxCapacity: number;
    notes?: string;
}

export interface UpdateScheduleCommand {
    title?: string;
    instructorMembershipId?: string;
    roomId?: string;
    startDateTime?: string;
    endDateTime?: string;
    maxCapacity?: number;
    notes?: string;
}

export interface ReservationResult {
    id: string; // reservationId
    classSessionId: string;
    classTitle: string;
    startDateTime: string;
    endDateTime: string;
    instructorName: string;
    roomName: string;
    membershipId: string;
    memberName: string;
    status: 'RESERVED' | 'WAITING' | 'CANCELED' | 'NOSHOW' | 'CANCELED_BY_ADMIN';
    attendanceStatus: 'NONE' | 'PRESENT' | 'LATE' | 'ABSENT';
    channel?: string; // Optional context
    createdAt?: string; // Optional context
    userId?: string; // client alias for membershipId
    userName?: string; // client alias for memberName
}

export interface CreateReservationCommand {
    classSessionId: string;
}

export interface CreateReservationByAdminCommand {
    membershipId: string;
    classSessionId: string;
}

export interface UpdateAttendanceCommand {
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOSHOW';
}

export interface ReservationQuery {
    startDate?: string;
    endDate?: string;
    status?: string;
    instructorId?: string;
}

// --- API Client ---

const BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1" || 'http://localhost:8080/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
    transformResponse: [
        (data) => {
            if (typeof data === 'string') {
                try {
                    // Regex to match large numbers (15+ digits) and wrap them in quotes
                    // Identifies: : 123456789012345678... followed by , } or ]
                    // We must be careful not to corrupt valid numbers or mess up strings
                    // This is a "best effort" heuristic for the Long -> String problem without json-bigint
                    const transformed = data.replace(/:\s*(\d{15,})([,\}\]])/g, ': "$1"$2');
                    return JSON.parse(transformed);
                } catch (e) {
                    // Fallback to default parsing if regex/parse fails
                    return JSON.parse(data);
                }
            }
            return data;
        }
    ],
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

// Clear session cache (useful after signIn to force fresh session)
export const clearSessionCache = () => {
    sessionCache = null;
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
    organizationId: string;
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
    id: string;
    name: string;
    address: string;
    phone?: string;
    representativeName?: string;
    category?: string;
    status: 'ACTIVE' | 'PENDING' | 'PENDING_APPROVAL' | 'REJECTED';
    membershipStatus?: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'WITHDRAWN';
}

// Keeping OrganizationDto alias if needed for backward compat, or just use OrganizationResult
export type OrganizationDto = OrganizationResult;

export interface InviteCodeResult {
    code: string;
    expireAt: string;
    remainingSeconds: number;
}

export interface InstructorDto {
    membershipId: string;
    accountId: string;
    name: string;
    email: string;
    phone: string;
    identity: 'INSTRUCTOR';
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'WITHDRAWN' | 'REJECTED';
    profileImageUrl?: string | null;
    gender: 'MALE' | 'FEMALE';
    birthDate?: string;
    memo?: string;
    approvedAt?: string;
    createdAt?: string;
}

export interface RegisterInstructorCommand {
    name: string;
    phone: string;
    email?: string;
    gender: 'MALE' | 'FEMALE';
    birthDate?: string;
    memo?: string;
}

export interface UpdateInstructorCommand {
    name?: string;
    email?: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;  // YYYY-MM-DD
}

export interface UpdateInstructorMemoCommand {
    memo: string;
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
    getOrganization: async (organizationId: string, config?: AxiosRequestConfig) => {
        const response = await api.get<ApiResponse<OrganizationResult>>(`/management/organizations/${organizationId}`, config);
        return response.data.data;
    },
    // 3.1 Get Organizations (All or Specific List)
    getOrganizations: async (ids?: string[], config?: AxiosRequestConfig & { _skipAuthRedirect?: boolean }) => {
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
    getInviteCode: async (organizationId: string) => {
        const response = await api.get<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes`);
        return response.data.data;
    },
    reissueInviteCode: async (organizationId: string) => {
        const response = await api.post<ApiResponse<InviteCodeResult>>(`/organizations/${organizationId}/invite-codes/reissue`);
        return response.data.data;
    },

    // 5. Instructor Management (HR)
    registerInstructor: async (command: RegisterInstructorCommand) => {
        const response = await api.post<ApiResponse<InstructorDto>>('/management/instructors/register', command);
        return response.data.data;
    },
    getActiveInstructors: async () => {
        const response = await api.get<ApiResponse<InstructorDto[]>>('/management/instructors');
        return response.data.data;
    },
    getPendingInstructors: async () => {
        const response = await api.get<ApiResponse<InstructorDto[]>>('/management/pending-instructors');
        return response.data.data;
    },
    // 5.3 Approve/Reject
    updateMembershipStatus: async (membershipId: string, isApproved: boolean) => {
        const response = await api.patch<ApiResponse<any>>(`/management/memberships/${membershipId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    },
    // 5.4 Update Status
    updateInstructorStatus: async (membershipId: string, status: string) => {
        const response = await api.patch<ApiResponse<any>>(`/management/instructors/${membershipId}/management`, { status });
        return response.data.data;
    },
    // 5.5 Update Instructor Info (excluding memo)
    updateInstructor: async (membershipId: string, command: UpdateInstructorCommand) => {
        const response = await api.patch<ApiResponse<InstructorDto>>(`/management/instructors/${membershipId}`, command);
        return response.data.data;
    },
    // 5.6 Update Instructor Memo
    updateInstructorMemo: async (membershipId: string, command: UpdateInstructorMemoCommand) => {
        const response = await api.patch<ApiResponse<void>>(`/management/instructors/${membershipId}/memo`, command);
        return response.data.data;
    },
    // 5.7 Resign Instructor (퇴사 처리)
    resignInstructor: async (membershipId: string) => {
        const response = await api.post<ApiResponse<void>>(`/management/instructors/${membershipId}/resign`);
        return response.data.data;
    },

    // 6. Super Admin
    getPendingOrganizations: async () => {
        const response = await api.get<ApiResponse<OrganizationDto[]>>('/admin/organizations/pending');
        return response.data.data;
    },
    approveOrganization: async (organizationId: string, isApproved: boolean) => {
        const response = await api.patch<ApiResponse<any>>(`/admin/organizations/${organizationId}/status`, null, {
            params: { isApproved }
        });
        return response.data.data;
    }
};

// Profile Management API
export const profileApi = {
    // Update profile information
    updateProfile: async (command: UpdateProfileCommand) => {
        const response = await api.put<ApiResponse<MeResult>>('/profile/me', command);
        return response.data.data;
    },

    // Upload profile avatar
    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<ApiResponse<string>>('/profile/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { profileImageUrl: response.data.data };
    },

    // Get notification settings
    getNotificationSettings: async () => {
        const response = await api.get<ApiResponse<NotificationSettings>>('/profile/me/notifications');
        return response.data.data;
    },

    // Update notification settings
    updateNotificationSettings: async (settings: NotificationSettings) => {
        const response = await api.put<ApiResponse<void>>('/profile/me/notifications', settings);
        return settings;
    },

    // Delete account
    deleteAccount: async () => {
        const response = await api.delete<ApiResponse<void>>('/profile/me');
        return response.data;
    },
};

// Ticket Product API
export const ticketProductApi = {
    // Create ticket product
    create: async (command: CreateTicketProductCommand) => {
        const response = await api.post<ApiResponse<TicketProduct>>('/finance/tickets/products', command);
        return response.data.data;
    },

    // Get all ticket products
    getAll: async () => {
        const response = await api.get<ApiResponse<TicketProduct[]>>('/finance/tickets/products');
        return response.data.data;
    },

    // Update ticket product
    update: async (productId: string, command: UpdateTicketProductCommand) => {
        const response = await api.put<ApiResponse<TicketProduct>>(`/finance/tickets/products/${productId}`, command);
        return response.data.data;
    },

    // Toggle product status
    toggleStatus: async (productId: string) => {
        const response = await api.patch<ApiResponse<void>>(`/finance/tickets/products/${productId}/status`);
        return response.data;
    },

    // Delete ticket product
    delete: async (productId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/finance/tickets/products/${productId}`);
        return response.data;
    },
};

// Payment API
export const paymentApi = {
    // Create new payment
    create: async (command: CreatePaymentCommand) => {
        const response = await api.post<ApiResponse<Payment>>('/finance/payments', command);
        return response.data.data;
    },

    // Get all payments with optional filtering
    getAll: async (params?: PaymentQuery) => {
        const response = await api.get<ApiResponse<Payment[]>>('/finance/payments', { params });
        return response.data.data;
    },

    // Refund payment
    refund: async (paymentId: string) => { // FIXED: String -> string
        const response = await api.post<ApiResponse<RefundResult>>(`/finance/payments/${paymentId}/refund`);
        return response.data;
    },

    // Get available payments for membership
    // Endpoint: /finance/payments/available?membershipId={id}
    getAvailable: async (membershipId: string) => {
        const response = await api.get<ApiResponse<Payment[]>>('/finance/payments/available', {
            params: { membershipId }
        });
        return response.data.data;
    }
};

// Member Ticket API
export const memberTicketApi = {
    // 1. Issue Ticket
    issueTicket: async (command: IssueTicketCommand) => {
        const response = await api.post<ApiResponse<MemberTicketResult>>('/memberships/tickets', command);
        return response.data.data;
    },

    // 2. Get Tickets
    getTickets: async () => {
        const response = await api.get<ApiResponse<MemberTicketResult[]>>('/memberships/tickets');
        return response.data.data;
    },

    // 3. Update Status (Pause/Unpause)
    updateStatus: async (ticketId: string, pause: boolean) => {
        const response = await api.patch<ApiResponse<MemberTicketResult>>(`/memberships/tickets/${ticketId}/status`, { pause });
        return response.data.data;
    },

    // 4. Extend Ticket
    extendTicket: async (ticketId: string, endDate: string) => {
        const response = await api.patch<ApiResponse<MemberTicketResult>>(`/memberships/tickets/${ticketId}/extend`, { endDate });
        return response.data.data;
    },

    // 5. Add Count
    addCount: async (ticketId: string, count: number) => {
        const response = await api.patch<ApiResponse<MemberTicketResult>>(`/memberships/tickets/${ticketId}/count`, { count });
        return response.data.data;
    },

    // 6. Delete Ticket
    deleteTicket: async (ticketId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/memberships/tickets/${ticketId}`);
        return response.data;
    },
};

// Finance Statistics API
export const financeApi = {
    getSummary: async (params: { startDate: string; endDate: string }) => {
        const response = await api.get<ApiResponse<RevenueSummary>>('/finance/stats/summary', { params });
        return response.data.data;
    },
    getTrend: async (params: { startDate: string; endDate: string }) => {
        const response = await api.get<ApiResponse<TrendData[]>>('/finance/stats/trend', { params });
        return response.data.data;
    },
    getPaymentMethods: async (params: { startDate: string; endDate: string }) => {
        const response = await api.get<ApiResponse<PaymentMethodStats[]>>('/finance/stats/payment-methods', { params });
        return response.data.data;
    },
    getTransactions: async (params: { startDate: string; endDate: string; page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ApiResponse<TransactionList>>('/finance/stats/transactions', { params });
        return response.data.data;
    }
};

// Schedule API
export const scheduleApi = {
    // 1.1 Create Schedule
    create: async (command: CreateScheduleCommand) => {
        const response = await api.post<ApiResponse<ScheduleResult>>('/schedules', command);
        return response.data.data;
    },
    // 1.2 Update Schedule
    update: async (classSessionId: string, command: UpdateScheduleCommand) => {
        const response = await api.patch<ApiResponse<ScheduleResult>>(`/schedules/${classSessionId}`, command);
        return response.data.data;
    },
    // 1.3 Delete Schedule
    delete: async (classSessionId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/schedules/${classSessionId}`);
        return response.data.data;
    },
    // 1.4 Get Weekly Schedule (List)
    getList: async (startDate: string, endDate: string) => {
        const response = await api.get<ApiResponse<ScheduleResult[]>>('/schedules', {
            params: { startDate, endDate }
        });
        return response.data.data;
    },
    // 1.5 Get Detail
    getDetail: async (classSessionId: string) => {
        const response = await api.get<ApiResponse<ScheduleResult>>(`/schedules/${classSessionId}`);
        return response.data.data;
    },
};

// Room API
export const roomApi = {
    getAll: async () => {
        const response = await api.get<ApiResponse<RoomResult[]>>('/rooms');
        return response.data.data;
    },
    create: async (command: CreateRoomCommand) => {
        const response = await api.post<ApiResponse<RoomResult>>('/rooms', command);
        return response.data.data;
    },
    update: async (roomId: string, command: UpdateRoomCommand) => {
        const response = await api.patch<ApiResponse<RoomResult>>(`/rooms/${roomId}`, command);
        return response.data.data;
    },
    delete: async (roomId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/rooms/${roomId}`);
        return response.data; // Void response
    }
};

// Reservation API
export const reservationApi = {
    // 2.1 Create Reservation (Member)
    create: async (command: CreateReservationCommand) => {
        const response = await api.post<ApiResponse<ReservationResult>>('/reservations', command);
        return response.data.data;
    },
    // 2.2 Cancel Reservation
    cancel: async (reservationId: string) => {
        const response = await api.delete<ApiResponse<void>>(`/reservations/${reservationId}`);
        return response.data.data;
    },
    // 2.3 Get My Reservations (Member)
    getMyReservations: async () => {
        const response = await api.get<ApiResponse<ReservationResult[]>>('/reservations/me');
        return response.data.data;
    },
    // 2.4 Get Session Reservations (Admin/Instructor)
    getSessionReservations: async (classSessionId: string) => {
        const response = await api.get<ApiResponse<ReservationResult[]>>(`/reservations/sessions/${classSessionId}`);
        return response.data.data;
    },
    // Admin: Get All Reservations (Assumed/Missing Endpoint)
    getAll: async (params?: ReservationQuery) => {
        // [NOTE] This endpoint is not in the provided doc but required for ReservationManager
        const response = await api.get<ApiResponse<ReservationResult[]>>('/reservations', { params });
        return response.data.data;
    },
    // Admin: Update Attendance
    updateAttendance: async (reservationId: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOSHOW') => {
        const response = await api.patch<ApiResponse<void>>(`/reservations/${reservationId}/attendance`, { status });
        return response.data.data;
    },
    // Admin: Create Reservation
    createByAdmin: async (command: CreateReservationByAdminCommand) => {
        const response = await api.post<ApiResponse<ReservationResult>>('/reservations/admin', command);
        return response.data.data;
    }
};


export default api;

// --- React Query Hooks ---

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getMockStats, getRecentActivity, getCenterAlerts } from './mock-data'; // Temporary Import

export const queryKeys = {
    userProfile: ['user', 'profile'] as const,
    myOrganizations: ['organizations', 'my'] as const,
    organization: (id: number | string) => ['organization', id] as const,
    dashboard: {
        stats: (role: string) => ['dashboard', 'stats', role] as const,
        activity: (role: string) => ['dashboard', 'activity', role] as const,
        alerts: ['dashboard', 'alerts'] as const,
    },
    instructors: {
        pending: ['instructors', 'pending'] as const,
    }
};

/**
 * Hook to fetch current user profile with automatic caching
 */
export function useUserProfile(options?: Omit<UseQueryOptions<MeResult, Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.userProfile,
        queryFn: () => authApi.getMe(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        ...options,
    });
}

/**
 * Hook to fetch user's organizations with automatic caching
 */
export function useMyOrganizations(options?: Omit<UseQueryOptions<OrganizationResult[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.myOrganizations,
        queryFn: () => authApi.getMyOrganizations(),
        staleTime: 10 * 60 * 1000, // 10 minutes (organizations change less frequently)
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        ...options,
    });
}

// --- Dashboard Hooks ---

export function useDashboardStats(role: 'OWNER' | 'INSTRUCTOR', options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.dashboard.stats(role),
        queryFn: async () => {
            // Simulate API Network Delay
            await new Promise(resolve => setTimeout(resolve, 600));
            // In future: return authApi.getDashboardStats(role);
            return getMockStats();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        ...options
    });
}

export function useRecentActivity(role: 'OWNER' | 'INSTRUCTOR', options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.dashboard.activity(role),
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            return getRecentActivity(role);
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        ...options
    });
}

export function useCenterAlerts(options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.dashboard.alerts,
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return getCenterAlerts();
        },
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function usePendingInstructors(options?: Omit<UseQueryOptions<InstructorDto[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: queryKeys.instructors.pending,
        queryFn: () => authApi.getPendingInstructors(),
        staleTime: 2 * 60 * 1000,
        ...options
    });
}

// --- Member Ticket Hooks ---

export const memberTicketKeys = {
    all: ['memberTickets'] as const,
    detail: (id: string) => ['memberTickets', id] as const,
};

export function useMemberTickets(options?: Omit<UseQueryOptions<MemberTicketResult[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: memberTicketKeys.all,
        queryFn: memberTicketApi.getTickets,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useActiveInstructors(options?: Omit<UseQueryOptions<InstructorDto[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['instructors', 'active'] as const,
        queryFn: () => authApi.getActiveInstructors(),
        staleTime: 2 * 60 * 1000,
        ...options
    });
}

// --- Finance Hooks ---

export const financeKeys = {
    payments: ['payments'] as const,
    available: (membershipId: string) => ['payments', 'available', membershipId] as const,
    products: ['products'] as const,
};

export function usePayments(query?: PaymentQuery, options?: Omit<UseQueryOptions<Payment[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: query ? [...financeKeys.payments, query] : financeKeys.payments,
        queryFn: () => paymentApi.getAll(query),
        staleTime: 1 * 60 * 1000,
        ...options
    });
}

export function useAvailablePayments(membershipId: string, options?: Omit<UseQueryOptions<Payment[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: financeKeys.available(membershipId),
        queryFn: () => paymentApi.getAvailable(membershipId),
        enabled: !!membershipId, // Only fetch if membershipId is present
        staleTime: 0, // Always fresh for this critical UI
        ...options,
    });
}

// Stats Hooks
export function useFinanceStatsSummary(params: { startDate: string; endDate: string }, options?: Omit<UseQueryOptions<RevenueSummary, Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['finance', 'stats', 'summary', params],
        queryFn: () => financeApi.getSummary(params),
        enabled: !!params.startDate && !!params.endDate,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useFinanceStatsTrend(params: { startDate: string; endDate: string }, options?: Omit<UseQueryOptions<TrendData[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['finance', 'stats', 'trend', params],
        queryFn: () => financeApi.getTrend(params),
        enabled: !!params.startDate && !!params.endDate,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useFinanceStatsPaymentMethods(params: { startDate: string; endDate: string }, options?: Omit<UseQueryOptions<PaymentMethodStats[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['finance', 'stats', 'payment-methods', params],
        queryFn: () => financeApi.getPaymentMethods(params),
        enabled: !!params.startDate && !!params.endDate,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useFinanceStatsTransactions(params: { startDate: string; endDate: string; page?: number; limit?: number; search?: string }, options?: Omit<UseQueryOptions<TransactionList, Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['finance', 'stats', 'transactions', params],
        queryFn: () => financeApi.getTransactions(params),
        enabled: !!params.startDate && !!params.endDate,
        staleTime: 1 * 60 * 1000,
        ...options,
    });
}


// --- Member Hooks ---

export interface MembershipDto {
    id: string; // FIXED: string | number -> string (TSID safety)
    name: string;
    phone: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'INACTIVE' | 'WITHDRAWN';
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
    profileImageUrl?: string | null;
    pinnedNote?: string | null;
    lastAttendanceAt?: string;
    createdAt: string;
}

export interface MemberSearchQuery {
    status?: string; // Comma separated list
    search?: string;
}

export interface UpdateMemberCommand {
    name: string;
    phone: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
    status?: string;
    pinnedNote?: string;
}


export interface RegisterByStaffCommand {
    name: string;
    phone: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
    email?: string;
}

// Temporary imports until backend connected
import { getMockMembers, getMockTickets } from '@/features/members/model/mock-data';
import { Member, Ticket } from '@/features/members/model/types';

// Real API functions
export const memberApi = {
    getMembers: async (query?: MemberSearchQuery): Promise<MembershipDto[]> => {
        const response = await api.get<ApiResponse<MembershipDto[]>>('/memberships', {
            params: query
        });
        return response.data.data;
    },
    getMember: async (membershipId: string): Promise<MembershipDto> => {
        throw new Error("Get single member not explicitly documented yet");
    },
    updateMember: async (membershipId: string, command: UpdateMemberCommand): Promise<MembershipDto> => { // FIXED: ID type
        const response = await api.patch<ApiResponse<MembershipDto>>(`/memberships/${membershipId}`, command);
        return response.data.data;
    },
    createMember: async (command: JoinOrganizationCommand): Promise<SignUpResult> => {
        const response = await api.post<ApiResponse<SignUpResult>>('/memberships', command);
        return response.data.data;
    },
    registerByStaff: async (command: RegisterByStaffCommand): Promise<MembershipDto> => {
        const response = await api.post<ApiResponse<MembershipDto>>('/memberships/register', command);
        return response.data.data;
    },

    // Legacy/Mock methods for tickets until real ticket API is ready
    getTickets: async (): Promise<Ticket[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return getMockTickets();
    }
};

export const memberKeys = {
    all: ['members'] as const,
    detail: (id: string) => ['members', id] as const, // FIXED: ID type
    tickets: ['tickets'] as const,
    memberTickets: (memberId: string) => ['tickets', 'member', memberId] as const, // FIXED: ID type
};

export function useMembersList(options?: Omit<UseQueryOptions<MembershipDto[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: memberKeys.all,
        queryFn: () => memberApi.getMembers(),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useTicketsList(options?: Omit<UseQueryOptions<Ticket[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: memberKeys.tickets,
        queryFn: memberApi.getTickets,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

// --- Schedule Hooks ---
// Schedule API and Hooks moved to @/features/schedule

