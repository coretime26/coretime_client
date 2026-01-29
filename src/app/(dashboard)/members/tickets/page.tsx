'use client';

import {
    Title, Text, Container, SimpleGrid, Card, Group,
    RingProgress, Center, ThemeIcon, Table, Progress,
    Badge, ActionIcon, Menu, Button, Tabs, Modal,
    Select, TextInput, NumberInput, Divider, Radio, Stack, Alert
} from '@mantine/core';
import {
    IconTicket, IconAlertCircle, IconPlayerPause,
    IconCalendarTime, IconDotsVertical, IconPlus,
    IconClockPlay, IconSearch, IconFilter, IconDownload,
    IconSortDescending, IconCheck, IconCreditCard, IconReceipt, IconCurrencyWon, IconUser
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import {
    useMemberTickets,
    useMembers,
    MemberTicketResult,
} from '@/features/members';
import {
    memberTicketApi,
    memberTicketKeys,
    IssueTicketCommand,
    useAvailablePayments
} from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function TicketManagementPage() {
    const router = useRouter();

    const queryClient = useQueryClient();
    const { data: tickets = [], isLoading } = useMemberTickets();
    const { data: members = [] } = useMembers({ status: ['ACTIVE', 'INACTIVE', 'WITHDRAWN', 'PENDING_APPROVAL'] }); // Fetch all for name resolution
    // Removed general payments hook

    const [registerOpened, { open: openRegister, close: closeRegister }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const [selectedTicket, setSelectedTicket] = useState<MemberTicketResult | null>(null);
    const [editMode, setEditMode] = useState<'ADD_COUNT' | 'EXTEND'>('ADD_COUNT');
    const [newTicketData, setNewTicketData] = useState({
        memberId: '',
        name: '1:1 PT 10회',
        totalCount: 10,
        startDate: null as Date | null,
        endDate: null as Date | null
    });

    useEffect(() => {
        setNewTicketData(prev => ({
            ...prev,
            startDate: new Date(),
            endDate: dayjs().add(1, 'year').toDate()
        }));
    }, []);

    const [selectedPrePaidTxId, setSelectedPrePaidTxId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number | Date | null>(null);

    // Stats
    const expiringSoon = tickets.filter((t: MemberTicketResult) => {
        const diff = dayjs(t.endDate).diff(dayjs(), 'day');
        return t.status === 'ACTIVE' && diff <= 7 && diff >= 0;
    }).length;

    const lowBalance = tickets.filter((t: MemberTicketResult) => t.status === 'ACTIVE' && t.remainingCount <= 3).length;
    const pausedCount = tickets.filter((t: MemberTicketResult) => t.status === 'PAUSED').length;

    const getMemberName = (id: string | number) => members.find(m => String(m.id) === String(id))?.name || 'Unknown';

    // --- Filtering & Sorting ---
    const [filterType, setFilterType] = useState<string | null>('ALL');
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<string>('NAME_ASC');

    const filteredTickets = useMemo(() => {
        return tickets.filter((t: MemberTicketResult) => {
            if (filterType === 'EXPIRING') {
                const diff = dayjs(t.endDate).diff(dayjs(), 'day');
                if (!(t.status === 'ACTIVE' && diff <= 7 && diff >= 0)) return false;
            } else if (filterType === 'LOW_BALANCE') {
                if (!(t.status === 'ACTIVE' && t.remainingCount <= 3)) return false;
            } else if (filterType === 'PAUSED') {
                if (t.status !== 'PAUSED') return false;
            }

            const nameMatch = (t.memberName || getMemberName(t.memberId)).includes(search);
            if (search && !nameMatch) return false;

            return true;
        }).sort((a: MemberTicketResult, b: MemberTicketResult) => {
            if (sortOrder === 'NAME_ASC') {
                const nameA = a.memberName || getMemberName(a.memberId);
                const nameB = b.memberName || getMemberName(b.memberId);
                return nameA.localeCompare(nameB);
            } else if (sortOrder === 'REG_DESC') {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            } else if (sortOrder === 'REMAINING_ASC') {
                return a.remainingCount - b.remainingCount;
            } else if (sortOrder === 'REMAINING_DESC') {
                return b.remainingCount - a.remainingCount;
            }
            return 0;
        });
    }, [tickets, filterType, search, sortOrder, members]);

    // Available pre-paid transactions for selected member
    // Use the dedicated hook instead of client-side filtering
    const { data: availableTransactions = [] } = useAvailablePayments(newTicketData.memberId);

    useEffect(() => {
        // Reset pre-paid selection when member changes
        setSelectedPrePaidTxId(null);
    }, [newTicketData.memberId]);

    const handlePrePaidSelect = (txId: string) => {
        setSelectedPrePaidTxId(txId === selectedPrePaidTxId ? null : txId); // Toggle logic
        const tx = availableTransactions.find(t => t.id === txId);
        if (tx && txId !== selectedPrePaidTxId) {
            // Auto-fill from transaction product info
            setNewTicketData(prev => ({
                ...prev,
                name: tx.productName,
                // Defaults, user can edit
            }));

            notifications.show({ title: '결제 정보 선택 완료', message: '하단에서 세부 내용을 확인하고 활성화하세요.', color: 'blue', icon: <IconCheck size={16} /> });
        }
    };

    const handleExcelDownload = () => {
        notifications.show({
            title: '엑셀 다운로드 시작',
            message: '수강권 목록을 엑셀 파일로 변환 중입니다...',
            color: 'green',
            icon: <IconDownload size={18} />
        });
    };


    const issueMutation = useMutation({
        mutationFn: (data: IssueTicketCommand) => memberTicketApi.issueTicket(data),
        onSuccess: () => {
            notifications.show({ title: '활성화 완료', message: '수강권이 성공적으로 활성화되었습니다.', color: 'green', icon: <IconCheck size={18} /> });
            queryClient.invalidateQueries({ queryKey: memberTicketKeys.all });
            closeRegister();
            setNewTicketData({
                memberId: '',
                name: '1:1 PT 10회',
                totalCount: 10,
                startDate: new Date(),
                endDate: dayjs().add(1, 'year').toDate() // Default 1 year
            });
            setSelectedPrePaidTxId(null);
        },
        onError: (err: any) => {
            notifications.show({ title: '오류', message: err.message || '수강권 발급 중 오류가 발생했습니다.', color: 'red' });
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, pause }: { id: string, pause: boolean }) => memberTicketApi.updateStatus(id, pause),
        onSuccess: (data) => {
            const status = data.status === 'PAUSED' ? '일시 정지' : '활성화';
            notifications.show({ title: '상태 변경 완료', message: `수강권이 ${status} 되었습니다.`, color: 'green' });
            queryClient.invalidateQueries({ queryKey: memberTicketKeys.all });
        }
    });

    const addCountMutation = useMutation({
        mutationFn: ({ id, count }: { id: string, count: number }) => memberTicketApi.addCount(id, count),
        onSuccess: (data) => {
            notifications.show({ title: '횟수 추가 완료', message: `총 횟수가 ${data.totalCount}회로 변경되었습니다.`, color: 'green' });
            queryClient.invalidateQueries({ queryKey: memberTicketKeys.all });
            closeEdit();
        }
    });

    const extendMutation = useMutation({
        mutationFn: ({ id, endDate }: { id: string, endDate: string }) => memberTicketApi.extendTicket(id, endDate),
        onSuccess: (data) => {
            notifications.show({ title: '기간 연장 완료', message: `유효기간이 ${data.endDate}까지 연장되었습니다.`, color: 'green' });
            queryClient.invalidateQueries({ queryKey: memberTicketKeys.all });
            closeEdit();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => memberTicketApi.deleteTicket(id),
        onSuccess: () => {
            notifications.show({ title: '삭제 완료', message: '수강권이 삭제되었습니다.', color: 'gray' });
            queryClient.invalidateQueries({ queryKey: memberTicketKeys.all });
        }
    });

    // --- Action Handlers ---

    const handleRegister = () => {
        // Validation
        if (!newTicketData.memberId) {
            notifications.show({ title: '오류', message: '회원을 선택해주세요.', color: 'red' });
            return;
        }
        // Note: Payment linking is optional in API but required in UI currently? 
        // Let's keep it required if that's the business rule, or relax it. 
        // The user prompt says "paymentId No (Optional)". 
        // But UI logic forces selection. I will relax it if the user wants manual issue, 
        // but for now I'll respect the existing UI logic which requires a transaction.
        // Actually, let's keep it flexible if possible, but the UI is built around linking a transaction.
        // I'll keep the check but maybe we can allow manual entry in future.
        if (!selectedPrePaidTxId) {
            // For now, let's assume we want to enforce linking for this UI flow
            notifications.show({ title: '오류', message: '활성화할 결제 내역(수강권)을 선택해야 합니다.', color: 'red' });
            return;
        }
        if (!newTicketData.name) {
            notifications.show({ title: '오류', message: '수강권 이름을 입력해주세요.', color: 'red' });
            return;
        }

        // 1. Create Command
        const command: IssueTicketCommand = {
            membershipId: newTicketData.memberId,
            ticketName: newTicketData.name,
            totalCount: newTicketData.totalCount,
            startDate: dayjs(newTicketData.startDate).format('YYYY-MM-DD'),
            endDate: dayjs(newTicketData.endDate).format('YYYY-MM-DD'),
            paymentId: selectedPrePaidTxId,
            // ticketProductId? - we could find this from transaction if needed
        };

        issueMutation.mutate(command);
    };

    const openEditModal = (ticket: any, mode: 'ADD_COUNT' | 'EXTEND') => {
        setSelectedTicket(ticket);
        setEditMode(mode);
        // Ensure Date object for date picker
        setEditValue(mode === 'ADD_COUNT' ? 0 : new Date(ticket.endDate));
        openEdit();
    };

    const handleEditSubmit = () => {
        if (!selectedTicket || !editValue) return;

        if (editMode === 'ADD_COUNT') {
            const addAmt = Number(editValue);
            if (addAmt <= 0) return;
            addCountMutation.mutate({ id: String(selectedTicket.id), count: addAmt });
        } else {
            // EXTEND
            const newDate = editValue as Date;
            extendMutation.mutate({
                id: String(selectedTicket.id),
                endDate: dayjs(newDate).format('YYYY-MM-DD')
            });
        }
    };

    // Pause Handler
    const handlePauseToggle = (ticketId: string, isPaused: boolean) => {
        statusMutation.mutate({ id: ticketId, pause: isPaused });
    };


    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="lg">수강권 현황</Title>

            {/* Top Cards (Clickable) */}
            {/* <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
                <StatCard
                    label="만료 예정 (7일 이내)"
                    value={expiringSoon}
                    icon={IconCalendarTime}
                    color="red"
                    active={filterType === 'EXPIRING'}
                    onClick={() => setFilterType(filterType === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
                />
                <StatCard
                    label="잔여 횟수 부족 (3회 이하)"
                    value={lowBalance}
                    icon={IconAlertCircle}
                    color="orange"
                    active={filterType === 'LOW_BALANCE'}
                    onClick={() => setFilterType(filterType === 'LOW_BALANCE' ? 'ALL' : 'LOW_BALANCE')}
                />
                <StatCard
                    label="일시 정지 회원"
                    value={pausedCount}
                    icon={IconPlayerPause}
                    color="gray"
                    active={filterType === 'PAUSED'}
                    onClick={() => setFilterType(filterType === 'PAUSED' ? 'ALL' : 'PAUSED')}
                />
            </SimpleGrid> */}

            {/* Controls */}
            <Group mb="md" justify="space-between">
                <Group>
                    <TextInput
                        placeholder="회원 이름 검색"
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ width: 220 }}
                    />
                    <Select
                        placeholder="정렬 기준"
                        leftSection={<IconSortDescending size={16} />}
                        data={[
                            { value: 'NAME_ASC', label: '이름순' },
                            { value: 'REG_DESC', label: '최근 등록순' },
                            { value: 'REMAINING_ASC', label: '잔여 횟수 적은순' },
                            { value: 'REMAINING_DESC', label: '잔여 횟수 많은순' },
                        ]}
                        value={sortOrder}
                        onChange={(val) => setSortOrder(val || 'NAME_ASC')}
                        style={{ width: 180 }}
                    />
                    <Select
                        placeholder="상태 필터"
                        leftSection={<IconFilter size={16} />}
                        data={[
                            { value: 'ALL', label: '전체 보기' },
                            { value: 'EXPIRING', label: '만료 예정' },
                            { value: 'LOW_BALANCE', label: '잔여 부족' },
                            { value: 'PAUSED', label: '일시 정지' },
                        ]}
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 160 }}
                    />
                </Group>
                <Button leftSection={<IconPlus size={18} />} onClick={openRegister}>수강권 등록</Button>
            </Group>

            {/* Ticket Table */}
            <Card withBorder radius="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">수강권 목록 ({filteredTickets.length})</Text>
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={handleExcelDownload}>엑셀 다운로드</Button>
                </Group>

                <Table verticalSpacing="sm">
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th>회원명</Table.Th>
                            <Table.Th>수강권 명</Table.Th>
                            <Table.Th style={{ width: 200 }}>잔여 횟수</Table.Th>
                            <Table.Th>유효 기간 (D-Day)</Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th style={{ width: 50 }}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredTickets.map((t: MemberTicketResult) => {
                            const daysLeft = dayjs(t.endDate).diff(dayjs(), 'day');
                            const isExpiring = daysLeft <= 7 && daysLeft >= 0;
                            const percent = (t.remainingCount / t.totalCount) * 100;

                            return (
                                <Table.Tr key={t.id}>
                                    <Table.Td>
                                        <Text fw={500} size="sm">{t.memberName || getMemberName(t.memberId)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconTicket size={16} color="gray" />
                                            <Text size="sm">{t.ticketName}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs" mb={4} justify="space-between">
                                            <Text size="xs" fw={700}>{t.remainingCount.toLocaleString()}회</Text>
                                            <Text size="xs" c="dimmed">/ {t.totalCount}회</Text>
                                        </Group>
                                        <Progress
                                            value={percent}
                                            size="md"
                                            radius="xl"
                                            color={percent < 20 ? 'red' : 'indigo'}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Text size="sm" c={isExpiring ? 'red' : undefined} fw={isExpiring ? 700 : 400}>
                                                {dayjs(t.endDate).format('YYYY-MM-DD')}
                                            </Text>
                                            <Badge size="xs" variant="light" color={isExpiring ? 'red' : 'gray'}>
                                                D-{daysLeft < 0 ? 'Exp' : daysLeft}
                                            </Badge>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={t.status === 'ACTIVE' ? 'green' : t.status === 'PAUSED' ? 'orange' : 'gray'}
                                        >
                                            {t.status === 'PAUSED' ? '일시정지' : t.status === 'ACTIVE' ? '사용가능' : t.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => openEditModal(t, 'ADD_COUNT')}>횟수 추가</Menu.Item>
                                                <Menu.Item leftSection={<IconClockPlay size={14} />} onClick={() => openEditModal(t, 'EXTEND')}>기간 연장</Menu.Item>
                                                {t.status === 'ACTIVE' && (
                                                    <Menu.Item
                                                        leftSection={<IconPlayerPause size={14} />}
                                                        onClick={() => handlePauseToggle(String(t.id), true)}
                                                    >
                                                        일시 정지
                                                    </Menu.Item>
                                                )}
                                                {t.status === 'PAUSED' && (
                                                    <Menu.Item
                                                        leftSection={<IconPlayerPause size={14} />}
                                                        onClick={() => handlePauseToggle(String(t.id), false)}
                                                    >
                                                        정지 해제
                                                    </Menu.Item>
                                                )}
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Register Modal */}
            <Modal opened={registerOpened} onClose={closeRegister} title={
                <Group gap="xs">
                    <IconTicket size={20} color="var(--mantine-color-blue-6)" />
                    <Text fw={700}>수강권 등록</Text>
                </Group>
            } size="lg">
                <Stack>
                    {/* 1. Member Select */}
                    <div>
                        <Text size="sm" fw={600} mb={4}>1. 회원 선택</Text>
                        <Select
                            placeholder="이름 또는 전화번호로 검색"
                            data={members.map(m => ({ value: String(m.id), label: `${m.name} (${m.phone})` }))}
                            searchable
                            value={newTicketData.memberId}
                            onChange={(v) => setNewTicketData({ ...newTicketData, memberId: v || '' })}
                            required
                            size="md"
                            nothingFoundMessage="회원을 찾을 수 없습니다."
                            leftSection={<IconUser size={16} />}
                        />
                    </div>

                    {/* 2. Transaction Grid */}
                    {newTicketData.memberId && (
                        <div>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" fw={600}>2. 수강권 선택</Text>
                                {availableTransactions.length > 0 &&
                                    <Badge variant="light" color="blue">{availableTransactions.length}건 발견</Badge>
                                }
                            </Group>

                            {availableTransactions.length > 0 ? (
                                <SimpleGrid cols={2} spacing="sm">
                                    {availableTransactions.map(tx => {
                                        const isSelected = selectedPrePaidTxId === tx.id;
                                        return (
                                            <Card
                                                key={tx.id}
                                                withBorder={!isSelected}
                                                padding="sm"
                                                radius="md"
                                                style={{
                                                    cursor: 'pointer',
                                                    border: isSelected ? '2px solid var(--mantine-color-blue-6)' : undefined,
                                                    backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={() => handlePrePaidSelect(tx.id)}
                                            >
                                                <Group justify="space-between" mb="xs">
                                                    <Badge color={isSelected ? 'blue' : 'gray'} variant="light">
                                                        {dayjs(tx.paidAt).format('YYYY.MM.DD')}
                                                    </Badge>
                                                    {isSelected && <ThemeIcon color="blue" radius="xl" size="sm"><IconCheck size={12} /></ThemeIcon>}
                                                </Group>
                                                <Text fw={700} size="md" mb={2} lineClamp={1}>{tx.productName}</Text>
                                                <Group justify="space-between" align="center" mt="sm">
                                                    <Text size="xs" c="dimmed">결제금액</Text>
                                                    <Text fw={600} c="blue">{tx.amount.toLocaleString()}원</Text>
                                                </Group>
                                            </Card>
                                        );
                                    })}
                                </SimpleGrid>
                            ) : (
                                <Alert color="orange" icon={<IconAlertCircle size={16} />} title="사용 가능한 수강권 없음" variant="light">
                                    선택한 회원의 결제 내역 중 <Text span fw={700}>활성화 가능한 수강권</Text>이 없습니다.
                                    <br />
                                    <Text size="xs" mt={4}>
                                        * 수강권 등록을 위해서는 먼저 결제 페이지에서 상품을 결제해야 합니다.
                                    </Text>
                                    <Button
                                        variant="outline" color="orange" size="xs" mt="sm" fullWidth
                                        onClick={() => router.push('/finance/payments')}
                                    >
                                        결제 페이지로 이동
                                    </Button>
                                </Alert>
                            )}
                        </div>
                    )}

                    {!newTicketData.memberId && (
                        <Center p="xl" bg="gray.0" style={{ borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' }}>
                            <Stack align="center" gap="xs">
                                <IconSearch size={32} color="gray" />
                                <Text c="dimmed" size="sm">회원을 먼저 선택해주세요.</Text>
                            </Stack>
                        </Center>
                    )}

                    <Divider />

                    {/* 3. Ticket Details Form (Only shows when TX selected) */}
                    <div style={{ opacity: selectedPrePaidTxId ? 1 : 0.4, pointerEvents: selectedPrePaidTxId ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                        <Text size="sm" fw={600} mb="xs">3. 활성화 세부 설정</Text>
                        <Card withBorder bg="gray.0" mb="md">
                            <Stack gap="sm">
                                <TextInput
                                    label="수강권 명"
                                    value={newTicketData.name}
                                    onChange={(e) => setNewTicketData({ ...newTicketData, name: e.currentTarget.value })}
                                />
                                <NumberInput
                                    label="총 횟수"
                                    value={newTicketData.totalCount}
                                    onChange={(v) => setNewTicketData({ ...newTicketData, totalCount: Number(v) })}
                                />
                                <Group grow>
                                    <DatePickerInput
                                        label="시작일"
                                        value={newTicketData.startDate}
                                        onChange={(v) => setNewTicketData({ ...newTicketData, startDate: (v as any) || new Date() })}
                                    />
                                    <DatePickerInput
                                        label="종료일"
                                        value={newTicketData.endDate}
                                        onChange={(v) => setNewTicketData({ ...newTicketData, endDate: (v as any) || new Date() })}
                                    />
                                </Group>
                            </Stack>
                        </Card>
                    </div>

                    <Button
                        fullWidth
                        size="md"
                        onClick={handleRegister}
                        disabled={!selectedPrePaidTxId}
                        color={selectedPrePaidTxId ? 'blue' : 'gray'}
                        leftSection={<IconCheck size={20} />}
                    >
                        {selectedPrePaidTxId ? '수강권 활성화 (등록)' : '결제 내역을 선택해주세요'}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit Modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={editMode === 'ADD_COUNT' ? "횟수 추가" : "기간 연장"}>
                {selectedTicket && (
                    <>
                        <Text size="sm" mb="md" c="dimmed">
                            {getMemberName(selectedTicket.memberId)}님 - {selectedTicket.ticketName}
                        </Text>

                        {editMode === 'ADD_COUNT' ? (
                            <NumberInput
                                label="추가할 횟수"
                                placeholder="숫자 입력"
                                mb="xl"
                                value={Number(editValue)}
                                onChange={(v) => setEditValue(Number(v))}
                                min={1}
                            />
                        ) : (
                            <DatePickerInput
                                label="변경할 종료일"
                                placeholder="날짜 선택"
                                mb="xl"
                                value={editValue instanceof Date ? editValue : null}
                                onChange={(v) => setEditValue(v as any)}
                            />
                        )}

                        <Button fullWidth onClick={handleEditSubmit}>{editMode === 'ADD_COUNT' ? '추가하기' : '연장하기'}</Button>
                    </>
                )}
            </Modal>
        </Container>
    );
}

// Helper component
function StatCard({ label, value, icon: Icon, color, active, onClick }: any) {
    return (
        <Card
            withBorder={!active}
            padding="lg"
            radius="md"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s' }}
            bg={active ? `${color}.0` : undefined}
            className={active ? 'active-stat-card' : undefined}
        >
            <Group justify="space-between">
                <div>
                    <Text size="xs" c={active ? `${color}.9` : "dimmed"} fw={700} tt="uppercase">
                        {label}
                    </Text>
                    <Text fw={700} size="xl" mt="xs" c={active ? `${color}.9` : undefined}>
                        {value}명
                    </Text>
                </div>
                <ThemeIcon size="xl" radius="md" variant={active ? "filled" : "light"} color={color}>
                    <Icon size={24} />
                </ThemeIcon>
            </Group>
        </Card>
    );
}
