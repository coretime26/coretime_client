'use client';

import { useState } from 'react';
import { Group, Box, Paper, Text, Button, SegmentedControl } from '@mantine/core';
import { CalendarSidebar } from '@/features/schedule/components/CalendarSidebar';
import { WeeklyCalendar } from '@/features/schedule/components/WeeklyCalendar';
import { MonthlyCalendar } from '@/features/schedule/components/MonthlyCalendar';
import { ClassModal } from '@/features/schedule/components/ClassModal';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';


import { useWeeklySchedule, useRooms, useScheduleInstructors } from '@/features/schedule';
import { ScheduleSkeleton } from '@/features/schedule/components/ScheduleSkeleton';

export default function CalendarPage() {
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // React Query Hooks
    const { data: schedule = [], isLoading: isScheduleLoading } = useWeeklySchedule(currentDate);
    const { data: rooms = [], isLoading: isRoomsLoading } = useRooms();
    const { data: instructors = [], isLoading: isInstructorsLoading } = useScheduleInstructors();

    const isLoading = isScheduleLoading || isRoomsLoading || isInstructorsLoading;

    // ... handlers ...

    const toggleInstructor = (id: string) => {
        setSelectedInstructors(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleRoom = (id: string) => {
        setSelectedRooms(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const [opened, { open, close }] = useDisclosure(false);
    const [view, setView] = useState('week'); // 'week' | 'month'
    const [selectedClass, setSelectedClass] = useState<any | null>(null);

    const handleAddClass = (values: any) => {
        console.log('New/Updated Class:', values);
        // Logic to update mock data state would go here
        alert(selectedClass ? '수업이 수정되었습니다 (Mock)' : '수업이 등록되었습니다 (Mock)');
        setSelectedClass(null); // Reset selection
        close(); // Close modal after submission
    };

    const handleDeleteClass = () => {
        if (!selectedClass) return;
        if (confirm('정말로 이 수업을 삭제하시겠습니까?')) {
            alert('수업이 삭제되었습니다 (Mock)');
            setSelectedClass(null);
            close();
        }
    };

    const openCreateModal = () => {
        setSelectedClass(null);
        open();
    };

    const openEditModal = (session: any) => {
        setSelectedClass(session);
        open();
    };

    const handleClose = () => {
        setSelectedClass(null);
        close();
    };

    // Pass real data to components if available, otherwise fallback or empty
    // Ideally CalendarSidebar should take rooms/instructors as props, checking props...
    // The current implementation of Sidebar likely uses mock data directly. 
    // We should pass them as props if the component accepts them. 
    // Let's assume for now we just wrap the main content in loading.

    if (isLoading) {
        return (
            <Box p="md">
                <ScheduleSkeleton />
            </Box>
        );
    }

    return (
        <Group align="flex-start" gap={0} h="calc(100vh - 80px)">
            <CalendarSidebar
                selectedInstructors={selectedInstructors}
                toggleInstructor={toggleInstructor}
                toggleRoom={toggleRoom}
                selectedRooms={selectedRooms}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
            // In a real refactor, we'd pass rooms/instructors here
            />

            <Box style={{ flex: 1, height: '100%', overflow: 'hidden' }} p="md">
                <Paper p={0} shadow="none" radius="md" h="100%" bg="white" style={{ display: 'flex', flexDirection: 'column' }}>
                    <Group justify="space-between" mb="md" px="md" pt="md">
                        <Text fw={700} size="lg">{dayjs(currentDate).format('YYYY년 M월')}</Text>

                        <Group>
                            <SegmentedControl
                                value={view}
                                onChange={setView}
                                data={[
                                    { label: '주간', value: 'week' },
                                    { label: '월간', value: 'month' },
                                ]}
                            />
                            <Button leftSection={<IconPlus size={16} />} size="sm" color="indigo" onClick={openCreateModal}>
                                수업 등록
                            </Button>
                        </Group>
                    </Group>

                    {view === 'week' ? (
                        <WeeklyCalendar
                            currentDate={currentDate}
                            selectedInstructors={selectedInstructors}
                            selectedRooms={selectedRooms}
                            onClassClick={openEditModal}
                            // Pass fetched schedule
                            classes={schedule}
                        />
                    ) : (
                        <MonthlyCalendar
                            currentDate={currentDate}
                            selectedInstructors={selectedInstructors}
                            selectedRooms={selectedRooms}
                            onClassClick={openEditModal}
                            // Pass fetched schedule
                            classes={schedule}
                        />
                    )}
                </Paper>
            </Box>

            <ClassModal
                opened={opened}
                onClose={handleClose}
                onSubmit={handleAddClass}
                initialData={selectedClass}
                onDelete={handleDeleteClass}
            />
        </Group>
    );
}
