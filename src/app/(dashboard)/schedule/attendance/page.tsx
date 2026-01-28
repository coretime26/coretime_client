'use client';

import {
    Title, Text, Container, Group, Card, Badge,
    Accordion, Button, SegmentedControl, Avatar,
    Switch, ThemeIcon, Progress, Modal, Select, Stack
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
    IconCalendarEvent, IconClock, IconAlertTriangle, IconUserPlus
} from '@tabler/icons-react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useSettings } from '@/context/SettingsContext';
import { CLASSES, RESERVATIONS } from '@/features/schedule/model/mock-data';
import { Reservation } from '@/features/schedule';

export default function AttendancePage() {
    // Correctly destructure policies and the update function from context
    const { policies, updatePolicies } = useSettings();
    const [today] = useState(new Date());

    // --- Data Prep (Mock) ---
    // In a real app, we'd fetch classes for 'today'
    const todaysClasses = CLASSES.filter(c => dayjs(c.startTime).isSame(today, 'day'));

    // State for local attendance updates (mimicking optimistic UI)
    const [localReservations, setLocalReservations] = useState<Reservation[]>(RESERVATIONS);

    // Filter reservations for relevant classes
    const getReservationsForClass = (classId: string) =>
        localReservations.filter(r => r.classId === classId && r.status !== 'CANCELED');

    // --- Stats ---
    const allTodayRes = todaysClasses.flatMap(c => getReservationsForClass(c.id));
    const totalReserved = allTodayRes.length;
    const totalAttended = allTodayRes.filter(r =>
        r.attendanceStatus === 'PRESENT' || r.attendanceStatus === 'LATE'
    ).length;
    const attendanceRate = totalReserved > 0 ? (totalAttended / totalReserved) * 100 : 0;

    // --- Handlers ---

    const handleStatusChange = (reservationId: string, memberName: string, newStatus: string) => {
        const isAbsent = newStatus === 'ABSENT';

        // No-Show Policy Check
        // Use policies.noShow directly
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
                onConfirm: () => updateStatus(reservationId, newStatus)
            });
            return;
        }

        // Normal update
        updateStatus(reservationId, newStatus);
    };

    const updateStatus = (id: string, status: string) => {
        setLocalReservations(prev => prev.map(r =>
            r.id === id ? { ...r, attendanceStatus: status as any } : r
        ));

        if (status === 'ABSENT') {
            notifications.show({
                title: '처리 완료',
                message: '결석 처리되었습니다.',
                color: 'orange'
            });
        }
    };

    // --- Manual Add Modal ---
    const [addModalOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);

    return (
        <Container size="xl" py="xl">
            {/* Header & Stats */}
            <Group justify="space-between" align="flex-start" mb="xl">
                <div>
                    <Title order={2}>출석 체크 (Attendance)</Title>
                    <Text c="dimmed">오늘 예정된 수업의 출석 현황을 관리합니다.</Text>
                </div>

                {/* Global Controls */}
                <Card withBorder radius="md" p="sm" bg="gray.0">
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text size="xs" fw={700} c="dimmed">TODAY STATUS</Text>
                            <Badge variant="light" color="indigo" size="lg">
                                {totalAttended} / {totalReserved} 명
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
                                                            <Text size="xs" c="dimmed">010-****-1234</Text>
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

                                        {/* Manual Add Trigger */}
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconUserPlus size={16} />}
                                            color="gray"
                                            onClick={() => {
                                                openAdd();
                                            }}
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

            {/* Manual Add Modal (Stub) */}
            <Modal opened={addModalOpen} onClose={closeAdd} title="현장 회원 추가">
                <Select
                    label="회원 검색"
                    placeholder="이름 또는 번호"
                    data={['김철수', '이영희', '박민수']}
                    searchable
                    mb="lg"
                />
                <Button fullWidth onClick={closeAdd}>수업에 추가</Button>
            </Modal>
        </Container>
    );
}
