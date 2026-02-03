'use client';

import {
    Title, Text, Container, Group, Card, Badge,
    Accordion, Button, SegmentedControl, Avatar,
    Switch, ThemeIcon, Progress, Modal, Select, Stack, Loader, Center, TextInput, ActionIcon
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
    IconCalendarEvent, IconClock, IconAlertTriangle, IconUserPlus, IconSearch, IconX
} from '@tabler/icons-react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useSettings } from '@/context/SettingsContext';
import { useWeeklySchedule, useReservations, useReservationMutations } from '@/features/schedule';
import { Reservation } from '@/features/schedule';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/lib/api';

export default function AttendancePage() {
    const { policies, updatePolicies } = useSettings();
    const [today] = useState(new Date());

    // API Hooks
    const { data: schedule = [], isLoading: isScheduleLoading } = useWeeklySchedule(today);
    const { data: allReservations = [], isLoading: isReservationsLoading } = useReservations();
    const { updateAttendance, createReservationByAdmin } = useReservationMutations();

    // Walk-in State
    const [walkInModalOpen, { open: openWalkIn, close: closeWalkIn }] = useDisclosure(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(memberSearch, 500);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // Filter for Today
    const todaysClasses = schedule.filter(c => dayjs(c.startTime).isSame(today, 'day'));
    const todaysReservations = allReservations.filter(r => dayjs(r.date).isSame(today, 'day'));

    // ... (Stats calculation logic stays same)
    const getReservationsForClass = (classId: string) =>
        todaysReservations.filter(r => r.classId === classId && r.status !== 'CANCELED');

    const totalReserved = todaysReservations.length;
    const activeReservations = todaysClasses.flatMap(c => getReservationsForClass(c.id));
    const totalActiveReserved = activeReservations.length;
    const totalAttended = activeReservations.filter(r =>
        r.attendanceStatus === 'PRESENT' || r.attendanceStatus === 'LATE'
    ).length;
    const attendanceRate = totalActiveReserved > 0 ? (totalAttended / totalActiveReserved) * 100 : 0;

    // --- Search Members Hook ---
    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ['members', 'search', debouncedSearch],
        queryFn: () => memberApi.getMembers({ search: debouncedSearch, status: 'ACTIVE' }),
        enabled: debouncedSearch.length > 0,
        staleTime: 60 * 1000,
    });

    const handleWalkIn = () => {
        if (!selectedClassId || !selectedMemberId) return;

        createReservationByAdmin.mutate({
            classSessionId: selectedClassId,
            membershipId: selectedMemberId
        }, {
            onSuccess: () => {
                notifications.show({
                    title: '등록 완료',
                    message: '현장 회원이 추가되었습니다.',
                    color: 'green'
                });
                closeWalkIn();
                setMemberSearch('');
                setSelectedMemberId(null);
            },
            onError: (err: any) => {
                notifications.show({
                    title: '등록 실패',
                    message: err.response?.data?.message || '회원 추가 중 오류가 발생했습니다.',
                    color: 'red'
                });
            }
        });
    };

    const openWalkInModal = (classId: string) => {
        setSelectedClassId(classId);
        openWalkIn();
    };

    // ... (handleStatusChange logic stays same)
    const handleStatusChange = (reservationId: string, memberName: string, newStatus: string) => {
        if (newStatus === 'NONE') return;

        const validStatus = newStatus as 'PRESENT' | 'LATE' | 'ABSENT' | 'NOSHOW';
        const isAbsent = validStatus === 'ABSENT';

        if (isAbsent && policies.noShow.enabled) {
            modals.openConfirmModal({
                title: <Group><IconAlertTriangle color="red" size={20} /><Text fw={700}>노쇼(No-Show) 처리 확인</Text></Group>,
                children: (
                    <Text size="sm">
                        <b>{memberName}</b> 회원을 결석 처리하시겠습니까?<br />
                        <Text span c="red" fw={700}>수강권 횟수가 {policies.noShow.penaltyCount}회 자동 차감됩니다.</Text>
                    </Text>
                ),
                labels: { confirm: '결석 처리 및 차감', cancel: '취소' },
                confirmProps: { color: 'red' },
                onConfirm: () => updateStatus(reservationId, validStatus)
            });
            return;
        }
        updateStatus(reservationId, validStatus);
    };

    const updateStatus = (id: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOSHOW') => {
        updateAttendance.mutate({ id, status }, {
            onSuccess: () => {
                notifications.show({
                    title: '처리 완료',
                    message: status === 'ABSENT' ? '결석 처리되었습니다.' : '출석 상태가 변경되었습니다.',
                    color: status === 'ABSENT' ? 'orange' : 'green'
                });
            },
            onError: () => {
                notifications.show({
                    title: '오류',
                    message: '상태 변경 중 오류가 발생했습니다.',
                    color: 'red'
                });
            }
        });
    };

    if (isScheduleLoading || isReservationsLoading) {
        return <Center h={400}><Loader /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            {/* Header & Stats */}
            <Group justify="space-between" align="flex-start" mb="xl">
                <div>
                    <Title order={2}>출석 체크</Title>
                    <Text c="dimmed">오늘 예정된 수업의 출석 현황을 관리합니다.</Text>
                </div>

                <Card withBorder radius="md" p="sm" bg="gray.0">
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text size="xs" fw={700} c="dimmed">TODAY STATUS</Text>
                            <Badge variant="light" color="indigo" size="lg">
                                {totalAttended} / {totalActiveReserved} 명
                            </Badge>
                        </Group>
                        <Progress value={attendanceRate} size="sm" color="indigo" radius="xl" />
                        <Switch
                            size="md"
                            onLabel="ON" offLabel="OFF"
                            label={<Text size="xs" fw={500}>노쇼 자동 차감</Text>}
                            checked={policies.noShow.enabled}
                            onChange={(e) => updatePolicies({ noShow: { ...policies.noShow, enabled: e.currentTarget.checked } })}
                            color="red"
                            mt={4}
                        />
                    </Stack>
                </Card>
            </Group>

            {/* Class List Accordion */}
            {todaysClasses.length > 0 ? (
                <Accordion variant="separated" radius="md" defaultValue={todaysClasses[0]?.id}>
                    {todaysClasses.map(cls => {
                        const res = getReservationsForClass(cls.id);
                        const count = res.length;
                        const attendedCount = res.filter(r => r.attendanceStatus === 'PRESENT' || r.attendanceStatus === 'LATE').length;

                        return (
                            <Accordion.Item key={cls.id} value={cls.id}>
                                <Accordion.Control>
                                    <Group justify="space-between" pr="md">
                                        <Group>
                                            <ThemeIcon size="lg" radius="md" variant="light" color={cls.color}>
                                                <IconCalendarEvent size={20} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700}>{cls.title}</Text>
                                                <Group gap="xs" c="dimmed">
                                                    <IconClock size={14} />
                                                    <Text size="sm">{dayjs(cls.startTime).format('HH:mm')} ~ {dayjs(cls.endTime).format('HH:mm')}</Text>
                                                    <Text size="sm">• {cls.instructorName}</Text>
                                                    <Text size="sm">• {cls.roomName}</Text>
                                                </Group>
                                            </div>
                                        </Group>
                                        <Group gap="xl">
                                            <div style={{ textAlign: 'right' }}>
                                                <Text size="xs" c="dimmed" fw={700}>CHECK-IN</Text>
                                                <Text fw={700} size="lg" c="indigo">{attendedCount} <span style={{ color: '#adb5bd', fontSize: '0.8em' }}>/ {count}</span></Text>
                                            </div>
                                            <Badge variant={count >= cls.maxCapacity ? 'filled' : 'light'} color={count >= cls.maxCapacity ? 'red' : 'gray'}>
                                                {count >= cls.maxCapacity ? 'FULL' : `${count}/${cls.maxCapacity}`}
                                            </Badge>
                                        </Group>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="md" py="xs">

                                        {/* Member Rows */}
                                        {res.map(r => (
                                            <Card key={r.id} withBorder padding="sm" radius="md">
                                                <Group justify="space-between">
                                                    <Group>
                                                        <Avatar color="initials" name={r.userName} radius="xl" />
                                                        <div>
                                                            <Text fw={500}>{r.userName}</Text>
                                                            <Text size="xs" c="dimmed">{r.userId}</Text>
                                                        </div>
                                                    </Group>

                                                    <SegmentedControl
                                                        size="xs"
                                                        value={r.attendanceStatus || 'NONE'}
                                                        data={[
                                                            { label: '미처리', value: 'NONE' },
                                                            { label: '출석', value: 'PRESENT' },
                                                            { label: '지각', value: 'LATE' },
                                                            { label: '결석', value: 'ABSENT' },
                                                        ]}
                                                        color={
                                                            r.attendanceStatus === 'PRESENT' ? 'green' :
                                                                r.attendanceStatus === 'LATE' ? 'orange' :
                                                                    r.attendanceStatus === 'ABSENT' ? 'red' : 'gray'
                                                        }
                                                        onChange={(val) => handleStatusChange(r.id, r.userName, val)}
                                                    />
                                                </Group>
                                            </Card>
                                        ))}

                                        {/* Walk-in Trigger */}
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconUserPlus size={16} />}
                                            color="gray"
                                            onClick={() => openWalkInModal(cls.id)}
                                        >
                                            현장 회원 추가 (Walk-in)
                                        </Button>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            ) : (
                <Card withBorder radius="md" p="xl" ta="center">
                    <Text c="dimmed">오늘 예정된 수업이 없습니다.</Text>
                </Card>
            )}

            {/* Walk-in Modal */}
            <Modal opened={walkInModalOpen} onClose={closeWalkIn} title="현장 회원 추가 (Walk-in)" centered>
                <Stack>
                    <Select
                        label="회원 검색"
                        placeholder="이름 또는 전화번호 뒷자리"
                        data={searchResults
                            .filter(m => {
                                if (!selectedClassId) return true;
                                const existingMemberIds = getReservationsForClass(selectedClassId).map(r => r.userId);
                                return !existingMemberIds.includes(m.id);
                            })
                            .map(m => ({ value: m.id, label: `${m.name} (${m.phone.slice(-4)})` }))
                        }
                        searchable
                        searchValue={memberSearch}
                        onSearchChange={setMemberSearch}
                        value={selectedMemberId}
                        onChange={setSelectedMemberId}
                        nothingFoundMessage={isSearching ? "검색 중..." : "회원을 찾을 수 없습니다."}
                        leftSection={<IconSearch size={16} />}
                        filter={({ options }) => options} // Server-side filtering
                    />

                    <Button
                        fullWidth
                        onClick={handleWalkIn}
                        disabled={!selectedMemberId || createReservationByAdmin.isPending}
                        loading={createReservationByAdmin.isPending}
                    >
                        수업에 추가하기
                    </Button>
                </Stack>
            </Modal>
        </Container>
    );
}
