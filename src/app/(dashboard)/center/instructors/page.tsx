'use client';

import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Tabs,
    Text,
    Stack,
    Group,
    Modal,
    Button,
    TextInput,
    Textarea,
    Alert,
    LoadingOverlay
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUserCheck,
    IconSettings,
    IconAlertTriangle
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

    // Modal States
    const [selectedInstructor, setSelectedInstructor] = useState<InstructorDto | null>(null);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [suspendOpened, { open: openSuspend, close: closeSuspend }] = useDisclosure(false);
    const [withdrawOpened, { open: openWithdraw, close: closeWithdraw }] = useDisclosure(false);

    // Edit Form State (Mock for now as API is missing)
    const [editForm, setEditForm] = useState({ name: '', phone: '', memo: '' });

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
        setSelectedInstructor(instructor);
        if (type === 'suspend') {
            openSuspend();
        } else if (type === 'withdraw') {
            openWithdraw();
        } else if (type === 'activate') {
            statusMutation.mutate({ membershipId: instructor.membershipId, status: 'ACTIVE' });
        }
    };

    const handleEdit = (instructor: InstructorDto) => {
        setSelectedInstructor(instructor);
        setEditForm({
            name: instructor.name,
            phone: instructor.phone,
            memo: instructor.memo || ''
        });
        openEdit();
    };

    const confirmSuspend = () => {
        if (!selectedInstructor) return;
        statusMutation.mutate({ membershipId: selectedInstructor.membershipId, status: 'INACTIVE' }, {
            onSuccess: () => closeSuspend()
        });
    };

    const confirmWithdraw = () => {
        if (!selectedInstructor) return;
        statusMutation.mutate({ membershipId: selectedInstructor.membershipId, status: 'WITHDRAWN' }, {
            onSuccess: () => closeWithdraw()
        });
    };

    const saveEdit = () => {
        // TODO: Implement API for updating instructor info
        notifications.show({
            title: '준비 중',
            message: '강사 정보 수정 기능은 아직 API가 연동되지 않았습니다.',
            color: 'orange'
        });
        closeEdit();
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
                        onEdit={handleEdit}
                    />
                )}

                {/* --- Modals --- */}

                {/* 1. Edit Modal */}
                <Modal opened={editOpened} onClose={closeEdit} title="강사 정보 수정">
                    <Stack>
                        <TextInput
                            label="이름"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
                        />
                        <TextInput
                            label="연락처"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.currentTarget.value })}
                        />
                        <Textarea
                            label="메모"
                            value={editForm.memo}
                            onChange={(e) => setEditForm({ ...editForm, memo: e.currentTarget.value })}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeEdit}>취소</Button>
                            <Button onClick={saveEdit}>저장</Button>
                        </Group>
                    </Stack>
                </Modal>

                {/* 2. Suspend Modal */}
                <Modal opened={suspendOpened} onClose={closeSuspend} title="강사 일시정지">
                    <Stack>
                        <Text size="sm">
                            <Text span fw={700}>{selectedInstructor?.name}</Text> 강사의 계정을 일시정지 상태로 변경하시겠습니까?
                            <br />
                            일시정지 중에는 시스템 접속이 제한됩니다.
                        </Text>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeSuspend}>취소</Button>
                            <Button color="orange" onClick={confirmSuspend} loading={statusMutation.isPending}>일시정지 처리</Button>
                        </Group>
                    </Stack>
                </Modal>

                {/* 3. Withdraw Modal */}
                <Modal opened={withdrawOpened} onClose={closeWithdraw} title="강사 퇴사 처리" color="red">
                    <Stack>
                        <Alert variant="light" color="red" icon={<IconAlertTriangle size={16} />}>
                            주의: 퇴사 처리는 신중하게 진행해야 합니다.
                        </Alert>
                        <Text size="sm">
                            <Text span fw={700}>{selectedInstructor?.name}</Text> 강사를 퇴사 처리하시겠습니까?
                            <br />
                            퇴사 처리 시 해당 강사는 더 이상 목록에 표시되지 않거나 비활성화되며, 시스템 접속이 영구적으로 차단됩니다.
                        </Text>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeWithdraw}>취소</Button>
                            <Button color="red" onClick={confirmWithdraw} loading={statusMutation.isPending}>퇴사 처리</Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
}
