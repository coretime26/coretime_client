'use client';

import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Text,
    Stack,
    Group,
    Modal,
    Button,
    TextInput,
    Textarea,
    Alert,
    LoadingOverlay,
    Select,
    Grid,
    Divider,
    Drawer,
    Avatar,
    Box,
    Card,
    Badge,
    Tabs,
    ActionIcon
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUserCheck,
    IconSettings,
    IconAlertTriangle,
    IconEdit,
    IconNotes
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
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

    // Edit Form State (memo removed - handled separately in drawer)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        gender: null as 'MALE' | 'FEMALE' | null,
        birthDate: null as string | null  // YYYY-MM-DD format as string or null
    });

    // Phone number formatting helper
    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const numbers = value.replace(/[^\d]/g, '');

        // Format as 010-XXX-XXXX or 010-XXXX-XXXX
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else if (numbers.length <= 10) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

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
            name: instructor.name || '',
            email: instructor.email || '',
            phone: instructor.phone ? formatPhoneNumber(instructor.phone) : '',
            gender: instructor.gender || null,
            birthDate: instructor.birthDate || null
        });
        openEdit();
    };

    const handleRowClick = (instructor: InstructorDto) => {
        setSelectedInstructor(instructor);
        openDrawer();
    };

    const confirmSuspend = () => {
        if (!selectedInstructor) return;
        statusMutation.mutate({ membershipId: selectedInstructor.membershipId, status: 'INACTIVE' }, {
            onSuccess: () => closeSuspend()
        });
    };

    const confirmWithdraw = () => {
        if (!selectedInstructor) return;

        authApi.resignInstructor(selectedInstructor.membershipId)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['instructors'] });
                notifications.show({
                    title: '처리 완료',
                    message: '강사 퇴사 처리가 완료되었습니다.',
                    color: 'green'
                });
                closeWithdraw();
            })
            .catch((error: any) => {
                notifications.show({
                    title: '오류',
                    message: error.response?.data?.error?.message || '퇴사 처리 중 오류가 발생했습니다.',
                    color: 'red'
                });
            });
    };

    const saveEdit = () => {
        if (!selectedInstructor) return;

        const updateCommand = {
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            gender: editForm.gender || undefined,
            birthDate: editForm.birthDate || undefined
        };

        authApi.updateInstructor(selectedInstructor.membershipId, updateCommand)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['instructors'] });
                notifications.show({
                    title: '수정 완료',
                    message: '강사 정보가 성공적으로 수정되었습니다.',
                    color: 'green'
                });
                closeEdit();
            })
            .catch((error: any) => {
                notifications.show({
                    title: '오류',
                    message: error.response?.data?.error?.message || '강사 정보 수정 중 오류가 발생했습니다.',
                    color: 'red'
                });
            });
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
                        onRowClick={handleRowClick}
                    />
                )}

                {/* --- Modals --- */}

                {/* 1. Edit Modal */}
                <Modal
                    opened={editOpened}
                    onClose={closeEdit}
                    title="강사 정보 수정"
                    size="lg"
                    zIndex={1000}
                >
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            강사의 상세 정보를 수정합니다.
                        </Text>

                        <Divider label="기본 정보" labelPosition="left" />

                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput
                                    label="이름"
                                    placeholder="이름 입력"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
                                    required
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <TextInput
                                    label="이메일"
                                    placeholder="email@example.com"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.currentTarget.value })}
                                />
                            </Grid.Col>
                        </Grid>

                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput
                                    label="연락처"
                                    placeholder="010-0000-0000"
                                    value={editForm.phone}
                                    onChange={(e) => {
                                        const formatted = formatPhoneNumber(e.currentTarget.value);
                                        setEditForm({ ...editForm, phone: formatted });
                                    }}
                                    required
                                    maxLength={13}
                                    description="하이픈(-)은 자동으로 입력됩니다"
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Select
                                    label="성별"
                                    placeholder="성별 선택"
                                    value={editForm.gender}
                                    onChange={(value) => setEditForm({ ...editForm, gender: value as 'MALE' | 'FEMALE' | null })}
                                    data={[
                                        { value: 'MALE', label: '남성' },
                                        { value: 'FEMALE', label: '여성' }
                                    ]}
                                    clearable
                                    comboboxProps={{ zIndex: 1001 }}
                                />
                            </Grid.Col>
                        </Grid>

                        <DateInput
                            label="생년월일"
                            placeholder="생년월일 선택"
                            value={editForm.birthDate}
                            onChange={(date) => setEditForm({ ...editForm, birthDate: date || null })}
                            valueFormat="YYYY-MM-DD"
                            clearable
                            popoverProps={{ zIndex: 1001 }}
                        />

                        <Divider label="추가 정보" labelPosition="left" />

                        <Text size="sm" c="dimmed">
                            * 메모는 강사 상세정보 Drawer에서 수정할 수 있습니다.
                        </Text>

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

                {/* Instructor Detail Drawer */}
                <InstructorDrawer
                    opened={drawerOpened}
                    onClose={closeDrawer}
                    instructor={selectedInstructor}
                    onEdit={() => selectedInstructor && handleEdit(selectedInstructor)}
                    onWithdraw={(instructor) => {
                        closeDrawer();
                        setTimeout(() => {
                            setSelectedInstructor(instructor);
                            openWithdraw();
                        }, 200);
                    }}
                    onMemoUpdated={(memo) => {
                        if (selectedInstructor) {
                            setSelectedInstructor({ ...selectedInstructor, memo });
                        }
                    }}
                />
            </Stack>
        </Container>
    );
}

// --- Drawer Component ---

