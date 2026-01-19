'use client';

import {
    Title, Text, Container, SimpleGrid, Card, Group,
    RingProgress, Center, ThemeIcon, Table, Progress,
    Badge, ActionIcon, Menu, Button, Tabs
} from '@mantine/core';
import {
    IconTicket, IconAlertCircle, IconPlayerPause,
    IconCalendarTime, IconDotsVertical, IconPlus,
    IconClockPlay
} from '@tabler/icons-react';
import { useMembers, Ticket, Member } from '@/context/MemberContext';
import dayjs from 'dayjs';

export default function TicketManagementPage() {
    const { tickets, members, pauseTicket } = useMembers();

    // Stats
    const expiringSoon = tickets.filter(t => {
        const diff = dayjs(t.endDate).diff(dayjs(), 'day');
        return t.status === 'ACTIVE' && diff <= 7 && diff >= 0;
    }).length;

    const lowBalance = tickets.filter(t => t.status === 'ACTIVE' && t.remainingCount <= 3).length;
    const pausedCount = tickets.filter(t => t.status === 'PAUSED').length;

    // Helper to get member name
    const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="lg">수강권 현황 (Ticket Management)</Title>

            {/* Top Cards */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
                <StatCard
                    label="만료 예정 (7일 이내)"
                    value={expiringSoon}
                    icon={IconCalendarTime}
                    color="red"
                />
                <StatCard
                    label="잔여 횟수 부족 (3회 이하)"
                    value={lowBalance}
                    icon={IconAlertCircle}
                    color="orange"
                />
                <StatCard
                    label="일시 정지 회원"
                    value={pausedCount}
                    icon={IconPlayerPause}
                    color="gray"
                />
            </SimpleGrid>

            {/* Ticket Table */}
            <Card withBorder radius="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">전체 수강권 목록</Text>
                    <Button variant="light" size="xs">엑셀 다운로드</Button>
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
                        {tickets.map((ticket) => {
                            const daysLeft = dayjs(ticket.endDate).diff(dayjs(), 'day');
                            const isExpiring = daysLeft <= 7 && daysLeft >= 0;
                            const percent = (ticket.remainingCount / ticket.totalCount) * 100;

                            return (
                                <Table.Tr key={ticket.id}>
                                    <Table.Td>
                                        <Text fw={500} size="sm">{getMemberName(ticket.memberId)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconTicket size={16} color="gray" />
                                            <Text size="sm">{ticket.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs" mb={4} justify="space-between">
                                            <Text size="xs" fw={700}>{ticket.remainingCount}회</Text>
                                            <Text size="xs" c="dimmed">/ {ticket.totalCount}회</Text>
                                        </Group>
                                        <Progress
                                            value={percent}
                                            size="md"
                                            radius="xl"
                                            color={percent < 20 ? 'red' : 'indigo'}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c={isExpiring ? 'red' : undefined} fw={isExpiring ? 700 : 400}>
                                            {dayjs(ticket.endDate).format('YYYY-MM-DD')}
                                            <Badge size="xs" ml="xs" variant="light" color={isExpiring ? 'red' : 'gray'}>
                                                D-{daysLeft < 0 ? 'Exp' : daysLeft}
                                            </Badge>
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={ticket.status === 'ACTIVE' ? 'green' : ticket.status === 'PAUSED' ? 'orange' : 'gray'}
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconPlus size={14} />}>횟수 추가</Menu.Item>
                                                <Menu.Item leftSection={<IconClockPlay size={14} />}>기간 연장</Menu.Item>
                                                {ticket.status === 'ACTIVE' && (
                                                    <Menu.Item
                                                        leftSection={<IconPlayerPause size={14} />}
                                                        onClick={() => pauseTicket(ticket.id, true)}
                                                    >
                                                        일시 정지
                                                    </Menu.Item>
                                                )}
                                                {ticket.status === 'PAUSED' && (
                                                    <Menu.Item
                                                        leftSection={<IconPlayerPause size={14} />}
                                                        onClick={() => pauseTicket(ticket.id, false)}
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
        </Container>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
                <div>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        {label}
                    </Text>
                    <Text fw={700} size="xl" mt="xs">
                        {value}명
                    </Text>
                </div>
                <ThemeIcon size="xl" radius="md" variant="light" color={color}>
                    <Icon size={24} />
                </ThemeIcon>
            </Group>
        </Card>
    );
}
