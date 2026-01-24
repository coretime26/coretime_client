'use client';

import { useState, useEffect } from 'react';
import { Title, Container, Grid, SegmentedControl, Group, Text, Box, Stack } from '@mantine/core';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { InstructorApprovalList } from '@/components/dashboard/InstructorApprovalList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CenterAlerts } from '@/components/dashboard/CenterAlerts';
import {
    UserRole,
    getMockStats,
    getPendingInstructors,
    getRecentActivity,
    getCenterAlerts
} from '@/lib/mock-data';

import { useAuth } from '@/context/AuthContext';
import { LoadingOverlay, Button } from '@mantine/core';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const [role, setRole] = useState<UserRole>('OWNER');

    useEffect(() => {
        if (user?.role) {
            setRole(user.role);
        }
    }, [user]);

    // Load mock data
    const stats = getMockStats();
    const pendingInstructors = getPendingInstructors();
    const activities = getRecentActivity(role);
    const alerts = getCenterAlerts();

    if (isLoading) return <LoadingOverlay visible />;

    if (!user) {
        return (
            <Container p="xl">
                <Stack align="center" mt="xl">
                    <Text>로그인이 필요합니다.</Text>
                    <Button component="a" href="/login">로그인 하기</Button>
                </Stack>
            </Container>
        );
    }

    // Safety check if user is logged in but has no role (registration incomplete)
    if (!user.role) {
        // Should redirect or show something else
        return (
            <Container p="xl">
                <Text>회원가입이 완료되지 않았습니다.</Text>
            </Container>
        )
    }

    return (
        <Container fluid p="md">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>대시보드</Title>
                    <Text c="dimmed" size="sm">
                        반갑습니다, {role === 'OWNER' ? '맹성철 원장님' : '김필라 강사님'}
                    </Text>
                </div>
                <Group>
                    <Text size="sm" fw={500}>View as:</Text>
                    <SegmentedControl
                        value={role}
                        onChange={(value) => setRole(value as UserRole)}
                        data={[
                            { label: '센터장(Owner)', value: 'OWNER' },
                            { label: '강사(Instructor)', value: 'INSTRUCTOR' },
                        ]}
                    />
                </Group>
            </Group>

            {/* 1. Top Stats Grid */}
            <Box mb="lg">
                <StatsGrid role={role} data={stats} />
            </Box>

            {/* 2. Main Content Grid */}
            <Grid gutter="lg">

                {/* Left/Main Column */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    {/* Activity Log takes the main stage now */}
                    <RecentActivity activities={activities} />
                </Grid.Col>

                {/* Right/Side Column */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="lg">
                        {role === 'OWNER' ? (
                            <>
                                <InstructorApprovalList instructors={pendingInstructors} />
                                <CenterAlerts alerts={alerts} />
                            </>
                        ) : (
                            <CenterAlerts alerts={alerts} />
                        )}
                    </Stack>
                </Grid.Col>

            </Grid>
        </Container>
    );
}
