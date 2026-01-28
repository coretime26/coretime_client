'use client';

import { Modal, TextInput, Select, Button, Group, ColorInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput, TimeInput, DatePickerInput } from '@mantine/dates';
import { getInstructorsWithColors } from '../model/mock-data';
import { ClassSession } from '@/features/schedule';
import { useSettings } from '@/context/SettingsContext';
import { IconClock, IconTrash } from '@tabler/icons-react';
import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';

interface ClassModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    onDelete?: () => void;
    initialData?: ClassSession | null;
}

export function ClassModal({ opened, onClose, onSubmit, onDelete, initialData }: ClassModalProps) {
    const instructors = getInstructorsWithColors();
    const { rooms } = useSettings();
    const ref = useRef<HTMLInputElement>(null);

    const form = useForm({
        initialValues: {
            title: '',
            instructorId: '',
            roomId: '',
            date: new Date(),
            startTime: '', // HH:mm
            endTime: '', // HH:mm
            maxCapacity: 8,
        },
        validate: {
            title: (value) => (value.length < 2 ? 'Subject must have at least 2 letters' : null),
            instructorId: (value) => (!value ? 'Please select an instructor' : null),
            roomId: (value) => (!value ? 'Please select a room' : null),
            startTime: (value) => (!value ? 'Start time required' : null),
            endTime: (value) => (!value ? 'End time required' : null),
        },
    });

    // Populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.setValues({
                title: initialData.title,
                instructorId: initialData.instructorId,
                roomId: initialData.roomId,
                date: initialData.startTime, // Assuming startTime contains date
                startTime: dayjs(initialData.startTime).format('HH:mm'),
                endTime: dayjs(initialData.endTime).format('HH:mm'),
                maxCapacity: initialData.maxCapacity,
            });
        } else {
            form.reset();
            // Reset fails to clear dates sometimes in Mantine forms if not explicit
            form.setFieldValue('date', new Date());
        }
    }, [initialData, opened]); // Depend on opened to reset when opening fresh

    // Auto-fill capacity when room changes
    useEffect(() => {
        if (!form.values.roomId) return;
        const selectedRoom = rooms.find(r => r.id === form.values.roomId);
        if (selectedRoom) {
            form.setFieldValue('maxCapacity', selectedRoom.capacity);
        }
    }, [form.values.roomId, rooms]);

    const handleSubmit = (values: typeof form.values) => {
        // Transform to ClassSession format for submission
        onSubmit(values);
        form.reset();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={initialData ? "수업 수정" : "새 수업 등록"}
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="수업명"
                        placeholder="예: Morning Flow"
                        required
                        {...form.getInputProps('title')}
                    />

                    <Select
                        label="강사"
                        placeholder="강사 선택"
                        data={instructors.map(i => ({ value: i.id, label: i.name }))}
                        required
                        {...form.getInputProps('instructorId')}
                    />

                    <Select
                        label="강의실"
                        placeholder="강의실 선택"
                        data={rooms.map(r => ({ value: r.id, label: r.name }))}
                        required
                        {...form.getInputProps('roomId')}
                    />

                    <DateInput
                        label="날짜"
                        placeholder="날짜 선택"
                        valueFormat="YYYY-MM-DD"
                        required
                        {...form.getInputProps('date')}
                    />

                    <Group grow>
                        <TimeInput
                            ref={ref}
                            label="시작 시간"
                            rightSection={<IconClock size={16} stroke={1.5} />}
                            onClick={() => ref.current?.showPicker()}
                            required
                            {...form.getInputProps('startTime')}
                        />
                        <TimeInput
                            label="종료 시간"
                            required
                            rightSection={<IconClock size={16} stroke={1.5} />}
                            {...form.getInputProps('endTime')}
                        />
                    </Group>

                    <TextInput
                        label="정원"
                        type="number"
                        {...form.getInputProps('maxCapacity')}
                    />

                    <Group justify="space-between" mt="md">
                        {initialData ? (
                            <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={onDelete}>
                                삭제
                            </Button>
                        ) : <div />}

                        <Group>
                            <Button variant="default" onClick={onClose}>취소</Button>
                            <Button type="submit" color="indigo">{initialData ? '수정' : '등록'}</Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
