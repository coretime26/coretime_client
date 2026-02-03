import { useState } from 'react';
import {
    TextInput,
    ActionIcon,
    Group,
    Badge,
    Table,
    Avatar,
    Card,
    Text,
    SimpleGrid,
    Stack,
    Tooltip,
    Menu,
    Button,
    Select,
    Box,
    Center,
    Loader
} from '@mantine/core';
import {
    IconSearch,
    IconTable,
    IconLayoutGrid,
    IconFilter,
    IconDotsVertical,
    IconUserPause,
    IconUserOff,
    IconBuilding,
    IconEdit
} from '@tabler/icons-react';
import { InstructorDto } from '@/lib/api';
import { formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';

interface InstructorListProps {
    instructors: InstructorDto[];
    isLoading: boolean;
    onAction: (type: 'suspend' | 'withdraw' | 'activate', instructor: InstructorDto) => void;
    onEdit: (instructor: InstructorDto) => void;
    onRowClick?: (instructor: InstructorDto) => void;
}

const statusConfig = {
    PENDING_APPROVAL: { color: 'orange', label: '승인 대기' },
    ACTIVE: { color: 'green', label: '활성' },
    INACTIVE: { color: 'gray', label: '일시정지' },
    WITHDRAWN: { color: 'red', label: '퇴사' }
};

export default function InstructorList({ instructors, isLoading, onAction, onEdit, onRowClick }: InstructorListProps) {
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>('ALL');

    const filteredInstructors = instructors.filter(instructor => {
        const matchesSearch =
            instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            instructor.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (instructor.email && instructor.email.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || instructor.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <Stack gap="md">
            {/* Controls */}
            <Group justify="space-between">
                <Group>
                    <TextInput
                        placeholder="이름, 연락처 검색"
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        style={{ width: 300 }}
                    />
                    <Select
                        placeholder="상태 필터"
                        data={[
                            { value: 'ALL', label: '전체' },
                            { value: 'ACTIVE', label: '활성' },
                            { value: 'INACTIVE', label: '일시정지' },
                            { value: 'WITHDRAWN', label: '퇴사' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        leftSection={<IconFilter size={16} />}
                        w={150}
                    />
                </Group>
                <Tooltip label={viewMode === 'table' ? '카드 뷰' : '테이블 뷰'}>
                    <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                    >
                        {viewMode === 'table' ? <IconLayoutGrid size={18} /> : <IconTable size={18} />}
                    </ActionIcon>
                </Tooltip>
            </Group>

            {/* List Content */}
            {isLoading ? (
                <Center h={300}><Loader /></Center>
            ) : filteredInstructors.length === 0 ? (
                <Center h={300} bg="gray.0" style={{ borderRadius: 8 }}>
                    <Stack align="center" gap="xs">
                        <IconBuilding size={48} stroke={1.5} color="gray" style={{ opacity: 0.5 }} />
                        <Text c="dimmed">검색 결과가 없습니다</Text>
                    </Stack>
                </Center>
            ) : viewMode === 'table' ? (
                <InstructorTable instructors={filteredInstructors} onAction={onAction} onEdit={onEdit} onRowClick={onRowClick} />
            ) : (
                <InstructorCards instructors={filteredInstructors} onAction={onAction} onEdit={onEdit} onRowClick={onRowClick} />
            )}
        </Stack>
    );
}

// --- Sub Components ---

function InstructorTable({ instructors, onAction, onEdit, onRowClick }: { instructors: InstructorDto[], onAction: any, onEdit: any, onRowClick?: any }) {
    return (
        <Card withBorder radius="md" p={0}>
            <Table striped highlightOnHover>
                <Table.Thead bg="gray.0">
                    <Table.Tr>
                        <Table.Th>강사</Table.Th>
                        <Table.Th>이메일</Table.Th>
                        <Table.Th>연락처</Table.Th>
                        <Table.Th>상태</Table.Th>
                        <Table.Th>가입일</Table.Th>
                        <Table.Th style={{ width: 80 }}></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {instructors.map((instructor) => (
                        <Table.Tr
                            key={instructor.membershipId}
                            onClick={() => onRowClick?.(instructor)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Table.Td>
                                <Group gap="sm">
                                    <Avatar src={instructor.profileImageUrl} radius="xl" size="md">
                                        {instructor.name.charAt(0)}
                                    </Avatar>
                                    <Text fw={500}>{instructor.name}</Text>
                                </Group>
                            </Table.Td>
                            <Table.Td>{instructor.email || '-'}</Table.Td>
                            <Table.Td>{instructor.phone}</Table.Td>
                            <Table.Td>
                                <Badge color={statusConfig[instructor.status as keyof typeof statusConfig]?.color || 'gray'} variant="light">
                                    {statusConfig[instructor.status as keyof typeof statusConfig]?.label || instructor.status}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">
                                    {instructor.approvedAt
                                        ? formatDistance(new Date(instructor.approvedAt), new Date(), {
                                            addSuffix: true,
                                            locale: ko
                                        })
                                        : '-'}
                                </Text>
                            </Table.Td>
                            <Table.Td onClick={(e) => e.stopPropagation()}>
                                <InstructorActions instructor={instructor} onAction={onAction} onEdit={onEdit} />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Card>
    );
}

function InstructorCards({ instructors, onAction, onEdit, onRowClick }: { instructors: InstructorDto[], onAction: any, onEdit: any, onRowClick?: any }) {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {instructors.map((instructor) => (
                <Card
                    key={instructor.membershipId}
                    withBorder
                    padding="lg"
                    radius="md"
                    onClick={() => onRowClick?.(instructor)}
                    style={{ cursor: 'pointer' }}
                >
                    <Stack gap="md">
                        <Group>
                            <Avatar src={instructor.profileImageUrl} radius="xl" size="lg">
                                {instructor.name.charAt(0)}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text fw={600}>{instructor.name}</Text>
                                <Text size="sm" c="dimmed">{instructor.phone}</Text>
                            </div>
                            <Badge color={statusConfig[instructor.status as keyof typeof statusConfig]?.color || 'gray'} variant="light">
                                {statusConfig[instructor.status as keyof typeof statusConfig]?.label || instructor.status}
                            </Badge>
                        </Group>

                        <div>
                            <Text size="xs" c="dimmed" mb={4}>가입일</Text>
                            <Text size="sm">
                                {instructor.approvedAt
                                    ? formatDistance(new Date(instructor.approvedAt), new Date(), {
                                        addSuffix: true,
                                        locale: ko
                                    })
                                    : '-'}
                            </Text>
                        </div>

                        <Group gap={8} grow onClick={(e) => e.stopPropagation()}>
                            <Button
                                size="xs"
                                variant="light"
                                color="orange"
                                disabled={instructor.status === 'INACTIVE'}
                                onClick={() => onAction('suspend', instructor)}
                            >
                                일시정지
                            </Button>
                            <InstructorActions instructor={instructor} onAction={onAction} onEdit={onEdit} isCard />
                        </Group>
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );
}

function InstructorActions({ instructor, onAction, onEdit, isCard }: { instructor: InstructorDto, onAction: any, onEdit: any, isCard?: boolean }) {
    if (isCard) {
        // In card view, actions are buttons, implemented above or here if more complex
        return (
            <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                    <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => onEdit(instructor)}
                    >
                        정보 수정
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        leftSection={<IconUserOff size={14} />}
                        color="red"
                        onClick={() => onAction('withdraw', instructor)}
                    >
                        퇴사 처리
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <Menu position="bottom-end" shadow="md">
            <Menu.Target>
                <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => onEdit(instructor)}
                >
                    정보 수정
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconUserPause size={14} />}
                    onClick={() => onAction('suspend', instructor)}
                    disabled={instructor.status === 'INACTIVE'}
                >
                    일시정지
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    leftSection={<IconUserOff size={14} />}
                    color="red"
                    onClick={() => onAction('withdraw', instructor)}
                >
                    퇴사 처리
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
