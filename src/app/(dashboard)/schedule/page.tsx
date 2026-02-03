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


import { useWeeklySchedule, useRooms, useScheduleInstructors, useScheduleMutations } from '@/features/schedule';
import { CreateScheduleCommand } from '@/lib/api';
import { ScheduleSkeleton } from '@/features/schedule/components/ScheduleSkeleton';
import { notifications } from '@mantine/notifications';

export default function CalendarPage() {
    const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // React Query Hooks
    const { data: schedule = [], isLoading: isScheduleLoading } = useWeeklySchedule(currentDate);
    const { data: rooms = [], isLoading: isRoomsLoading } = useRooms();
    const { data: instructors = [], isLoading: isInstructorsLoading } = useScheduleInstructors();
    const { createClass, updateClass, deleteClass } = useScheduleMutations();

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
        // Transform form values to API Command
        const startDateTime = dayjs(values.date).format('YYYY-MM-DD') + 'T' + values.startTime + ':00';
        const endDateTime = dayjs(values.date).format('YYYY-MM-DD') + 'T' + values.endTime + ':00';

        const command: CreateScheduleCommand = {
            title: values.title,
            instructorMembershipId: values.instructorId,
            roomId: values.roomId,
            startDateTime,
            endDateTime,
            maxCapacity: Number(values.maxCapacity),
            notes: values.notes
        };

        if (selectedClass) {
            // Update
            updateClass.mutate({ id: selectedClass.id, command }, {
                onSuccess: () => {
                    notifications.show({ title: '수정 완료', message: '수업이 수정되었습니다.', color: 'green' });
                    setSelectedClass(null);
                    close();
                },
                onError: () => notifications.show({ title: '오류', message: '수업 수정에 실패했습니다.', color: 'red' })
            });

        } else {
            // Create
            createClass.mutate(command, {
                onSuccess: () => {
                    notifications.show({ title: '등록 완료', message: '새 수업이 등록되었습니다.', color: 'green' });
                    setSelectedClass(null);
                    close();
                },
                onError: () => notifications.show({ title: '오류', message: '수업 등록에 실패했습니다.', color: 'red' })
            });
        }
    };

    const handleDeleteClass = () => {
        if (!selectedClass) return;
        if (confirm('정말로 이 수업을 삭제하시겠습니까?')) {
            deleteClass.mutate(selectedClass.id, {
                onSuccess: () => {
                    notifications.show({ title: '삭제 완료', message: '수업이 삭제되었습니다.', color: 'gray' });
                    setSelectedClass(null);
                    close();
                },
                onError: () => notifications.show({ title: '오류', message: '삭제에 실패했습니다.', color: 'red' })
            });
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
                instructors={instructors}
                rooms={rooms}
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
                            classes={schedule}
                        />
                    ) : (
                        <MonthlyCalendar
                            currentDate={currentDate}
                            selectedInstructors={selectedInstructors}
                            selectedRooms={selectedRooms}
                            onClassClick={openEditModal}
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
                rooms={rooms}
                instructors={instructors}
            />
        </Group>
    );
}
