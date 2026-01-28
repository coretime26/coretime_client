'use client';

import {
    Title, Text, Container, Paper, Tabs, Stack, Group,
    TextInput, NumberInput, Button, ColorInput, ActionIcon,
    Switch, Divider, SimpleGrid, Card, Badge, ThemeIcon
} from '@mantine/core';
import { IconTrash, IconPlus, IconSettings, IconClock, IconAlertCircle, IconBuildingStore } from '@tabler/icons-react';
import { useSettings, ClassCategory } from '@/context/SettingsContext';
import { Room } from '@/features/schedule';
import { useState } from 'react';
import { useForm } from '@mantine/form';

export default function SettingsPage() {
    const {
        categories, addCategory, deleteCategory,
        rooms, addRoom, deleteRoom,
        policies, updatePolicies
    } = useSettings();

    const [activeTab, setActiveTab] = useState<string | null>('resources');

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                <Box>
                    <Title order={2}>관리자 설정</Title>
                    <Text c="dimmed">스케줄 자원 및 운영 정책을 관리합니다.</Text>
                </Box>

                <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md" keepMounted={false}>
                    <Tabs.List>
                        <Tabs.Tab value="resources" leftSection={<IconBuildingStore size={16} />}>
                            스케줄 및 자원 (Schedule & Resource)
                        </Tabs.Tab>
                        <Tabs.Tab value="policies" leftSection={<IconSettings size={16} />}>
                            운영 정책 (Operation Policy)
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="resources" pt="xl">
                        <Stack gap="xl">
                            <CategoryManager categories={categories} onAdd={addCategory} onDelete={deleteCategory} />
                            <Divider />
                            <RoomManager rooms={rooms} onAdd={addRoom} onDelete={deleteRoom} />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="policies" pt="xl">
                        <PolicyManager policies={policies} onUpdate={updatePolicies} />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}

// --- Sub Components ---

import { Box } from '@mantine/core';

