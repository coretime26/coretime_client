'use client';

import { Box, Text, Paper, Group, Button, Modal, Stack, Grid, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconClock, IconMapPin } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { ClassSession, TSID } from '@/features/schedule';
import { getWeeklySchedule } from '../model/mock-data';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

// Constants
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 ~ 21:00
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface WeeklyCalendarProps {
    currentDate: Date;
    selectedInstructors: string[];
    selectedRooms: string[];
    onClassClick: (session: ClassSession) => void;
    classes: ClassSession[]; // Added prop
}

export function WeeklyCalendar({ currentDate, selectedInstructors, selectedRooms, onClassClick, classes }: WeeklyCalendarProps) {
    // Helper to position event
    // No internal state for classes anymore
    const startOfWeek = dayjs(currentDate).startOf('week').add(1, 'day').toDate();

    // Filter classes
    const filteredClasses = classes.filter(c => {
        const matchesInstructor = selectedInstructors.length === 0 || selectedInstructors.includes(c.instructorId);
        const matchesRoom = selectedRooms.length === 0 || selectedRooms.includes(c.roomId);
        return matchesInstructor && matchesRoom;
    });

    // Helper to position event
    const getEventStyle = (c: ClassSession) => {
        const start = dayjs(c.startTime);
        const dayIndex = (start.day() + 6) % 7; // Mon=0, Sun=6
        const startHour = start.hour() + start.minute() / 60;
        const duration = dayjs(c.endTime).diff(start, 'minute') / 60;

        // Grid logic:
        // Columns: 50px (Time) + 7 columns
        // Rows: 60px height per hour

        return {
            left: `${(dayIndex * 100) / 7}%`,
            top: `${(startHour - 7) * 60}px`, // 60px per hour, offset by start hour (7)
            height: `${duration * 60}px`,
            width: `${100 / 7}%`,
            position: 'absolute' as const,
        };
    };

    return (
        <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header: Days */}
            <Box pl={60} pb="md" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                {DAYS.map((d, i) => {
                    const date = dayjs(startOfWeek).add(i, 'day');
                    const isToday = dayjs().isSame(date, 'day');
                    return (
                        <Stack key={d} align="center" gap={4}>
                            <Text size="xs" c="dimmed" tt="uppercase">{d}</Text>
                            <Box
                                w={32} h={32}
                                style={{
                                    borderRadius: '50%',
                                    backgroundColor: isToday ? 'var(--mantine-color-indigo-6)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Text size="lg" fw={700} c={isToday ? 'white' : 'dark'}>{date.date()}</Text>
                            </Box>
                        </Stack>
                    );
                })}
            </Box>

            {/* Grid Body */}
            <Box style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <Box style={{ position: 'relative', height: HOURS.length * 60, minWidth: '100%' }}>
                    {/* Time Lines & Labels */}
                    {HOURS.map((h) => (
                        <Box key={h} style={{ position: 'absolute', top: (h - 7) * 60, width: '100%', height: 60, display: 'flex' }}>
                            <Box w={60} style={{ borderRight: '1px solid var(--mantine-color-gray-2)', transform: 'translateY(-10px)' }}>
                                <Text size="xs" c="dimmed" ta="right" pr="sm">
                                    {h}:00
                                </Text>
                            </Box>
                            <Box style={{ flex: 1, borderTop: '1px solid var(--mantine-color-gray-1)', borderRight: '1px solid var(--mantine-color-gray-1)' }} />
                            {/* Vertical Grid Lines */}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Box key={i} style={{ position: 'absolute', left: 60 + ((i + 1) * (100 - 60 / 1000 /*rough calc adjustment needed if strict px*/)), borderLeft: '1px solid var(--mantine-color-gray-1)', height: '100%' }} />
                            ))}
                            {/* Better implementation: Overlay grid lines separately */}
                        </Box>
                    ))}

                    {/* Vertical Lines for Days (Overlay to ensure full height) */}
                    <Box style={{ position: 'absolute', top: 0, left: 60, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Box key={i} style={{ flex: 1, borderRlght: '1px solid var(--mantine-color-gray-1)', borderRight: i < 6 ? '1px solid var(--mantine-color-gray-1)' : 'none' }} />
                        ))}
                    </Box>

                    {/* Events */}
                    <Box style={{ position: 'absolute', top: 0, left: 60, right: 0, bottom: 0 }}>
                        {filteredClasses.map((c) => (
                            <Paper
                                key={c.id}
                                radius="sm"
                                p={4}
                                shadow="md"
                                onClick={() => onClassClick(c)}
                                style={{
                                    ...getEventStyle(c),
                                    backgroundColor: `var(--mantine-color-${c.color}-1)`,
                                    borderLeft: `4px solid var(--mantine-color-${c.color}-6)`,
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    overflow: 'hidden'
                                }}
                            >
                                <Text size="xs" fw={700} lineClamp={1}>{c.title}</Text>
                                <Group gap={4} mt={2}>
                                    <IconClock size={10} style={{ opacity: 0.7 }} />
                                    <Text size="xs" lineClamp={1} style={{ fontSize: 10 }}>
                                        {dayjs(c.startTime).format('HH:mm')} - {dayjs(c.endTime).format('HH:mm')}
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <IconMapPin size={10} style={{ opacity: 0.7 }} />
                                    <Text size="xs" style={{ fontSize: 10 }} lineClamp={1}>{c.roomName}</Text>
                                </Group>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
