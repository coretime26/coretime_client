'use client';

import { Container, Title, Text, Stack, Button, TextInput, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState, Suspense, useEffect } from 'react';
import { useAuth, UserRole } from '@/features/auth';
import { useSearchParams, useRouter } from 'next/navigation';

function ProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const useAuthContext = useAuth();

    // Get collected data from URL
    const role = searchParams.get('role') as UserRole;

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        const name = searchParams.get('name') || '';
        const email = searchParams.get('email') || '';
        const token = searchParams.get('signupToken');

        if (token) {
            console.log("ProfilePage: Captured signupToken from URL", token);
            sessionStorage.setItem('signupToken', token);
        }

        setProfile(prev => ({
            ...prev,
            name,
            email,
        }));
    }, [searchParams]);

    const handleBack = () => {
        router.back();
    };

    const handleComplete = async () => {
        if (!isProfileValid || !role) return;

        try {
            // 1. Store extra data needed for next step (Membership)
            sessionStorage.setItem('pendingRole', role);
            sessionStorage.setItem('pendingPhone', profile.phone);
            sessionStorage.setItem('pendingName', profile.name); // Maybe needed

            // 2. Perform Account Registration (SignUp)
            // Note: signupToken is already in AuthContext state or sessionStorage
            const token = searchParams.get('signupToken');
            if (token) {
                await useAuthContext.signUp({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    identity: role as 'OWNER' | 'INSTRUCTOR' | 'MEMBER',
                    signupToken: token
                });
            } else {
                // Fallback to context token logic if needed, but let's assume we pass it explicitly or it's handled by context
                // AuthContext's signUp needs the token in the command
                // Let's get it from session storage if not in URL
                const storedToken = sessionStorage.getItem('signupToken');
                if (!storedToken) {
                    alert('Session expired. Please start again.');
                    return;
                }
                await useAuthContext.signUp({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    identity: role as 'OWNER' | 'INSTRUCTOR' | 'MEMBER',
                    signupToken: storedToken
                });
            }

            // 3. Redirect to Membership Step
            if (role === 'OWNER') {
                router.push('/register/owner');
            } else if (role === 'INSTRUCTOR') {
                router.push('/register/instructor');
            }

        } catch (error) {
            console.error(error);
            // Handle error (e.g. email duplicate)
        }
    };

    const isProfileValid = profile.name.length > 0 && profile.email.length > 0 && profile.phone.length > 0;

    if (!role) {
        return (
            <Stack align="center" mt={50}>
                <Text>잘못된 접근입니다. 역할을 선택해주세요.</Text>
                <Button onClick={() => router.push('/identity')}>돌아가기</Button>
            </Stack>
        );
    }

    return (
        <Stack gap="xl" align="center" w="100%" maw={400}>
            <Stack align="center" gap="xs" w="100%">
                <Group w="100%" justify="flex-start">
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={handleBack} color="gray">
                        뒤로가기
                    </Button>
                </Group>
                <Title order={1}>기본 정보를 입력해주세요</Title>
                <Text c="dimmed">안전한 서비스 이용을 위해 정보가 필요합니다.</Text>
            </Stack>

            <Stack gap="md" w="100%">
                <TextInput
                    label="이름"
                    placeholder="홍길동"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.currentTarget.value })}
                />
                <TextInput
                    label="이메일"
                    placeholder="user@example.com"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.currentTarget.value })}
                // readOnly // Depending on requirements
                />
                <TextInput
                    label="휴대폰 번호"
                    placeholder="01012345678"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.currentTarget.value.replace(/[^\d]/g, '') })}
                />
            </Stack>

            <Button size="lg" fullWidth onClick={handleComplete} disabled={!isProfileValid}>
                다음으로 이동
            </Button>
        </Stack>
    );
}

export default function ProfilePage() {
    return (
        <Container size="sm" h="100vh" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Suspense fallback={<div>Loading...</div>}>
                <ProfileContent />
            </Suspense>
        </Container>
    );
}
