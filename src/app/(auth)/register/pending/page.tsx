'use client';

import { Container, Paper, Title, Text, Stack, Button, ThemeIcon, Center } from '@mantine/core';
import { IconHourglassHigh } from '@tabler/icons-react';
import { useAuth } from '@/features/auth';

export default function PendingPage() {
    const { logout } = useAuth();

    return (
        <Container h="100vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper p="xl" radius="lg" withBorder shadow="sm" maw={400} w="100%">
                <Stack align="center" gap="lg">
                    <ThemeIcon size={80} radius="full" variant="light" color="orange">
                        <IconHourglassHigh size={40} />
                    </ThemeIcon>

                    <Stack gap="xs" align="center">
                        <Title order={2}>가입 신청 완료</Title>
                        <Text c="dimmed" ta="center" size="sm">
                            센터장님이 승인하면 서비스 이용이 가능합니다.<br />
                            잠시만 기다려 주세요.
                        </Text>
                    </Stack>

                    <Button variant="default" fullWidth onClick={logout}>
                        로그아웃
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
