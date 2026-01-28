import { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/features/auth/api/auth.api";

/**
 * 유니코드를 지원하는 안정적인 JWT 디코딩 함수
 */
function decodeJwt(token: string) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// NextAuth 내부 타입 확장 (organizationId 등 추가)
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
        error?: string;
        user: {
            id?: string;
            role?: string;
            organizationId?: string; // TSID 대응을 위한 string
            signupToken?: string;
            isSignUpRequired?: boolean;
        } & User;
    }
    interface User {
        id: string;
        role?: string;
        accessToken?: string;
        refreshToken?: string;
        signupToken?: string;
        isSignUpRequired?: boolean;
        organizationId?: string; // TSID 대응을 위한 string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        name?: string;
        email?: string;
        accessToken?: string;
        refreshToken?: string;
        role?: string;
        organizationId?: string; // TSID 대응을 위한 string
        signupToken?: string;
        isSignUpRequired?: boolean;
        expiresAt?: number;
        error?: "RefreshAccessTokenError";
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                accessToken: { label: "Access Token", type: "text" },
                refreshToken: { label: "Refresh Token", type: "text" },
                role: { label: "Role", type: "text" },
                signupToken: { label: "Signup Token", type: "text" },
                accountId: { label: "Account ID", type: "text" },
                organizationId: { label: "Organization ID", type: "text" },
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "text" }
            },
            async authorize(credentials) {
                if (credentials?.accessToken) {
                    return {
                        id: credentials.accountId || "manual-update",
                        accessToken: credentials.accessToken,
                        refreshToken: credentials.refreshToken || "",
                        role: credentials.role,
                        signupToken: credentials.signupToken,
                        // TSID 보호를 위해 Number() 변환 없이 String 유지
                        organizationId: credentials.organizationId ? String(credentials.organizationId) : undefined,
                        name: credentials.name,
                        email: credentials.email,
                    } as User;
                }
                return null;
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'credentials') return true;

            if (account && (account.provider === 'google' || account.provider === 'kakao')) {
                try {
                    const loginCommand = {
                        provider: account.provider as 'google' | 'kakao',
                        providerId: account.providerAccountId,
                        email: user.email || "",
                        username: user.name || "Unknown",
                        avatarUrl: user.image || "",
                    };

                    const response = await authApi.login(loginCommand);

                    user.accessToken = response.accessToken;
                    user.refreshToken = response.refreshToken;
                    user.isSignUpRequired = response.isSignUpRequired;
                    user.signupToken = response.signupToken;

                    if (response.accountId) user.id = String(response.accountId);
                    if (response.identity) user.role = response.identity;
                    if (response.organizationId) user.organizationId = String(response.organizationId);

                    return true;
                } catch (error) {
                    console.error("Backend login failed during NextAuth signIn", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user && account) {
                const decoded = user.accessToken ? decodeJwt(user.accessToken) : null;
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    role: user.role,
                    organizationId: user.organizationId,
                    signupToken: user.signupToken,
                    isSignUpRequired: user.isSignUpRequired,
                    expiresAt: decoded?.exp ? decoded.exp * 1000 : Date.now() + (60 * 60 * 1000),
                } as any;
            }

            if (token.expiresAt && Date.now() < token.expiresAt) {
                return token;
            }

            try {
                if (!token.refreshToken || !token.accessToken) throw new Error("No tokens");
                const result = await authApi.reissue({
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken
                });

                const decoded = result.accessToken ? decodeJwt(result.accessToken) : null;
                return {
                    ...token,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresAt: decoded?.exp ? decoded.exp * 1000 : Date.now() + (60 * 60 * 1000),
                };
            } catch (error) {
                console.error("Error refreshing Access Token", error);
                return { ...token, error: "RefreshAccessTokenError" as const };
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            session.user.id = token.id || "";
            session.user.role = token.role;
            session.user.organizationId = token.organizationId;
            session.user.isSignUpRequired = token.isSignUpRequired;
            session.user.signupToken = token.signupToken;
            return session;
        }
    },
    pages: { signIn: '/login', error: '/login' },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET || "changeme_dev_secret",
};