function InstructorDrawer({
    opened,
    onClose,
    instructor,
    onEdit,
    onWithdraw,
    onMemoUpdated
}: {
    opened: boolean;
    onClose: () => void;
    instructor: InstructorDto | null;
    onEdit: () => void;
    onWithdraw: (instructor: InstructorDto) => void;
    onMemoUpdated: (memo: string) => void;
}) {
    const [memoValue, setMemoValue] = useState('');
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const queryClient = useQueryClient();

    // Reset memo value when instructor changes
    useEffect(() => {
        if (instructor) {
            setMemoValue(instructor.memo || '');
            setIsEditingMemo(false);
        }
    }, [instructor]);

    const memoMutation = useMutation({
        mutationFn: async (memo: string) => {
            if (!instructor) return;
            await authApi.updateInstructorMemo(instructor.membershipId, { memo });
            return memo;
        },
        onSuccess: (memo) => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            if (memo !== undefined) {
                onMemoUpdated(memo);
            }
            notifications.show({
                title: '저장됨',
                message: '메모가 업데이트되었습니다.',
                color: 'green'
            });
            setIsEditingMemo(false);
        },
        onError: () => {
            notifications.show({
                title: '저장 실패',
                message: '메모 업데이트 중 오류가 발생했습니다.',
                color: 'red'
            });
        }
    });

    const handleSaveMemo = () => {
        memoMutation.mutate(memoValue);
    };

    if (!instructor) return null;

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={<Text fw={700} size="lg">강사 상세 정보</Text>}
        >
            <Stack gap="lg">
                {/* Profile Header */}
                <Group align="flex-start">
                    <Avatar
                        size="xl"
                        radius="md"
                        color="indigo"
                        src={instructor.profileImageUrl}
                    >
                        {instructor.name.charAt(0)}
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                        <Group justify="space-between" align="start">
                            <Box>
                                <Text size="xl" fw={700}>{instructor.name}</Text>
                                <Text c="dimmed" size="sm" mt={4}>{instructor.phone}</Text>
                                <Text size="xs" c="dimmed">
                                    {instructor.gender === 'MALE' ? '남성' : instructor.gender === 'FEMALE' ? '여성' : '-'}
                                    {instructor.birthDate && ` · ${instructor.birthDate}`}
                                </Text>
                            </Box>
                            <Badge size="lg" color={
                                instructor.status === 'ACTIVE' ? 'green' :
                                    instructor.status === 'INACTIVE' ? 'gray' :
                                        instructor.status === 'PENDING_APPROVAL' ? 'orange' : 'red'
                            }>
                                {instructor.status === 'ACTIVE' ? '활성' :
                                    instructor.status === 'INACTIVE' ? '일시정지' :
                                        instructor.status === 'PENDING_APPROVAL' ? '승인대기' :
                                            instructor.status === 'WITHDRAWN' ? '퇴사' : instructor.status}
                            </Badge>
                        </Group>
                        <Group mt="sm" gap="xs">
                            <Button size="xs" variant="default" leftSection={<IconEdit size={14} />} onClick={onEdit}>
                                정보수정
                            </Button>
                        </Group>
                    </Box>
                </Group>

                <Tabs defaultValue="info">
                    <Tabs.List grow>
                        <Tabs.Tab value="info">정보</Tabs.Tab>
                        <Tabs.Tab value="memo" leftSection={<IconNotes size={16} />}>메모</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="info" pt="md">
                        <Stack gap="md">
                            <Card withBorder radius="md" p="md">
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">이메일</Text>
                                        <Text size="sm" fw={500}>{instructor.email || '-'}</Text>
                                    </Group>
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">전화번호</Text>
                                        <Text size="sm" fw={500}>{instructor.phone}</Text>
                                    </Group>
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">성별</Text>
                                        <Text size="sm" fw={500}>
                                            {instructor.gender === 'MALE' ? '남성' : instructor.gender === 'FEMALE' ? '여성' : '-'}
                                        </Text>
                                    </Group>
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">생년월일</Text>
                                        <Text size="sm" fw={500}>{instructor.birthDate || '-'}</Text>
                                    </Group>
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">승인일</Text>
                                        <Text size="sm" fw={500}>
                                            {instructor.approvedAt ? new Date(instructor.approvedAt).toLocaleDateString('ko-KR') : '-'}
                                        </Text>
                                    </Group>
                                </Stack>
                            </Card>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="memo" pt="md">
                        <Box>
                            <Group justify="space-between" mb="xs">
                                <Text fw={600} size="sm">강사 메모</Text>
                                {!isEditingMemo ? (
                                    <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => setIsEditingMemo(true)}>
                                        <IconEdit size={14} />
                                    </ActionIcon>
                                ) : (
                                    <Group gap={4}>
                                        <Button size="compact-xs" variant="light" onClick={() => setIsEditingMemo(false)}>취소</Button>
                                        <Button size="compact-xs" onClick={handleSaveMemo} loading={memoMutation.isPending}>저장</Button>
                                    </Group>
                                )}
                            </Group>

                            {isEditingMemo ? (
                                <Textarea
                                    value={memoValue}
                                    onChange={(e) => setMemoValue(e.currentTarget.value)}
                                    autosize
                                    minRows={4}
                                    placeholder="강사에 대한 메모를 입력하세요..."
                                />
                            ) : (
                                <Card withBorder bg="gray.0" radius="md" p="sm">
                                    <Text size="sm">{instructor.memo || "등록된 메모가 없습니다."}</Text>
                                </Card>
                            )}
                        </Box>
                    </Tabs.Panel>
                </Tabs>

                {/* Action Buttons */}
                <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Button
                        fullWidth
                        color="red"
                        variant="light"
                        onClick={() => onWithdraw(instructor)}
                        disabled={instructor.status === 'WITHDRAWN'}
                    >
                        퇴사 처리
                    </Button>
                </Box>
            </Stack>
        </Drawer>
    );
}
