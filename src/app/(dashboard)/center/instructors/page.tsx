'use client';

import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Tabs,
    Text,
    Stack,
    Group
} from '@mantine/core';
import {
    IconUserCheck,
    IconSettings
} from '@tabler/icons-react';
import { useActiveInstructors, usePendingInstructors, authApi, InstructorDto } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import InstructorList from '@/components/dashboard/center/InstructorList';
import InstructorManagement from '@/components/dashboard/center/InstructorManagement';

export default function InstructorManagementPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'list';
    const [activeTab, setActiveTab] = useState<string | null>(initialTab);

    // Sync tab when searchParams change (sidebar link clicks)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== 'list') {
            setActiveTab('list');
        }
    }, [searchParams]);

    const queryClient = useQueryClient();

    // Queries
    const { data: activeInstructors = [], isLoading: isLoadingActive } = useActiveInstructors();
    const { data: pendingInstructors = [], isLoading: isLoadingPending } = usePendingInstructors();

    // Mutations
    const approveMutation = useMutation({
        mutationFn: ({ membershipId, isApproved }: { membershipId: string; isApproved: boolean }) =>
            authApi.updateMembershipStatus(membershipId, isApproved),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            notifications.show({
                title: '처리 완료',
                message: variables.isApproved ? '강사 승인이 완료되었습니다' : '강사 신청이 거절되었습니다',
                color: variables.isApproved ? 'green' : 'gray'
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '오류',
                message: error.response?.data?.error?.message || '처리 중 오류가 발생했습니다',
                color: 'red'
            });
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ membershipId, status }: { membershipId: string; status: string }) =>
            authApi.updateInstructorStatus(membershipId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            notifications.show({
                title: '성공',
                message: '강사 상태가 변경되었습니다',
                color: 'green'
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '오류',
                message: error.response?.data?.error?.message || '처리 중 오류가 발생했습니다',
                color: 'red'
            });
        }
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => authApi.registerInstructor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            notifications.show({
                title: '등록 완료',
                message: '강사가 성공적으로 등록되었습니다.',
                color: 'green'
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '오류',
                message: error.response?.data?.error?.message || '강사 등록 중 오류가 발생했습니다',
                color: 'red'
            });
        }
    });

    // Handlers
    const handleAction = (type: 'suspend' | 'withdraw' | 'activate', instructor: InstructorDto) => {
        if (type === 'suspend') {
            if (confirm(`${instructor.name} 강사를 일시정지 하시겠습니까?`)) {
                statusMutation.mutate({ membershipId: instructor.membershipId, status: 'INACTIVE' });
            }
        } else if (type === 'withdraw') {
            if (confirm(`[주의] ${instructor.name} 강사를 퇴사 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                statusMutation.mutate({ membershipId: instructor.membershipId, status: 'WITHDRAWN' });
            }
        } else if (type === 'activate') {
            statusMutation.mutate({ membershipId: instructor.membershipId, status: 'ACTIVE' });
        }
    };

    // Determine View Mode
    const isManagementView = activeTab === 'management';

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" mb="md">
                    <div>
                        <Title order={2}>
                            {isManagementView ? '강사 등록 및 승인' : '강사 조회'}
                        </Title>
                        <Text size="sm" c="dimmed">
                            {isManagementView
                                ? '새로운 강사를 직접 등록하거나 가입 신청을 승인합니다.'
                                : '센터의 소속 강사진을 조회하고 상태를 관리합니다.'}
                        </Text>
                    </div>
                </Group>

                {isManagementView ? (
                    <InstructorManagement
                        pendingInstructors={pendingInstructors}
                        isLoadingPending={isLoadingPending}
                        onRegister={(data) => registerMutation.mutate(data)}
                        isRegistering={registerMutation.isPending}
                        onApprove={(instructor) => approveMutation.mutate({ membershipId: instructor.membershipId, isApproved: true })}
                        onReject={(instructor) => approveMutation.mutate({ membershipId: instructor.membershipId, isApproved: false })}
                    />
                ) : (
                    <InstructorList
                        instructors={activeInstructors}
                        isLoading={isLoadingActive}
                        onAction={handleAction}
                    />
                )}
            </Stack>
        </Container>
    );
}
