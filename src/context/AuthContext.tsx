'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, clearTokens, OAuth2LoginCommand, SignUpCommand } from '@/lib/api';

export type UserRole = 'OWNER' | 'INSTRUCTOR' | 'MEMBER' | 'SYSTEM_ADMIN' | null;

interface User {
    id: number | string;
    name: string;
    email: string; // Keeping email for app compatibility, but might be empty if backend doesn't send it
    phone?: string;
    role: UserRole;
    organizationId?: number | null;
    status?: 'ACTIVE' | 'PENDING' | 'REJECTED';
    signupToken?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (provider: 'kakao' | 'google') => Promise<void>;
    logout: () => void;
    signupToken: string | null;
    registrationData: Partial<SignUpCommand> | null;
    setRegistrationData: (data: Partial<SignUpCommand> | null) => void;
    registerOwner: (data: Omit<SignUpCommand, 'signupToken' | 'identity'>, shouldRedirect?: boolean) => Promise<void>;
    registerInstructor: (data: Omit<SignUpCommand, 'signupToken' | 'identity'>, shouldRedirect?: boolean) => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [signupToken, setSignupToken] = useState<string | null>(null);
    // Registration State
    const [registrationData, setRegistrationData] = useState<Partial<SignUpCommand> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check auth on mount
    useEffect(() => {
        // Handle URL Tokens (if redirected to root)
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const organizationId = params.get('organizationId');
        const signupTokenUrl = params.get('signupToken');
        const isSignUpRequired = params.get('isSignUpRequired') === 'true';

        if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            if (organizationId) {
                localStorage.setItem('organizationId', organizationId);
            }
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuth();
        } else if (isSignUpRequired && signupTokenUrl) {
            // Pass params to identity page
            const name = params.get('name');
            const email = params.get('email');
            const nextParams = new URLSearchParams();
            if (name) nextParams.append('name', name);
            if (email) nextParams.append('email', email);
            nextParams.append('signupToken', signupTokenUrl);

            router.push(`/identity?${nextParams.toString()}`);
            setIsLoading(false); // Stop loading to allow redirect
        } else {
            checkAuth();
        }
    }, []);

    const checkAuth = async () => {
        try {
            const me = await authApi.getMe();
            console.log('[Auth] User Identity:', me.identity); // Debug log

            setUser({
                id: me.accountId,
                name: me.name,
                email: '', // Backend MeResult DTO does not have email.
                role: me.identity as UserRole, // Direct mapping as requested
                status: 'ACTIVE',
                organizationId: me.organizationId
            });
        } catch (error) {
            // Check if existing tokens are invalid
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Token existed but getMe failed (expired/invalid)
                // Optionally clear tokens here if we want to force logout on any error
            }
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (provider: 'kakao' | 'google') => {
        setIsLoading(true);
        try {
            // NOTE: In a real app, you would use the Provider SDK (e.g. window.Kakao.Auth.login) to get the providerId/email.
            // Since we don't have the SDK setup here, we will simulate the *result* of that SDK call
            // and then pass it to our backend.

            // SIMULATED PROVIDER RESPONSE
            const mockProviderResponse: OAuth2LoginCommand = {
                provider,
                providerId: `mock_${provider}_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                username: '테스트유저',
                avatarUrl: 'https://via.placeholder.com/150'
            };

            const response = await authApi.login(mockProviderResponse);

            if (response.isSignUpRequired && response.signupToken) {
                // Case 1: New User -> Go to Sign Up
                setSignupToken(response.signupToken);
                // Redirect to identity selection or generic register page
                // We pass the name/email via query params or context. Context is cleaner.
                // But current pages expect query params? Let's check.
                // For now, redirect to identity selection
                router.push(`/identity?name=${encodeURIComponent(mockProviderResponse.username)}&email=${encodeURIComponent(mockProviderResponse.email)}`);
            } else if (response.accessToken && response.refreshToken) {
                // Case 2: Existing User -> Login Success
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);

                // Fetch full user info
                await checkAuth();
                router.push('/');
            }
        } catch (error) {
            console.error('Login failed', error);
            alert('로그인에 실패했습니다. (백엔드 연결 확인 필요)');
        } finally {
            setIsLoading(false);
        }
    };

    const registerOwner = async (data: Omit<SignUpCommand, 'signupToken' | 'identity'>, shouldRedirect: boolean = true) => {
        if (!signupToken) {
            alert('회원가입 토큰이 없습니다. 다시 로그인해주세요.');
            router.push('/login');
            return;
        }

        try {
            const result = await authApi.signUp({
                ...data,
                signupToken,
                identity: 'OWNER'
            });

            handleSignUpSuccess(result, shouldRedirect);
        } catch (error) {
            console.error('Owner registration failed', error);
            throw error;
        }
    };

    const registerInstructor = async (data: Omit<SignUpCommand, 'signupToken' | 'identity'>, shouldRedirect: boolean = true) => {
        if (!signupToken) {
            alert('회원가입 토큰이 없습니다. 다시 로그인해주세요.');
            router.push('/login');
            return;
        }

        try {
            const result = await authApi.signUp({
                ...data,
                signupToken,
                identity: 'INSTRUCTOR' // Mapping to 'INSTRUCTOR' as per spec/frontend
            });
            handleSignUpSuccess(result, shouldRedirect);
        } catch (error) {
            console.error('Instructor registration failed', error);
            throw error;
        }
    };

    const handleSignUpSuccess = (result: { accessToken: string; refreshToken: string; status: string }, shouldRedirect: boolean = true) => {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);

        if (shouldRedirect) {
            if (result.status === 'PENDING_APPROVAL') {
                router.push('/register/pending');
            } else {
                // Refresh me and go home
                checkAuth().then(() => router.push('/'));
            }
        }
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            signupToken,
            registrationData,
            setRegistrationData,
            registerOwner,
            registerInstructor,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
