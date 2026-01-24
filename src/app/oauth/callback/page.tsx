'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingOverlay, Text, Center, Stack } from '@mantine/core';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useAuth(); // We might need a method to set tokens directly, or we can set them here.

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const signupToken = searchParams.get('signupToken');
        const isSignUpRequired = searchParams.get('isSignUpRequired') === 'true';

        // Also might receive user info for signup?
        const email = searchParams.get('email');
        const name = searchParams.get('name');

        if (accessToken && refreshToken) {
            // Case: Login Success
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Check auth to update context state
            checkAuth().then(() => {
                router.push('/');
            });
        }
        else if (isSignUpRequired && signupToken) {
            // Case: Needs Signup
            // We need to pass the signupToken and basics to the AuthContext or URL
            // Since AuthContext handles state, better to redirect to relevant page with params
            // or we set it in context (if provider exposes a setter). 
            // Currently our AuthContext has 'signupToken' state but no direct public setter exposed simply (except via login flow?).
            // Let's modify AuthContext or simply pass params to the /identity page.

            const params = new URLSearchParams();
            if (name) params.append('name', name);
            if (email) params.append('email', email);
            params.append('signupToken', signupToken);

            // We can perhaps start at /identity selection
            router.push(`/identity?${params.toString()}`);
        } else {
            // Error or invalid
            console.error('Invalid callback params', Object.fromEntries(searchParams.entries()));
            alert('로그인 처리 중 오류가 발생했습니다.');
            router.push('/login');
        }
    }, [searchParams, router, checkAuth]);

    return (
        <Center h="100vh">
            <Stack align="center">
                <LoadingOverlay visible={true} />
                <Text mt="xl">로그인 처리 중입니다...</Text>
            </Stack>
        </Center>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
