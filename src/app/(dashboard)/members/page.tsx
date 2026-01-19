'use client';

import {
    Title, Text, Container, Group, TextInput, Button,
    Table, Badge, ActionIcon, Menu, Avatar, Drawer,
    Stack, Card, Progress, Tabs, ScrollArea, Box,
    ThemeIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch, IconFilter, IconDotsVertical, IconMessage,
    IconEdit, IconUserPlus, IconTicket, IconNote, IconPhone,
    IconClock
} from '@tabler/icons-react';
import { useMembers, Member, Ticket } from '@/context/MemberContext';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';

export default function MemberListPage() {
    const { members, tickets } = useMembers();
    const [search, setSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

    // Filtering
    const filteredMembers = useMemo(() => {
        return members.filter(m =>
            m.name.includes(search) || m.phone.includes(search)
        );
    }, [members, search]);

    const handleRowClick = (member: Member) => {
        setSelectedMember(member);
        openDrawer();
    };

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>회원 목록 (Member List)</Title>
                    <Text c="dimmed">전체 회원을 조회하고 관리합니다.</Text>
                </Box>
                <Button leftSection={<IconUserPlus size={18} />}>신규 회원 등록</Button>
            </Group>

            {/* Controls */}
            <Group mb="md">
                <TextInput
                    placeholder="이름 또는 전화번호 검색"
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 300 }}
                />
                <Button variant="light" leftSection={<IconFilter size={16} />}>필터</Button>
            </Group>

            {/* Table */}
            <Card withBorder radius="md" p={0}>
                <Table highlightOnHover>
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th>회원명</Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th>연락처</Table.Th>
                            <Table.Th>보유 수강권</Table.Th>
                            <Table.Th>최근 출석</Table.Th>
                            <Table.Th style={{ width: 50 }}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredMembers.map((member) => {
                            // Find active ticket (simplified: first active)
                            const memberTicket = tickets.find(t => t.memberId === member.id && t.status === 'ACTIVE');

                            return (
                                <Table.Tr key={member.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(member)}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="indigo" name={member.name} />
                                            <Text size="sm" fw={500}>{member.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={member.status === 'ACTIVE' ? 'green' : member.status === 'DORMANT' ? 'gray' : 'red'}
                                            variant="light"
                                        >
                                            {member.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{member.phone}</Table.Td>
                                    <Table.Td>
                                        {memberTicket ? (
                                            <Text size="sm">{memberTicket.name} ({memberTicket.remainingCount}회)</Text>
                                        ) : (
                                            <Text size="sm" c="dimmed">-</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {member.lastAttendanceAt ? dayjs(member.lastAttendanceAt).format('YYYY-MM-DD') : '-'}
                                    </Table.Td>
                                    <Table.Td onClick={(e) => e.stopPropagation()}>
                                        <Menu position="bottom-end" withinPortal>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconMessage size={14} />}>문자 발송</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>정보 수정</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Member Detail Drawer */}
            <MemberDrawer
                opened={drawerOpened}
                onClose={closeDrawer}
                member={selectedMember}
            />
        </Container>
    );
}

// --- Drawer Component ---

function MemberDrawer({ opened, onClose, member }: { opened: boolean, onClose: () => void, member: Member | null }) {
    const { tickets, logs } = useMembers(); // In real app, might fetch specific member data here

    if (!member) return null;

    const memberTickets = tickets.filter(t => t.memberId === member.id);
    const memberLogs = logs.filter(l => l.memberId === member.id); // Placeholder if we had logs

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={<Text fw={700} size="lg">회원 상세 정보</Text>}
        >
            <Stack gap="lg">
                {/* Profile Header */}
                <Group align="flex-start">
                    <Avatar size="xl" radius="md" color="indigo" name={member.name} />
                    <Box style={{ flex: 1 }}>
                        <Group justify="space-between" align="start">
                            <Box>
                                <Text size="xl" fw={700}>{member.name}</Text>
                                <Text c="dimmed" size="sm" mt={4}>{member.phone}</Text>
                            </Box>
                            <Badge size="lg" color={member.status === 'ACTIVE' ? 'green' : 'gray'}>{member.status}</Badge>
                        </Group>
                        <Group mt="sm" gap="xs">
                            <Button size="xs" variant="default" leftSection={<IconMessage size={14} />}>SMS</Button>
                            <Button size="xs" variant="default" leftSection={<IconPhone size={14} />}>Call</Button>
                        </Group>
                    </Box>
                </Group>

                {/* Important Note (Pinned) */}
                {member.pinnedNote && (
                    <Card withBorder bg="red.0" radius="md">
                        <Group gap="xs" mb="xs">
                            <IconNote size={16} color="red" />
                            <Text fw={700} size="sm" c="red.9">신체 특이사항 (중요)</Text>
                        </Group>
                        <Text size="sm">{member.pinnedNote}</Text>
                    </Card>
                )}

                <Tabs defaultValue="tickets">
                    <Tabs.List grow>
                        <Tabs.Tab value="tickets" leftSection={<IconTicket size={16} />}>수강권</Tabs.Tab>
                        <Tabs.Tab value="logs" leftSection={<IconNote size={16} />}>상담 목록</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="tickets" pt="md">
                        <Stack>
                            {memberTickets.length > 0 ? memberTickets.map(ticket => (
                                <Card key={ticket.id} withBorder radius="md">
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={600} size="sm">{ticket.name}</Text>
                                        <Badge size="sm" variant="dot" color={ticket.status === 'ACTIVE' ? 'green' : 'gray'}>
                                            {ticket.status}
                                        </Badge>
                                    </Group>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="xs" c="dimmed">잔여 횟수</Text>
                                        <Text size="xs" fw={700}>{ticket.remainingCount} / {ticket.totalCount}</Text>
                                    </Group>
                                    <Progress value={(ticket.remainingCount / ticket.totalCount) * 100} size="sm" radius="xl" color="indigo" />
                                    <Text size="xs" c="dimmed" mt="sm">
                                        유효기간: {dayjs(ticket.startDate).format('YY.MM.DD')} ~ {dayjs(ticket.endDate).format('YY.MM.DD')}
                                    </Text>
                                </Card>
                            )) : (
                                <Text c="dimmed" size="sm" ta="center" py="xl">보유 중인 수강권이 없습니다.</Text>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="logs" pt="md">
                        <Text c="dimmed" size="sm" ta="center" py="xl">상담 기록이 없습니다.</Text>
                        {/* Placeholder for now */}
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Drawer>
    );
}
