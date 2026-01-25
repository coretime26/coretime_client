'use client';

import { Container, Paper, Title, Text, Button, Group, Stack, Box, Divider, Anchor, Modal, ScrollArea, Avatar, ThemeIcon } from '@mantine/core';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useDisclosure } from '@mantine/hooks';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { authApi, OrganizationResult, clearSessionCache } from '@/lib/api';
import { IconBuilding, IconCheck, IconPlus } from '@tabler/icons-react';
import { signIn } from 'next-auth/react';

// Custom Kakao Icon (SVG)
function KakaoIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M12 3C7.58 3 4 5.79 4 9.24C4 11.22 5.21 12.98 7.08 14.15L6.34 16.86C6.28 17.07 6.5 17.25 6.68 17.13L10.23 14.78C10.8 14.86 11.39 14.91 12 14.91C16.42 14.91 20 12.12 20 8.67C20 5.22 16.42 2.43 12 3Z" />
        </svg>
    );
}

// Official Google Icon (SVG)
function GoogleIcon(props: any) {
    return (
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    )
}

function LoginContent() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Help Modals
    const [termsOpened, { open: openTerms, close: closeTerms }] = useDisclosure(false);
    const [privacyOpened, { open: openPrivacy, close: closePrivacy }] = useDisclosure(false);
    const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false);

    // Pending Approval Modal
    const [pendingOpened, { open: openPending, close: closePending }] = useDisclosure(false);
    const [pendingOrgs, setPendingOrgs] = useState<OrganizationResult[]>([]);

    useEffect(() => {
        const state = searchParams.get('state');
        const accessToken = searchParams.get('accessToken');
        const orgIds = searchParams.getAll('organizationId'); // Handles multiple

        // Handle Pending Token Injection
        const handlePendingAuth = async () => {
            const isPendingState = state === 'pending' || state === 'waiting_for_approval';

            if (isPendingState && accessToken) {
                console.log("LoginPage: Detected Pending State. Injecting Token...");

                // CRITICAL: Wait for signIn to complete before making API calls
                await signIn('credentials', {
                    accessToken: accessToken,
                    refreshToken: searchParams.get('refreshToken') || '', // Pass refreshToken if available
                    redirect: false,
                    id: 'temp-user',
                    role: 'TEMPUSER'
                });

                // Give NextAuth time to update the session (small delay to ensure session is ready)
                await new Promise(resolve => setTimeout(resolve, 100));

                // CRITICAL: Clear the session cache to force fresh session fetch
                clearSessionCache();

                console.log("LoginPage: Token injection complete, session cache cleared");
            }

            // After auth injection (or if not needed), fetch orgs
            if (isPendingState && orgIds.length > 0) {
                await fetchPendingOrgs(orgIds);
            }
        };

        const fetchPendingOrgs = async (ids: string[]) => {
            try {
                // Deduplicate IDs
                const uniqueIds = Array.from(new Set(ids));

                console.log("LoginPage: Fetching organizations with authenticated session...");
                // Use the new batch API - now the session should have the token
                const results = await authApi.getOrganizations(uniqueIds);
                setPendingOrgs(results);
                openPending();
            } catch (error) {
                console.error("Failed to fetch pending organizations", error);
                openPending();
            }
        };

        handlePendingAuth();
    }, [searchParams]);

    const handleRegisterNew = () => {
        router.push('/identity');
    };

    const handlePendingClose = () => {
        closePending();
        // Clear query params so it doesn't show again on refresh or re-render
        // unless the user triggers login again and gets redirected back.
        router.replace('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff', // Pure white based on modern trends + matching logo background
            position: 'relative',
        }}>

            <Container size="xs" w={400} px="md" style={{ zIndex: 1 }}>
                <Stack align="center" gap={40}>

                    {/* Brand Logo - Centered */}
                    <Stack align="center" gap="xs">
                        <BrandLogo size="xl" />
                        <Title order={2} size={16} fw={500} c="dimmed" ta="center" style={{ letterSpacing: '-0.3px', marginTop: 4 }}>
                            센터 운영의 모든 것
                        </Title>
                    </Stack>

                    {/* Main Actions */}
                    <Stack w="100%" gap={12}>
                        {/* Kakao Button */}
                        <Button
                            fullWidth
                            h={48}
                            bg="#FEE500"
                            c="#191919"
                            component="a"
                            href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao?clientUrl=${process.env.NEXT_PUBLIC_CLIENT_URL}`}
                            leftSection={<KakaoIcon style={{ width: 18, height: 18, position: 'relative', top: 1 }} />}
                            radius="md"
                            styles={{
                                root: { border: 'none' },
                                label: { fontWeight: 600, fontSize: '15px' },
                                inner: { justifyContent: 'center' }
                            }}
                        >
                            카카오로 시작하기
                        </Button>

                        {/* Google Button */}
                        <Button
                            fullWidth
                            h={48}
                            bg="#ffffff"
                            c="#3c4043"
                            component="a"
                            href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google?&clientUrl=${process.env.NEXT_PUBLIC_CLIENT_URL}`}
                            leftSection={<GoogleIcon style={{ width: 20, height: 20, position: 'relative', top: 0 }} />}
                            radius="md"
                            variant="default"
                            styles={{
                                root: { borderColor: '#dadce0' },
                                label: { fontWeight: 500, fontSize: '15px', fontFamily: 'Roboto, sans-serif' },
                                inner: { justifyContent: 'center' }
                            }}
                        >
                            Google 계정으로 시작하기
                        </Button>
                    </Stack>

                    {/* Simplified Footer / Links */}
                    <Group justify="center" gap="md">
                        <Anchor c="gray.5" size="xs" onClick={openTerms} underline="hover">이용약관</Anchor>
                        <Divider orientation="vertical" h={10} color="gray.3" />
                        <Anchor c="gray.5" size="xs" onClick={openPrivacy} underline="hover">개인정보처리방침</Anchor>
                        <Divider orientation="vertical" h={10} color="gray.3" />
                        <Anchor c="gray.5" size="xs" onClick={openHelp} underline="hover">문의하기</Anchor>
                    </Group>

                    <Text c="gray.3" size="xs" ta="center">
                        © 2026 CoreTime Inc.
                    </Text>
                </Stack>
            </Container>

            {/* Modals */}
            <Modal opened={termsOpened} onClose={closeTerms} title="이용약관">
                <Text size="sm" c="dimmed">서비스 이용약관 내용이 여기에 표시됩니다.</Text>
            </Modal>
            <Modal opened={privacyOpened} onClose={closePrivacy} title="개인정보처리방침">
                <Text size="sm" c="dimmed">개인정보처리방침 내용이 여기에 표시됩니다.</Text>
            </Modal>
            <Modal opened={helpOpened} onClose={closeHelp} title="문의하기">
                <Text size="sm" c="dimmed">고객센터 연락처: support@coretime.com</Text>
            </Modal>

            {/* Pending Approval Modal */}
            <Modal
                opened={pendingOpened}
                onClose={handlePendingClose}
                title="승인 대기 중"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        다음 센터의 가입 승인을 기다리고 있습니다.<br />
                        승인이 완료되면 알림을 보내드립니다.
                    </Text>

                    <ScrollArea h={pendingOrgs.length > 3 ? 200 : 'auto'}>
                        <Stack gap="sm">
                            {pendingOrgs.length > 0 ? pendingOrgs.map(org => (
                                <Paper key={org.id} withBorder p="md" radius="md" bg="gray.0">
                                    <Group>
                                        <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
                                            <IconBuilding size={18} />
                                        </ThemeIcon>
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" fw={600}>{org.name}</Text>
                                            <Text size="xs" c="dimmed">{org.address}</Text>
                                        </div>
                                        {org.status === 'ACTIVE' ? (
                                            <Text size="xs" fw={700} c="indigo">강사 승인 대기</Text>
                                        ) : (
                                            <Text size="xs" fw={700} c="orange">센터 승인 대기</Text>
                                        )}
                                    </Group>
                                </Paper>
                            )) : (
                                // Fallback if details couldn't be fetched
                                Array.from(new Set(searchParams.getAll('organizationId'))).map(id => (
                                    <Paper key={id} withBorder p="md" radius="md" bg="gray.0">
                                        <Group>
                                            <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
                                                <IconBuilding size={18} />
                                            </ThemeIcon>
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={600}>센터 ID: {id}</Text>
                                                <Text size="xs" c="dimmed">상세 정보를 불러올 수 없습니다.</Text>
                                            </div>
                                            <Text size="xs" fw={700} c="orange">승인 대기</Text>
                                        </Group>
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    </ScrollArea>

                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="light"
                            color="indigo"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={handleRegisterNew}
                        >
                            새로 등록하기
                        </Button>
                        <Button onClick={handlePendingClose}>확인</Button>
                    </Group>
                </Stack>
            </Modal>


        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
