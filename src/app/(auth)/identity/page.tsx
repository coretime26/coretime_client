'use client';

import { Container, Title, Text, SimpleGrid, Paper, Stack, ThemeIcon } from '@mantine/core';
import { IconBuildingStore, IconUserScreen } from '@tabler/icons-react';
import { Suspense } from 'react';
import { UserRole, useAuth } from '@/features/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';

function IdentityContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    // 1. Handle Onboarding Token Injection (from Backend Redirect)
    useEffect(() => {
        const state = searchParams.get('state');
        const accessToken = searchParams.get('accessToken');

        if (state === 'onboarding' && accessToken) {
            console.log("IdentityPage: Detected Onboarding State. Injecting Token...");
            // Manually sign in to establish session with the temp token
            // This allows subsequent API calls (like getMe or register) to work
            signIn('credentials', {
                accessToken: accessToken,
                refreshToken: searchParams.get('refreshToken') || '', // Pass refreshToken if available
                redirect: false,
                id: 'temp-user', // Dummy ID, will be overwritten by getMe or subsequent logic
                role: 'TEMPUSER' // As per backend logic
            }).then((res) => {
                if (res?.error) {
                    console.error("IdentityPage: Failed to inject token", res.error);
                    notifications.show({ title: '오류', message: '인증 토큰 설정에 실패했습니다.', color: 'red' });
                } else {
                    console.log("IdentityPage: Token Injected Successfully");
                    // Optional: Reload or just let AuthContext sync
                }
            });
        }

        // 2. Handle Signup Token (if present, just logging for debug)
        const signupToken = searchParams.get('signupToken');
        if (signupToken) {
            sessionStorage.setItem('signupToken', signupToken);
        }
    }, [searchParams]);


    const { data: session } = useSession(); // Access session for token check

    const handleRoleSelect = async (role: UserRole) => {
        if (session?.accessToken) {
            sessionStorage.setItem('pendingRole', role || '');
            if (role === 'OWNER') {
                router.push('/register/owner');
            } else if (role === 'INSTRUCTOR') {
                router.push('/register/instructor');
            }
            return;
        }

        // Fallback: Check for onboarding state (e.g. if session is lagging but token was injected)
        const state = searchParams.get('state');
        if (state === 'onboarding') {
            sessionStorage.setItem('pendingRole', role || '');
            if (role === 'OWNER') {
                router.push('/register/owner');
            } else if (role === 'INSTRUCTOR') {
                router.push('/register/instructor');
            }
            return;
        }

        // Default: Proceed to Profile (User not found or not authenticated)
        console.log("Identity Check: Token not found, proceeding to profile.");

        // Construct new URL parameters for Profile Page
        const params = new URLSearchParams(searchParams.toString());
        if (role) {
            params.set('role', role);
        }

        router.push(`/register/profile?${params.toString()}`);
    };

    return (
        <Stack gap="xl" align="center" mb={50}>
            <Stack align="center" gap="xs">
                <Title order={1}>어떤 역할로 사용하시나요?</Title>
                <Text c="dimmed">서비스 이용을 위해 역할을 선택해주세요.</Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" w="100%">
                <IdentityCard
                    icon={<IconBuildingStore size={40} />}
                    title="센터장 (OWNER)"
                    description="센터를 직접 등록하고 강사 승인 및 운영 전반을 관리합니다."
                    onClick={() => handleRoleSelect('OWNER')}
                />
                <IdentityCard
                    icon={<IconUserScreen size={40} />}
                    title="강사 (INSTRUCTOR)"
                    description="초대 코드를 입력하여 센터에 소속되고 본인의 수업 일정을 관리합니다."
                    onClick={() => handleRoleSelect('INSTRUCTOR')}
                />
            </SimpleGrid>
        </Stack>
    );
}

export default function IdentitySelectionPage() {
    return (
        <Container size="sm" h="100vh" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Suspense fallback={<div>Loading...</div>}>
                <IdentityContent />
            </Suspense>
        </Container>
    );
}

interface IdentityCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

function IdentityCard({ icon, title, description, onClick }: IdentityCardProps) {
    return (
        <Paper
            p="xl"
            radius="md"
            withBorder
            onClick={onClick}
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
            // Add hover effect via sx or style
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'var(--mantine-color-indigo-6)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)'; // default border color
            }}
        >
            <Stack align="center" gap="md">
                <ThemeIcon
                    size={80}
                    radius="full"
                    variant="light"
                    color="indigo"
                >
                    {icon}
                </ThemeIcon>
                <Title order={3} size="h4">{title}</Title>
                <Text size="sm" c="dimmed" ta="center" style={{ lineHeight: 1.6 }}>
                    {description}
                </Text>
            </Stack>
        </Paper>
    )
}