function CategoryManager({ categories, onAdd, onDelete }: {
    categories: ClassCategory[],
    onAdd: (c: Omit<ClassCategory, 'id'>) => void,
    onDelete: (id: string) => void
}) {
    const form = useForm({
        initialValues: { name: '', color: '#4dabf7' },
        validate: { name: (val) => val.length > 0 ? null : 'Category name is required' }
    });

    const handleSubmit = form.onSubmit((values) => {
        onAdd(values);
        form.reset();
    });

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <Box>
                    <Title order={4}>수업 카테고리 (Class Categories)</Title>
                    <Text size="sm" c="dimmed">수업 종류와 표시 색상을 관리합니다.</Text>
                </Box>
            </Group>

            <Stack>
                {/* Add Form */}
                <Group align="flex-start" preventGrowOverflow={false}>
                    <TextInput
                        placeholder="예: 요가, 필라테스"
                        required
                        style={{ flex: 1 }}
                        {...form.getInputProps('name')}
                    />
                    <ColorInput
                        placeholder="Pick color"
                        w={150}
                        {...form.getInputProps('color')}
                    />
                    <Button onClick={() => handleSubmit()} leftSection={<IconPlus size={16} />}>추가</Button>
                </Group>

                {/* List */}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                    {categories.map((cat) => (
                        <Card key={cat.id} withBorder padding="sm" radius="md">
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <ThemeIcon color={cat.color} size="sm" radius="xl" variant="filled">
                                        <Box style={{ width: 8, height: 8 }} />
                                    </ThemeIcon>
                                    <Text fw={500}>{cat.name}</Text>
                                </Group>
                                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => onDelete(cat.id)}>
                                    <IconTrash size={14} />
                                </ActionIcon>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Paper>
    );
}

function RoomManager({ rooms, onAdd, onDelete }: {
    rooms: Room[],
    onAdd: (r: Omit<Room, 'id'>) => void,
    onDelete: (id: string) => void
}) {
    const form = useForm({
        initialValues: { name: '', capacity: 8 },
        validate: { name: (val) => val.length > 0 ? null : 'Room name is required' }
    });

    const handleSubmit = form.onSubmit((values) => {
        onAdd(values);
        form.reset();
    });

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <Box>
                    <Title order={4}>강의실 마스터 (Room Settings)</Title>
                    <Text size="sm" c="dimmed">강의실 목록과 기본 정원을 등록합니다.</Text>
                </Box>
            </Group>

            <Stack>
                <Group align="flex-start">
                    <TextInput
                        placeholder="강의실 명 (예: Private Room)"
                        style={{ flex: 2 }}
                        required
                        {...form.getInputProps('name')}
                    />
                    <NumberInput
                        placeholder="정원"
                        w={120}
                        min={1}
                        required
                        {...form.getInputProps('capacity')}
                    />
                    <Button onClick={() => handleSubmit()} leftSection={<IconPlus size={16} />}>등록</Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                    {rooms.map((room) => (
                        <Card key={room.id} withBorder padding="sm" radius="md">
                            <Group justify="space-between">
                                <Box>
                                    <Text fw={500}>{room.name}</Text>
                                    <Text size="xs" c="dimmed">정원: {room.capacity}명</Text>
                                </Box>
                                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => onDelete(room.id)}>
                                    <IconTrash size={14} />
                                </ActionIcon>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Paper>
    );
}

function PolicyManager({ policies, onUpdate }: {
    policies: ReturnType<typeof useSettings>['policies'],
    onUpdate: (u: Partial<ReturnType<typeof useSettings>['policies']>) => void
}) {
    // Local state for form, initialized with props
    // Real-time update or save button? Prompt implies "Settings... menu", usually save or instant.
    // We'll do instant updates for simplicity in this prototype.

    // No-Show Handlers
    const toggleNoShow = (checked: boolean) => {
        onUpdate({ noShow: { ...policies.noShow, enabled: checked } });
    };

    const changeDeduction = (val: number | string) => {
        onUpdate({ noShow: { ...policies.noShow, penaltyCount: Number(val) } });
    };

    // Reservation Handlers
    const changeOpenBefore = (val: number | string) => {
        onUpdate({ reservation: { ...policies.reservation, openBeforeHours: Number(val) } });
    };

    const changeCancelBefore = (val: number | string) => {
        onUpdate({ reservation: { ...policies.reservation, cancelBeforeHours: Number(val) } });
    };

    return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* No Show Policy */}
            <Paper withBorder p="md" radius="md">
                <Group mb="md" gap="xs">
                    <ThemeIcon color="red" variant="light" size="lg"><IconAlertCircle size={20} /></ThemeIcon>
                    <Title order={4}>노쇼 및 예약 정책 (No-Show Policy)</Title>
                </Group>

                <Stack gap="lg">
                    <Group justify="space-between">
                        <Box>
                            <Text fw={500}>노쇼 자동 차감</Text>
                            <Text size="xs" c="dimmed">결석 처리 시 수강권을 자동으로 차감합니다.</Text>
                        </Box>
                        <Switch
                            size="md"
                            checked={policies.noShow.enabled}
                            onChange={(e) => toggleNoShow(e.currentTarget.checked)}
                        />
                    </Group>

                    {policies.noShow.enabled && (
                        <NumberInput
                            label="결석 시 차감 횟수"
                            description="한 번의 결석에 대해 차감할 횟수를 설정하세요."
                            value={policies.noShow.penaltyCount}
                            onChange={changeDeduction}
                            min={0.5}
                            step={0.5}
                        />
                    )}
                </Stack>
            </Paper>

            {/* Reservation Constraints */}
            <Paper withBorder p="md" radius="md">
                <Group mb="md" gap="xs">
                    <ThemeIcon color="blue" variant="light" size="lg"><IconClock size={20} /></ThemeIcon>
                    <Title order={4}>예약 제약 설정 (Reservation Constraints)</Title>
                </Group>

                <Stack gap="lg">
                    <NumberInput
                        label="예약 가능 시작전 시간"
                        description="수업 시작 몇 시간 전부터 예약이 가능한가요?"
                        value={policies.reservation.openBeforeHours}
                        onChange={changeOpenBefore}
                        suffix=" 시간 전"
                        min={1}
                    />

                    <NumberInput
                        label="취소 가능 마감 시간"
                        description="수업 시작 몇 시간 전까지 위약금 없이 취소 가능한가요?"
                        value={policies.reservation.cancelBeforeHours}
                        onChange={changeCancelBefore}
                        suffix=" 시간 전"
                        min={0}
                    />
                </Stack>
            </Paper>
        </SimpleGrid>
    );
}
