'use client';

import { Box, Stack, Text, Checkbox, Avatar, Divider, Group } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';

interface CalendarSidebarProps {
    selectedInstructors: string[];
    toggleInstructor: (id: string) => void;
    selectedRooms: string[];
    toggleRoom: (id: string) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
    instructors?: { instructorId: string; name: string; avatarUrl?: string; color: string }[];
    rooms?: { id: string; name: string }[];
}

export function CalendarSidebar({
    selectedInstructors, toggleInstructor, selectedRooms, toggleRoom, currentDate, onDateChange,
    instructors = [], rooms = []
}: CalendarSidebarProps) {

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
                <Text fw={700} size="sm" mb="sm" c="dimmed">강사 목록</Text>
                <Stack gap="xs">
                    {instructors.map((inst) => (
                        <Group key={inst.instructorId} justify="space-between" style={{ cursor: 'pointer' }} onClick={() => toggleInstructor(inst.instructorId)}>
                            <Group gap="sm">
                                <Avatar src={inst.avatarUrl} size="sm" radius="xl" color={inst.color}>{inst.name.charAt(0)}</Avatar>
                                <Text size="sm">{inst.name}</Text>
                            </Group>
                            <Checkbox
                                checked={selectedInstructors.includes(inst.instructorId)}
                                readOnly
                                color={inst.color}
                                size="xs"
                                style={{ cursor: 'pointer' }}
                            />
                        </Group>
                    ))}
                    {instructors.length === 0 && <Text c="dimmed" size="xs">등록된 강사가 없습니다.</Text>}
                </Stack>
            </Box>

            <Divider my="sm" />

            {/* 3. Room Filter */}
            <Box>
                <Text fw={700} size="sm" mb="sm" c="dimmed">강의실 목록</Text>
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
                    {rooms.length === 0 && <Text c="dimmed" size="xs">등록된 강의실이 없습니다.</Text>}
                </Stack>
            </Box>
        </Stack>
    );
}
