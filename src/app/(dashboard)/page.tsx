'use client';

import { useState, useEffect } from 'react';
import { Title, Container, Grid, SegmentedControl, Group, Text, Box, Stack } from '@mantine/core';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { InstructorApprovalList } from '@/components/dashboard/InstructorApprovalList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CenterAlerts } from '@/components/dashboard/CenterAlerts';
import {
    UserRole,
} from '@/lib/mock-data';
import {
    useDashboardStats,
    useRecentActivity,
    useCenterAlerts,
    usePendingInstructors
} from '@/lib/api';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

import { useAuth } from '@/features/auth';
import { LoadingOverlay, Button } from '@mantine/core';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function DashboardContent() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const [role, setRole] = useState<UserRole>('OWNER');

    useEffect(() => {
        if (user?.role) {
            setRole(user.role);
        }
    }, [user]);

    // Redirect to login if no organization (incomplete registration)
    useEffect(() => {
        if (!isAuthLoading && user && !user.organizationId) {
            logout(); // This handles signOut and redirect to /login
        }
    }, [user, isAuthLoading, logout]);

    // React Query Hooks
    const { data: stats, isLoading: isStatsLoading } = useDashboardStats(role as any, { enabled: !!user });
    const { data: pendingInstructors, isLoading: isInstructorsLoading } = usePendingInstructors({ enabled: !!user && role === 'OWNER' });
    const { data: activities, isLoading: isActivityLoading } = useRecentActivity(role as any, { enabled: !!user });
    const { data: alerts, isLoading: isAlertsLoading } = useCenterAlerts({ enabled: !!user });

    // Determine global loading state
    const isDashboardLoading = isStatsLoading || isActivityLoading || isAlertsLoading;

    if (isAuthLoading) return <LoadingOverlay visible />;

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

    // Safety check if user is logged in but has no role or organization
    if (!user.organizationId || !user.role) {
        return <LoadingOverlay visible />;
    }

    // Instead of replacing entire screen, we render header and then skeletons
    // if (isDashboardLoading) { return ... } // REMOVED

    return (
        <Container fluid p="md">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>대시보드</Title>
                    <Text c="dimmed" size="sm">
                        반갑습니다, {user.name} {role === 'OWNER' ? '원장님' : '강사님'}
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
                {isStatsLoading ? (
                    <DashboardSkeleton type="stats" />
                ) : (
                    stats && <StatsGrid role={role} data={stats} />
                )}
            </Box>

            {/* 2. Main Content Grid */}
            <Grid gutter="lg">

                {/* Left/Main Column */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    {/* Activity Log takes the main stage now */}
                    {isActivityLoading ? (
                        <DashboardSkeleton type="activity" />
                    ) : (
                        activities && <RecentActivity activities={activities} />
                    )}
                </Grid.Col>

                {/* Right/Side Column */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="lg">
                        {isAlertsLoading || isInstructorsLoading ? (
                            <DashboardSkeleton type="alerts" />
                        ) : (
                            role === 'OWNER' ? (
                                <>
                                    {pendingInstructors && <InstructorApprovalList instructors={pendingInstructors} />}
                                    {alerts && <CenterAlerts alerts={alerts} />}
                                </>
                            ) : (
                                alerts && <CenterAlerts alerts={alerts} />
                            )
                        )}
                    </Stack>
                </Grid.Col>

            </Grid>
        </Container>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingOverlay visible />}>
            <DashboardContent />
        </Suspense>
    );
}
