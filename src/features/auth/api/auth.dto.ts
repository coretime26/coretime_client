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
    status: 'ACTIVE' | 'PENDING' | 'PENDING_APPROVAL' | 'REJECTED';
}

// Wrapper types for API responses
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
    code: string;
    message: string;
}

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
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'WITHDRAWN';
    profileImageUrl?: string | null;
    joinedAt?: string;
}
