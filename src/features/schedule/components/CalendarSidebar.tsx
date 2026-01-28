'use client';

import { Box, Stack, Text, Checkbox, Avatar, Divider, ActionIcon, Group } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { getInstructorsWithColors, getRooms } from '../model/mock-data';
import dayjs from 'dayjs';

import { useSettings } from '@/context/SettingsContext';

interface CalendarSidebarProps {
    selectedInstructors: string[]; // ids
    toggleInstructor: (id: string) => void;
    selectedRooms: string[];
    toggleRoom: (id: string) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export function CalendarSidebar({
    selectedInstructors, toggleInstructor, selectedRooms, toggleRoom, currentDate, onDateChange
}: CalendarSidebarProps) {
    const instructors = getInstructorsWithColors();
    const { rooms } = useSettings();

    return (
        <Stack w={280} h="100%" bg="white" p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
            {/* 1. Mini Calendar (Real) */}
            <Box mb="md">
                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                    <DatePicker
                        value={currentDate}
                        onChange={(val) => val && onDateChange(new Date(val))}
                        allowDeselect={false}
                        size="sm"
                        styles={{
                            day: { borderRadius: '50%' },
                            calendarHeader: { maxWidth: '100%' }
                        }}
                    />
                </Box>
            </Box>

            <Divider my="sm" />

            {/* 2. Instructor Filter */}
            <Box>
                <Text fw={700} size="sm" mb="sm" c="dimmed">강사 (INSTRUCTOR)</Text>
                <Stack gap="xs">
                    {instructors.map((inst) => (
                        <Group key={inst.id} justify="space-between" style={{ cursor: 'pointer' }} onClick={() => toggleInstructor(inst.id)}>
                            <Group gap="sm">
                                <Avatar src={inst.avatarUrl} size="sm" radius="xl" color={inst.color}>{inst.name.charAt(0)}</Avatar>
                                <Text size="sm">{inst.name}</Text>
                            </Group>
                            <Checkbox
                                checked={selectedInstructors.includes(inst.id)}
                                readOnly
                                color={inst.color}
                                size="xs"
                                style={{ cursor: 'pointer' }}
                            />
                        </Group>
                    ))}
                </Stack>
            </Box>

            <Divider my="sm" />

            {/* 3. Room Filter */}
            <Box>
                <Text fw={700} size="sm" mb="sm" c="dimmed">강의실 (ROOM)</Text>
                <Stack gap="xs">
                    {rooms.map((room) => (
                        <Checkbox
                            key={room.id}
                            label={room.name}
                            checked={selectedRooms.includes(room.id)}
                            onChange={() => toggleRoom(room.id)}
                            size="sm"
                            styles={{ label: { cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                        />
                    ))}
                </Stack>
            </Box>
        </Stack>
    );
}
