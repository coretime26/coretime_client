import axios, { AxiosError, InternalAxiosRequestConfig as OriginalInternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { notifications } from '@mantine/notifications';

// Extend the internal config type
export interface InternalAxiosRequestConfig extends OriginalInternalAxiosRequestConfig {
    _skipAuthRedirect?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1" || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    transformResponse: [
        (data) => {
            if (typeof data === 'string') {
                try {
                    // Regex to match large numbers (15+ digits) and wrap them in quotes
                    // Identifies: : 123456789012345678... followed by , } or ]
                    const transformed = data.replace(/:\s*(\d{15,})([,\}\]])/g, ': "$1"$2');
                    return JSON.parse(transformed);
                } catch (e) {
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

// --- Interceptors ---

// Request: Attach Access Token and Organization ID
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        if (config.headers && config.headers.Authorization) {
            return config;
        }

        const session = await getCachedSession();

        if (session?.accessToken) {
            if (!config.headers) {
                config.headers = {} as any;
            }
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

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
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // 1. Handle 403 Forbidden -> Access Denied
        if (error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                notifications.show({
                    title: '접근 권한 없음',
                    message: '해당 기능에 접근할 권한이 없습니다. 다시 로그인해 주세요.',
                    color: 'red',
                    autoClose: 3000
                });

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
