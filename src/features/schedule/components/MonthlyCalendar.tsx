'use client';

import { Box, Text, Paper, Group, Stack, Badge, Grid } from '@mantine/core';
import { ClassSession } from '@/features/schedule';
import { getWeeklySchedule } from '../model/mock-data';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

interface MonthlyCalendarProps {
    currentDate: Date;
    selectedInstructors: string[];
    selectedRooms: string[];
    onClassClick: (session: ClassSession) => void;
    classes: ClassSession[];
}

export function MonthlyCalendar({ currentDate, selectedInstructors, selectedRooms, onClassClick, classes }: MonthlyCalendarProps) {
    // We will just fetch mock data around current date
    // For specific monthly logic, we need to generate dates for the 6 weeks covering the month
    const startOfMonth = dayjs(currentDate).startOf('month');
    const startOfCalendar = startOfMonth.startOf('week').add(1, 'day'); // Mon

    // Filter
    const filteredClasses = classes.filter(c => {
        const matchesInstructor = selectedInstructors.length === 0 || selectedInstructors.includes(c.instructorId);
        const matchesRoom = selectedRooms.length === 0 || selectedRooms.includes(c.roomId);
        return matchesInstructor && matchesRoom;
    });

    const weeks = [];
    let currentDay = startOfCalendar;

    // Generate 6 weeks
    for (let i = 0; i < 6; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            week.push(currentDay);
            currentDay = currentDay.add(1, 'day');
        }
        weeks.push(week);
    }

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Grid columns={7} gutter={0} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                {DAYS.map(day => (
                    <Grid.Col key={day} span={1} py="sm">
                        <Text ta="center" size="sm" fw={700} c="dimmed">{day}</Text>
                    </Grid.Col>
                ))}
            </Grid>

            {/* Grid */}
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {weeks.map((week, wIndex) => (
                    <Box key={wIndex} style={{ flex: 1, display: 'flex', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                        {week.map((day, dIndex) => {
                            const isCurrentMonth = day.month() === startOfMonth.month();
                            const dayClasses = filteredClasses.filter(c => dayjs(c.startTime).isSame(day, 'day'));
                            const isToday = day.isSame(dayjs(), 'day');

                            return (
                                <Box
                                    key={dIndex}
                                    style={{
                                        flex: 1,
                                        borderRight: '1px solid var(--mantine-color-gray-2)',
                                        padding: 4,
                                        backgroundColor: isCurrentMonth ? 'white' : 'var(--mantine-color-gray-0)'
                                    }}
                                >
                                    <Group justify="flex-end" mb={4}>
                                        <Box
                                            w={24} h={24}
                                            style={{
                                                borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: isToday ? 'var(--mantine-color-indigo-6)' : 'transparent'
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                c={isToday ? 'white' : isCurrentMonth ? 'dark' : 'dimmed'}
                                                fw={isToday ? 700 : 400}
                                            >
                                                {day.date()}
                                            </Text>
                                        </Box>
                                    </Group>

                                    <Stack gap={2}>
                                        {dayClasses.map(c => (
                                            <Badge
                                                key={c.id}
                                                fullWidth
                                                variant="light"
                                                color={c.color}
                                                size="xs"
                                                style={{ cursor: 'pointer', justifyItems: 'start' }}
                                                onClick={() => onClassClick(c)}
                                            >
                                                {dayjs(c.startTime).format('HH:mm')} {c.title}
                                            </Badge>
                                        ))}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
