import { useSession, signIn, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from '@mantine/notifications';
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { JoinOrganizationCommand, RegisterOrganizationCommand, SignUpCommand } from "../api/auth.dto";
import { User, UserRole } from "../model/types";
import { useEffect } from "react";

// Helper to normalize role
const normalizeRole = (role: string | null | undefined): UserRole => {
    if (!role) return null;
    const normalized = role.replace('ROLE_', '');
    return normalized as UserRole;
};

export function useAuth() {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const store = useAuthStore();

    // Derived state
    const isLoadingSession = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    // 1. Query for Profile (Server State)
    // Only fetch if we have an access token
    const { data: profile, isLoading: isProfileLoading, refetch: loadProfile } = useQuery({
        queryKey: ['me', session?.user?.id],
        queryFn: async () => {
            // Pass explicit config to skip auth redirect loop if 401
            return authApi.getMe({ _skipAuthRedirect: true });
        },
        enabled: !!session?.user?.accessToken && isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 min
        retry: false
    });

    // 2. Compute Final User Object
    // Merge session user (basic) with profile (detailed)
    let user: User | null = null;

    if (session?.user) {
        user = {
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            role: normalizeRole(session.user.role),
            organizationId: session.user.organizationId,
            status: 'ACTIVE',
            profileImageUrl: session.user.image,
            signupToken: session.user.signupToken
        };

        if (profile) {
            user = {
                ...user,
                name: profile.name,
                role: normalizeRole(profile.identity),
                organizationId: profile.organizationId,
                profileImageUrl: profile.profileImageUrl || user.profileImageUrl
            };
        }
    }

    // 3. Sync Session Token to Store (Effect)
    useEffect(() => {
        if (session?.user?.signupToken) {
            store.setSignupToken(session.user.signupToken);
        } else {
            // Check sessionStorage restoration
            const storedToken = sessionStorage.getItem('signupToken');
            if (storedToken && !store.signupToken) {
                store.setSignupToken(storedToken);
            }
        }
    }, [session?.user?.signupToken, store.setSignupToken]);


    // 4. Actions
    const login = async (provider: 'kakao' | 'google') => {
        await signIn(provider, { callbackUrl: '/' });
    };

    const logout = async () => {
        store.reset();
        await signOut({ callbackUrl: '/login' });
        notifications.show({
            title: '로그아웃',
            message: '성공적으로 로그아웃되었습니다.',
            color: 'green',
        });
    };

    const signUp = async (data: SignUpCommand) => {
        const result = await authApi.signUp(data);
        // Login immediately with credentials provider to update session
        await signIn('credentials', {
            redirect: false,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            role: null,
            organizationId: result.organizationId,
        });
        store.reset(); // Clear signup data
    };

    const createOwnerOrganization = async (data: RegisterOrganizationCommand) => {
        const result = await authApi.registerOrganization(data);
        // Need to refresh profile/session to get the new organization ID?
        // Usually creation implies we skip to dashboard, but let's invalidate query
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        return result.organizationId;
    };

    const joinInstructorOrganization = async (data: JoinOrganizationCommand) => {
        await authApi.joinOrganization(data);
        await queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    const refreshUser = async () => {
        await loadProfile();
    };

    return {
        user,
        isLoading: isLoadingSession || (isAuthenticated && isProfileLoading && !profile), // Only loading if authenticating or fetching initial profile
        isAuthenticated,
        login,
        logout,
        signUp,
        createOwnerOrganization,
        joinInstructorOrganization,
        refreshUser,
        checkAuth: async () => { }, // No-op, handled by NextAuth

        // Expose store for backward compatibility or direct usage
        signupToken: store.signupToken,
        registrationData: store.registrationData,
        setRegistrationData: store.setRegistrationData,
    };
}
