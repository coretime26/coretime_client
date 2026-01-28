'use client';

import {
    Title, Text, Container, Group, TextInput, Button,
    Table, Badge, ActionIcon, Menu, Avatar, Drawer,
    Stack, Card, Progress, Tabs, Box, MultiSelect,
    Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconSearch, IconFilter, IconDotsVertical, IconMessage,
    IconEdit, IconUserPlus, IconTicket, IconNote, IconPhone,
    IconDeviceMobileMessage
} from '@tabler/icons-react';
import { useMembers, useMemberTickets, Member, membersApi, MemberTicketResult } from '@/features/members';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import MemberFormModal from '@/components/dashboard/members/MemberFormModal';
import ConsultationLogList from '@/components/dashboard/members/ConsultationLogList';
import AlimTalkModal from '@/components/dashboard/members/AlimTalkModal';
import { MemberTableSkeleton } from '@/components/dashboard/members/MemberSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MemberListPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);

    // Use Real API Hook via feature hook
    const { data: members = [], isLoading } = useMembers({
        search: search || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined
    });

    // Mock tickets needed temporarily for display compatibility
    // const { data: tickets = [] } = useMemberTickets(); // [REMOVED] Now using member.tickets from API

    // UI States
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any | null>(null);

    const [isAlimTalkOpen, setIsAlimTalkOpen] = useState(false);
    const [alimTalkTarget, setAlimTalkTarget] = useState<any | null>(null);

    // Handlers
    const handleRowClick = (member: Member) => {
        setSelectedMember(member);
        openDrawer();
    };

    const handleEditMember = (member: any) => {
        setEditTarget(member);
        setIsFormOpen(true);
    };

    const handleNewMember = () => {
        setEditTarget(null);
        setIsFormOpen(true);
    };

    const handleSendAlimTalk = (member: any) => {
        setAlimTalkTarget(member);
        setIsAlimTalkOpen(true);
    };

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>회원 목록</Title>
                    <Text c="dimmed">전체 회원을 조회하고 관리합니다.</Text>
                </Box>
                <Button leftSection={<IconUserPlus size={18} />} onClick={handleNewMember}>신규 회원 등록</Button>
            </Group>

            {/* Controls */}
            <Group mb="md" align="end">
                <TextInput
                    label="검색"
                    placeholder="이름 또는 전화번호"
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 300 }}
                />
                <MultiSelect
                    label="상태 필터"
                    placeholder="상태 선택 (전체)"
                    data={[
                        { value: 'INACTIVE', label: '비활성화' },
                        { value: 'PENDING_APPROVAL', label: '승인대기' },
                        { value: 'WITHDRAWN', label: '탈퇴' },
                        { value: 'REJECTED', label: '가입거절' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    clearable
                    leftSection={<IconFilter size={16} />}
                    style={{ minWidth: 200 }}
                />
            </Group>

            {/* Table */}
            {isLoading ? (
                <MemberTableSkeleton />
            ) : (
                <Card withBorder radius="md" p={0}>
                    <Table highlightOnHover>
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th>회원명</Table.Th>
                                <Table.Th>성별</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>연락처</Table.Th>
                                <Table.Th>보유 수강권</Table.Th>
                                <Table.Th>최근 출석</Table.Th>
                                <Table.Th style={{ width: 50 }}></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {members.length > 0 ? members.map((member: Member) => {
                                // Find active ticket (simplified: mock compatibility)
                                // [REMOVED] Ticket info is now in member.tickets

                                return (
                                    <Table.Tr key={member.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(member)}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="indigo" name={member.name} src={member.profileImageUrl} />
                                                <Text size="sm" fw={500}>{member.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{member.gender === 'MALE' ? '남성' : member.gender === 'FEMALE' ? '여성' : '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={member.status === 'ACTIVE' ? 'green' : member.status === 'INACTIVE' ? 'gray' : member.status === 'PENDING_APPROVAL' ? 'orange' : 'red'}
                                                variant="light"
                                            >
                                                {member.status === 'ACTIVE' ? '활동' :
                                                    member.status === 'INACTIVE' ? '비활성화' :
                                                        member.status === 'PENDING_APPROVAL' ? '승인대기' :
                                                            member.status === 'WITHDRAWN' ? '탈퇴' :
                                                                member.status === 'REJECTED' ? '가입거절' : member.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{member.phone}</Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {member.tickets && member.tickets.length > 0 ? (
                                                    <>
                                                        <Text size="sm" c="dark.3">
                                                            {member.tickets[0].name} <Text span c="indigo" fw={600}>({member.tickets[0].remainingCount}회)</Text>
                                                        </Text>
                                                        {member.tickets.length > 1 && (
                                                            <Badge size="sm" variant="light" color="gray" px={6}>
                                                                +{member.tickets.length - 1}
                                                            </Badge>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Text size="sm" c="dimmed">-</Text>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            {member.lastAttendanceAt ? dayjs(member.lastAttendanceAt).format('YY.MM.DD') : '-'}
                                        </Table.Td>
                                        <Table.Td onClick={(e) => e.stopPropagation()}>
                                            <Menu position="bottom-end" withinPortal>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconDeviceMobileMessage size={14} />}
                                                        onClick={() => handleSendAlimTalk(member)}
                                                    >
                                                        알림톡 발송
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleEditMember(member)}
                                                    >
                                                        정보 수정
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            }) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7}>
                                        <Text ta="center" c="dimmed" py="xl">검색 결과가 없습니다.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Member Form Modal (Register/Edit) */}
            <MemberFormModal
                opened={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                member={editTarget}
            />

            {/* AlimTalk Modal */}
            <AlimTalkModal
                opened={isAlimTalkOpen}
                onClose={() => setIsAlimTalkOpen(false)}
                member={alimTalkTarget}
            />

            {/* Member Detail Drawer */}
            <MemberDrawer
                opened={drawerOpened}
                onClose={closeDrawer}
                member={selectedMember}
                onEdit={() => selectedMember && handleEditMember(selectedMember)}
                onSendAlimTalk={() => selectedMember && handleSendAlimTalk(selectedMember)}
            />
        </Container>
    );
}

// --- Drawer Component ---


// --- Drawer Component ---

function MemberDrawer({
    opened,
    onClose,
    member,
    onEdit,
    onSendAlimTalk
}: {
    opened: boolean,
    onClose: () => void,
    member: Member | null,
    onEdit: () => void,
    onSendAlimTalk: () => void
}) {
    const queryClient = useQueryClient();

    // Fetch tickets ONLY for this member, and ONLY when member exists
    const { data: memberTickets = [] } = useMemberTickets(member?.id, {
        enabled: !!member?.id
    });

    const noteMutation = useMutation({
        mutationFn: async ({ id, note }: { id: string, note: string }) => {
            if (!member) return;
            return membersApi.updateNote(id, note);
        },
        onSuccess: () => {
            notifications.show({
                title: '저장됨',
                message: '특이사항이 업데이트되었습니다.',
                color: 'green'
            });
            // Invalidating specific member detail and list to reflect note change (e.g. pinned note icon)
            if (member) queryClient.invalidateQueries({ queryKey: ['members'] });
            setIsEditingNote(false);
        },
        onError: () => {
            notifications.show({
                title: '저장 실패',
                message: '특이사항 업데이트 중 오류가 발생했습니다.',
                color: 'red'
            });
        }
    });

    // Local state for pinned note editing
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteValue, setNoteValue] = useState('');

    // Reset note value when member changes
    useMemo(() => {
        if (member) setNoteValue(member.pinnedNote || '');
        setIsEditingNote(false);
    }, [member]);

    if (!member) return null;

    const handleSaveNote = () => {
        if (member) {
            noteMutation.mutate({ id: member.id, note: noteValue });
        }
    };

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
                                <Text size="xs" c="dimmed">{member.gender === 'MALE' ? '남성' : '여성'} · {member.birthDate || '생일 미입력'}</Text>
                            </Box>
                            <Badge size="lg" color={member.status === 'ACTIVE' ? 'green' : 'gray'}>
                                {member.status === 'ACTIVE' ? '활동' :
                                    member.status === 'DORMANT' ? '휴면' :
                                        member.status === 'EXPIRED' ? '만료' : '일반'}
                            </Badge>
                        </Group>
                        <Group mt="sm" gap="xs">
                            <Button size="xs" variant="default" leftSection={<IconDeviceMobileMessage size={14} />} onClick={onSendAlimTalk}>알림톡</Button>
                            <Button size="xs" variant="default" leftSection={<IconEdit size={14} />} onClick={onEdit}>정보수정</Button>
                        </Group>
                    </Box>
                </Group>

                {/* Physical Peculiarities (Editable) */}
                <Box>
                    <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                            <IconNote size={16} color="red" />
                            <Text fw={700} size="sm" c="red.9">신체 특이사항 (중요)</Text>
                        </Group>
                        {!isEditingNote ? (
                            <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => setIsEditingNote(true)}>
                                <IconEdit size={14} />
                            </ActionIcon>
                        ) : (
                            <Group gap={4}>
                                <Button size="compact-xs" variant="light" onClick={() => setIsEditingNote(false)}>취소</Button>
                                <Button size="compact-xs" onClick={handleSaveNote} loading={noteMutation.isPending}>저장</Button>
                            </Group>
                        )}
                    </Group>

                    {isEditingNote ? (
                        <Textarea
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.currentTarget.value)}
                            autosize
                            minRows={2}
                        />
                    ) : (
                        <Card withBorder bg="red.0" radius="md" p="sm">
                            <Text size="sm">{member.pinnedNote || "등록된 특이사항이 없습니다."}</Text>
                        </Card>
                    )}
                </Box>

                <Tabs defaultValue="tickets">
                    <Tabs.List grow>
                        <Tabs.Tab value="tickets" leftSection={<IconTicket size={16} />}>수강권</Tabs.Tab>
                        <Tabs.Tab value="logs" leftSection={<IconNote size={16} />}>상담 목록</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="tickets" pt="md">
                        <Stack>
                            {memberTickets.length > 0 ? memberTickets.map((ticket: MemberTicketResult) => (
                                <Card key={ticket.id} withBorder radius="md">
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={600} size="sm">{ticket.ticketName}</Text>
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
                        <ConsultationLogList memberId={member.id} />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Drawer>
    );
}
