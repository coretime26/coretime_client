
'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoadingOverlay, Text, Center, Stack } from '@mantine/core';

// atob를 대체하는 안정적인 JWT 디코딩 (유니코드 대응)
const safeDecode = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    } catch (e) {
        console.error('JWT Decode Error:', e);
        return null;
    }
};

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const organizationId = searchParams.get('organizationId');

        // [핵심] 진입하자마자 URL 파라미터부터 즉시 제거
        if (accessToken) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (accessToken && refreshToken) {
            hasProcessed.current = true;

            const decoded = safeDecode(accessToken);
            if (!decoded) {
                router.replace('/login?error=InvalidToken');
                return;
            }

            signIn('credentials', {
                accessToken,
                refreshToken,
                organizationId: organizationId || '',
                accountId: decoded.sub || '',
                email: decoded.email || '',
                name: decoded.name || '',
                role: decoded.role || '',
                redirect: false // 직접 리다이렉트 제어
            }).then((result) => {
                if (result?.error) {
                    // 크롬에서 "This Message..." 에러가 나면 일로 빠짐
                    console.error('SignIn Failed:', result.error);
                    router.replace('/login?error=AuthError');
                } else {
                    // 성공 시 대시보드(/)로 강제 이동 및 갱신
                    router.push('/');
                    router.refresh();
                }
            }).catch(() => {
                router.replace('/login');
            });
        }
    }, [searchParams, router]);

    return (
        <Center h="100vh">
            <Stack align="center">
                <LoadingOverlay visible={true} overlayProps={{ blur: 2 }} />
                <Text mt="xl" fw={500}>인증 정보를 확인 중입니다...</Text>
            </Stack>
        </Center>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingOverlay visible />}>
            <CallbackContent />
        </Suspense>
    );
}
