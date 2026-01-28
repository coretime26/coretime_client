'use client';

import {
    Title, Text, Container, Group, Card, SimpleGrid,
    Table, Badge, Select, Button, ThemeIcon, Checkbox,
    ActionIcon, Menu, Modal, NumberInput, Box, SegmentedControl
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCalendarTime, IconUser, IconFilter, IconDotsVertical,
    IconTrash, IconAlertTriangle, IconPlus, IconCheck,
    IconMessage, IconDeviceMobileMessage
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { RESERVATIONS, CLASSES, Reservation, TSID } from '@/lib/mock-data';
import { useMembers, Member } from '@/features/members';
import AlimTalkModal from '@/components/dashboard/members/AlimTalkModal';
import { notifications } from '@mantine/notifications';

export default function ReservationManagementPage() {
    const { data: members = [] } = useMembers(); // Use useMembers hook to look up ticket info
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        dayjs().startOf('week').toDate(),
        dayjs().endOf('week').toDate()
    ]);
    const [filterStatus, setFilterStatus] = useState<string | null>('ALL');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    // Local state for reservations to allow add/remove
    const [reservations, setReservations] = useState<Reservation[]>(RESERVATIONS);

    // Registration Modal (formerly Admin Override)
    const [registerOpened, { open: openRegister, close: closeRegister }] = useDisclosure(false);

    // AlimTalk Modal
    const [alimTalkOpened, setAlimTalkOpened] = useState(false);
    const [alimTalkTarget, setAlimTalkTarget] = useState<Member | null>(null);

    // --- Derived Data ---

    const filteredReservations = reservations.filter(r => {
        const rDate = dayjs(r.date);
        const inDate = (!dateRange[0] || rDate.isSame(dateRange[0], 'day') || rDate.isAfter(dateRange[0])) &&
            (!dateRange[1] || rDate.isSame(dateRange[1], 'day') || rDate.isBefore(dateRange[1]));
        const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
        return inDate && matchStatus;
    });

    // Stats
    const stats = {
        total: filteredReservations.length,
        waiting: filteredReservations.filter(r => r.status === 'WAITING').length,
        canceled: filteredReservations.filter(r => r.status === 'CANCELED' || r.status === 'CANCELED_BY_ADMIN').length,
        noShow: filteredReservations.filter(r => r.status === 'NOSHOW').length,
    };

    // --- Actions ---

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === filteredReservations.length) setSelectedRows([]);
        else setSelectedRows(filteredReservations.map(r => r.id));
    };

    // --- Handlers ---

    const handleRegisterReservation = () => {
        // Mock registration logic
        const newReservation: Reservation = {
            id: `RES_NEW_${Date.now()}`,
            classId: 'CLASS_01', // Should be from form
            userId: 'USER_NEW', // Should be from form
            userName: '신규 예약자', // Should be from form
            classTitle: 'Selected Class',
            instructorName: 'Instructor',
            date: new Date(),
            status: 'RESERVED',
            attendanceStatus: 'NONE',
            channel: 'ADMIN',
            createdAt: new Date(),
            remainingTickets: 9
        };

        // In a real app, gather data from form states. Here we just push a mock.
        // For the purpose of "Detailed Form", we will just show the UI fields, 
        // and on submit, add this mock item.

        setReservations(prev => [newReservation, ...prev]);
        closeRegister();
        notifications.show({
            title: '예약 등록 완료',
            message: '새로운 예약이 등록되었습니다.',
            color: 'green',
            icon: <IconCheck size={18} />
        });
    };

    const handleOpenAlimTalk = (reservation: Reservation) => {
        // Try to find member in context or mock one
        const member = members.find(m => m.id === reservation.userId) || {
            id: reservation.userId,
            name: reservation.userName,
            phone: '010-0000-0000', // Fallback
            status: 'ACTIVE',
            gender: 'FEMALE',
            registeredAt: new Date(),
        } as Member;

        setAlimTalkTarget(member);
        setAlimTalkOpened(true);
    };

    const handleBatchAlimTalk = () => {
        // Mock batch send
        notifications.show({
            title: '알림톡 전송 완료',
            message: `선택된 ${selectedRows.length}명의 회원에게 알림톡을 전송했습니다.`,
            color: 'blue',
            icon: <IconDeviceMobileMessage size={18} />
        });
        setSelectedRows([]);
    };

    const handleCancelReservation = (id: string) => {
        setReservations(prev => prev.filter(r => r.id !== id));
        notifications.show({
            title: '예약 취소 완료',
            message: '예약이 정상적으로 취소되었습니다.',
            color: 'red',
            icon: <IconTrash size={18} />
        });
    };

    const handleBatchCancel = () => {
        setReservations(prev => prev.filter(r => !selectedRows.includes(r.id)));
        notifications.show({
            title: '일괄 취소 완료',
            message: `${selectedRows.length}건의 예약이 취소되었습니다.`,
            color: 'red',
            icon: <IconTrash size={18} />
        });
        setSelectedRows([]);
    };

    // Helper to get remaining tickets from context
    const getRemainingTickets = (userId: string) => {
        // In real app, find member -> find active ticket -> return count
        // For now, simplified
        return 5; // dynamic stub
    };

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>예약 관리 (Reservation)</Title>
                    <Text c="dimmed">수업 예약 현황을 조회하고 관리합니다.</Text>
                </Box>
                <Button
                    leftSection={<IconPlus size={18} />}
                    color="indigo" variant="filled"
                    onClick={openRegister}
                >
                    예약 등록
                </Button>
            </Group>

            {/* Filters */}
            <Card withBorder radius="md" mb="lg" p="md">
                <Group align="flex-end">
                    <DatePickerInput
                        type="range"
                        label="조회 기간"
                        placeholder="기간 선택"
                        value={dateRange}
                        onChange={(val) => setDateRange(val as [Date | null, Date | null])}
                        valueFormat="YYYY. MM. DD"
                        style={{ width: 260 }}
                        clearable
                    />
                    <Select
                        label="상태 필터"
                        placeholder="전체"
                        data={[
                            { label: '전체', value: 'ALL' },
                            { label: '예약확정', value: 'RESERVED' },
                            { label: '대기', value: 'WAITING' },
                            { label: '취소', value: 'CANCELED' },
                            { label: '노쇼', value: 'NOSHOW' },
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ width: 150 }}
                    />
                    <Select
                        label="강사"
                        placeholder="전체 강사"
                        data={['김필라', '이수민', '박요가']}
                        style={{ width: 150 }}
                    />
                    <Button variant="outline" color="gray" leftSection={<IconFilter size={16} />}>초기화</Button>
                </Group>
            </Card>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
                <StatBox label="전체 예약" value={stats.total} color="indigo" />
                <StatBox label="대기자" value={stats.waiting} color="orange" />
                <StatBox label="취소/환불" value={stats.canceled} color="gray" />
                <StatBox label="노쇼 (No-Show)" value={stats.noShow} color="red" />
            </SimpleGrid>

            {/* Action Bar for Batch */}
            {selectedRows.length > 0 && (
                <Card bg="indigo.0" radius="md" mb="md" py="xs">
                    <Group justify="space-between">
                        <Group>
                            <ThemeIcon color="indigo" variant="light"><IconCheck size={16} /></ThemeIcon>
                            <Text size="sm" fw={600} c="indigo">{selectedRows.length}명 선택됨</Text>
                        </Group>
                        <Group gap="xs">
                            <Button size="xs" variant="white" color="indigo" leftSection={<IconDeviceMobileMessage size={14} />} onClick={handleBatchAlimTalk}>알림톡 전송</Button>
                            <Button size="xs" variant="white" color="red" leftSection={<IconTrash size={14} />} onClick={handleBatchCancel}>일괄 취소</Button>
                        </Group>
                    </Group>
                </Card>
            )}

            {/* Data Table */}
            <Card withBorder radius="md" p={0}>
                <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th style={{ width: 40 }}>
                                <Checkbox
                                    checked={selectedRows.length === filteredReservations.length && filteredReservations.length > 0}
                                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredReservations.length}
                                    onChange={toggleAll}
                                />
                            </Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th>회원명</Table.Th>
                            <Table.Th>수업 정보</Table.Th>
                            <Table.Th>잔여 횟수</Table.Th>
                            <Table.Th>신청 채널</Table.Th>
                            <Table.Th>신청 일시</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredReservations.length > 0 ? filteredReservations.map((r) => (
                            <Table.Tr key={r.id} bg={selectedRows.includes(r.id) ? 'blue.0' : undefined}>
                                <Table.Td>
                                    <Checkbox
                                        checked={selectedRows.includes(r.id)}
                                        onChange={() => toggleRow(r.id)}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <StatusBadge status={r.status} />
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={500} size="sm">{r.userName}</Text>
                                    <Text size="xs" c="dimmed">010-****-1234</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" fw={500}>{r.classTitle}</Text>
                                    <Group gap={4}>
                                        <Text size="xs" c="dimmed">{dayjs(r.date).format('MM.DD(ddd) HH:mm')}</Text>
                                        <Text size="xs" c="dimmed">• {r.instructorName}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="outline" size="sm" color="gray">
                                        {getRemainingTickets(r.userId)}회 남음
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge size="xs" variant="dot" color={r.channel === 'ADMIN' ? 'red' : 'blue'}>
                                        {r.channel || 'APP'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs" c="dimmed">{dayjs(r.createdAt).format('MM.DD HH:mm')}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end">
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleCancelReservation(r.id)}>예약 취소 (패널티 O)</Menu.Item>
                                            <Menu.Item leftSection={<IconTrash size={14} />} onClick={() => handleCancelReservation(r.id)}>예약 취소 (패널티 X)</Menu.Item>
                                            <Menu.Item leftSection={<IconDeviceMobileMessage size={14} />} onClick={() => handleOpenAlimTalk(r)}>알림톡 발송</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        )) : (
                            <Table.Tr>
                                <Table.Td colSpan={8} align="center" py="xl">
                                    <Text c="dimmed">해당 기간에 예약 내역이 없습니다.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Register Reservation Modal */}
            <Modal opened={registerOpened} onClose={closeRegister} title="예약 등록" size="lg">
                <Text size="sm" mb="md" c="dimmed">
                    회원과 수업을 선택하여 예약을 등록합니다. (관리자 권한)
                </Text>

                <SimpleGrid cols={2} spacing="md" mb="md">
                    <Select
                        label="회원 선택"
                        placeholder="이름 또는 전화번호 검색"
                        data={members.map(m => ({ label: `${m.name} (${m.phone})`, value: m.id.toString() }))}
                        searchable
                        required
                    />
                    <Select
                        label="수업 선택"
                        placeholder="수업을 선택하세요"
                        data={CLASSES.map(c => ({ label: `[${dayjs(c.startTime).format('MM/DD HH:mm')}] ${c.title} - ${c.instructorName}`, value: c.id }))}
                        required
                    />
                </SimpleGrid>

                <SimpleGrid cols={2} spacing="md" mb="md">
                    <DatePickerInput
                        label="예약 날짜"
                        placeholder="날짜 선택"
                        value={new Date()}
                        required
                    />
                    <Select
                        label="사용 수강권"
                        placeholder="수강권 선택"
                        data={['10회 수강권 (5회 남음)', '3개월 무제한 (20일 남음)']}
                        defaultValue="10회 수강권 (5회 남음)"
                    />
                </SimpleGrid>

                <Select
                    label="초기 상태"
                    placeholder="상태 선택"
                    data={['RESERVED', 'WAITING']}
                    defaultValue="RESERVED"
                    mb="xl"
                />

                <Button fullWidth color="indigo" onClick={handleRegisterReservation}>등록 완료</Button>
            </Modal>

            {/* AlimTalk Modal */}
            <AlimTalkModal
                opened={alimTalkOpened}
                onClose={() => setAlimTalkOpened(false)}
                member={alimTalkTarget}
            />
        </Container>
    );
}

// Components
function StatBox({ label, value, color }: any) {
    return (
        <Card withBorder radius="md" p="md">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>{label}</Text>
            <Text fw={700} size="xl" c={color === 'gray' ? undefined : color}>{value}</Text>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'RESERVED': 'blue',
        'WAITING': 'orange',
        'CANCELED': 'gray',
        'CANCELED_BY_ADMIN': 'red',
        'NOSHOW': 'dark'
    };
    return <Badge color={colors[status] || 'gray'}>{status}</Badge>;
}
