import { Modal, TextInput, Select, Button, Group, Stack, Avatar, Divider, NumberInput, Textarea, Text, Chip, SimpleGrid, Paper, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput, TimeInput } from '@mantine/dates';
import { ClassSession, Room } from '@/features/schedule';
import { useSettings } from '@/context/SettingsContext';
import { IconClock, IconTrash, IconCalendar, IconUser, IconHome } from '@tabler/icons-react';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';

interface InstructorOption {
    instructorId: string;
    name: string;
    color?: string;
}

type InstructorProp = { id: string; name: string } | { instructorId: string; name: string };

interface ClassModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    onDelete?: () => void;
    initialData?: ClassSession | null;
    rooms?: Room[];
    instructors?: InstructorProp[];
}

const DURATION_PRESETS = [30, 50, 60, 90, 120];

export function ClassModal({ opened, onClose, onSubmit, onDelete, initialData, rooms: propsRooms, instructors: propsInstructors }: ClassModalProps) {
    const { rooms: contextRooms } = useSettings();
    const rooms = propsRooms || contextRooms;
    const instructors = (propsInstructors || []).map(i => {
        if ('id' in i) return { id: i.id, name: i.name, avatarUrl: (i as any).avatarUrl, color: (i as any).color };
        return { id: i.instructorId, name: i.name, avatarUrl: (i as any).avatarUrl, color: (i as any).color };
    });

    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);
    const [duration, setDuration] = useState<number | null>(60); // Default 60min

    const form = useForm({
        initialValues: {
            title: '',
            instructorId: '',
            roomId: '',
            date: new Date(),
            startTime: '',
            endTime: '',
            maxCapacity: 8,
            notes: '',
        },
        validate: {
            title: (value) => (value.length < 2 ? '수업명은 2글자 이상 입력해주세요.' : null),
            instructorId: (value) => (!value ? '강사를 선택해주세요.' : null),
            roomId: (value) => (!value ? '강의실을 선택해주세요.' : null),
            startTime: (value) => (!value ? '시작 시간을 입력해주세요.' : null),
            endTime: (value, values) => {
                if (!value) return '종료 시간을 입력해주세요.';
                if (values.startTime && value <= values.startTime) return '종료 시간은 시작 시간보다 늦어야 합니다.';
                return null;
            },
        },
    });

    // Populate form logic ...
    useEffect(() => {
        if (initialData) {
            form.setValues({
                title: initialData.title,
                instructorId: initialData.instructorId,
                roomId: initialData.roomId,
                date: initialData.startTime,
                startTime: dayjs(initialData.startTime).format('HH:mm'),
                endTime: dayjs(initialData.endTime).format('HH:mm'),
                maxCapacity: initialData.maxCapacity,
                notes: (initialData as any).notes || '',
            });
            // Calculate duration
            const start = dayjs(initialData.startTime);
            const end = dayjs(initialData.endTime);
            const diff = end.diff(start, 'minute');
            setDuration(DURATION_PRESETS.includes(diff) ? diff : null);
        } else {
            form.reset();
            form.setFieldValue('date', new Date());
            form.setFieldValue('startTime', '10:00');
            form.setFieldValue('endTime', '11:00');
            setDuration(60);
        }
    }, [initialData, opened]);

    // Auto-fill capacity
    useEffect(() => {
        if (!form.values.roomId) return;
        const selectedRoom = rooms.find(r => r.id === form.values.roomId);
        if (selectedRoom && !initialData) {
            form.setFieldValue('maxCapacity', selectedRoom.capacity);
        }
    }, [form.values.roomId, rooms, initialData]);

    const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = event.target.value;
        form.setFieldValue('startTime', newStart);

        if (newStart && duration) {
            // Auto Update End Time
            const [h, m] = newStart.split(':').map(Number);
            const startDate = dayjs().hour(h).minute(m);
            const endDate = startDate.add(duration, 'minute');
            form.setFieldValue('endTime', endDate.format('HH:mm'));
        }
    };

    const handleDurationClick = (mins: number) => {
        setDuration(mins);
        if (form.values.startTime) {
            const [h, m] = form.values.startTime.split(':').map(Number);
            const startDate = dayjs().hour(h).minute(m);
            const endDate = startDate.add(mins, 'minute');
            form.setFieldValue('endTime', endDate.format('HH:mm'));
        }
    };

    const handleSubmit = (values: typeof form.values) => {
        onSubmit(values);
        form.reset();
        onClose();
    };

    const renderInstructorOption = ({ option }: { option: any }) => {
        const instr = instructors.find(i => i.id === option.value);
        return (
            <Group gap="sm">
                <Avatar src={instr?.avatarUrl} size="sm" radius="xl" color={instr?.color}>
                    {instr?.name.charAt(0)}
                </Avatar>
                <Text size="sm">{option.label}</Text>
            </Group>
        );
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={700} size="xl">{initialData ? "수업 수정" : "새 수업 등록"}</Text>}
            centered
            size="lg"
            padding="xl"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            radius="md"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="xl">
                    {/* Section 1: Schedule Info */}
                    <Paper withBorder p="md" radius="md" bg="var(--mantine-color-gray-0)">
                        <Stack gap="sm">
                            <Group align="center" gap="xs" mb="xs">
                                <IconCalendar size={18} style={{ opacity: 0.7 }} />
                                <Text fw={600} size="sm">일정 설정</Text>
                            </Group>

                            <DateInput
                                valueFormat="YYYY년 MM월 DD일 dddd"
                                placeholder="날짜 선택"
                                required
                                size="md"
                                {...form.getInputProps('date')}
                            />

                            <Group grow align="flex-start">
                                <TimeInput
                                    ref={startTimeRef}
                                    label="시작 시간"
                                    rightSection={<IconClock size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => startTimeRef.current?.showPicker()} />}
                                    required
                                    size="md"
                                    value={form.values.startTime}
                                    onChange={handleStartTimeChange}
                                    onClick={() => startTimeRef.current?.showPicker()}
                                />
                                <TimeInput
                                    ref={endTimeRef}
                                    label="종료 시간"
                                    rightSection={<IconClock size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => endTimeRef.current?.showPicker()} />}
                                    required
                                    size="md"
                                    {...form.getInputProps('endTime')}
                                    onClick={() => endTimeRef.current?.showPicker()}
                                />
                            </Group>

                            <Group gap="xs">
                                <Text size="xs" c="dimmed" fw={500}>시간 간격:</Text>
                                {DURATION_PRESETS.map(mins => (
                                    <Chip
                                        key={mins}
                                        checked={duration === mins}
                                        onChange={() => handleDurationClick(mins)}
                                        size="xs"
                                        variant="filled"
                                        color={duration === mins ? 'indigo' : 'gray'}
                                    >
                                        {mins}분
                                    </Chip>
                                ))}
                            </Group>
                        </Stack>
                    </Paper>

                    {/* Section 2: Class Info */}
                    <Stack gap="md">
                        <TextInput
                            label="수업명"
                            placeholder="수업 이름을 입력하세요"
                            required
                            size="md"
                            {...form.getInputProps('title')}
                        />

                        <Group grow align="flex-start">
                            <Select
                                label="담당 강사"
                                placeholder="강사 선택"
                                data={instructors.map(i => ({ value: i.id, label: i.name }))}
                                renderOption={renderInstructorOption}
                                required
                                size="md"
                                searchable
                                maxDropdownHeight={200}
                                leftSection={<IconUser size={16} />}
                                {...form.getInputProps('instructorId')}
                            />

                            <Select
                                label="강의실"
                                placeholder="강의실 선택"
                                data={rooms.map(r => ({ value: r.id, label: r.name }))}
                                required
                                size="md"
                                leftSection={<IconHome size={16} />}
                                {...form.getInputProps('roomId')}
                            />
                        </Group>

                        <Group align="flex-end">
                            <NumberInput
                                label="정원"
                                required
                                min={1}
                                size="md"
                                w={120}
                                description="최대 수강 인원"
                                {...form.getInputProps('maxCapacity')}
                            />
                        </Group>
                    </Stack>

                    <Divider />

                    <Textarea
                        label="메모 (관리자용)"
                        placeholder="특이사항이나 메모를 남겨주세요."
                        minRows={2}
                        autosize
                        {...form.getInputProps('notes')}
                    />

                    <Group justify="space-between" mt="md">
                        {initialData ? (
                            <Button color="red" variant="subtle" leftSection={<IconTrash size={16} />} onClick={onDelete}>
                                삭제하기
                            </Button>
                        ) : <div />}

                        <Group>
                            <Button variant="default" onClick={onClose} size="md">닫기</Button>
                            <Button type="submit" color="indigo" size="md">{initialData ? '저장하기' : '등록하기'}</Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
