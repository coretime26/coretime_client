export type UserRole = 'OWNER' | 'INSTRUCTOR' | 'MEMBER' | 'SYSTEM_ADMIN' | null;

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    organizationId?: string | null;
    status?: 'ACTIVE' | 'PENDING' | 'REJECTED';
    signupToken?: string;
    profileImageUrl?: string | null;
}
