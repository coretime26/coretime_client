'use client';

import {
    Title, Text, Container, Timeline, Card, Avatar,
    Group, TextInput, Badge, Paper, Button, Box, Modal, Select, Textarea, MultiSelect
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconMessageCircle, IconTag, IconPlus, IconCheck } from '@tabler/icons-react';
import { useMembers } from '@/context/MemberContext';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function ConsultationLogsPage() {
    const { members } = useMembers();

    // Modal State
    const [opened, { open, close }] = useDisclosure(false);

    // Form State
    const [formData, setFormData] = useState({
        memberId: '',
        date: new Date(),
        instructorName: '김필라 강사', // Default hardcoded for now
        tags: [] as string[],
        content: ''
    });

    // Mock logs state (initialized with some data)
    const [logs, setLogs] = useState([
        {
            id: 'LOG_1', memberId: 'MEM_1', date: new Date(),
            instructorName: '김필라 강사', content: '허리 통증이 조금 완화되셨다고 함. 오늘 스트레칭 위주 진행.',
            tags: ['#통증케어', '#허리']
        },
        {
            id: 'LOG_2', memberId: 'MEM_2', date: dayjs().subtract(1, 'day').toDate(),
            instructorName: '이수민 강사', content: '재등록 상담 진행. 30회권 관심 있으심.',
            tags: ['#재등록', '#상담']
        },
        {
            id: 'LOG_3', memberId: 'MEM_3', date: dayjs().subtract(2, 'day').toDate(),
            instructorName: '김필라 강사', content: '처음 오심. 운동 목적은 다이어트.',
            tags: ['#신규', '#다이어트']
        },
    ]);

    const [search, setSearch] = useState('');

    const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

    // Filter Logic
    const filteredLogs = logs.filter(log => {
        const memberName = getMemberName(log.memberId);
        return memberName.includes(search); // Filter by member name
    });

    const handleAddLog = () => {
        if (!formData.memberId) {
            notifications.show({ title: '오류', message: '회원을 선택해주세요.', color: 'red' });
            return;
        }

        const newLog = {
            id: `LOG_${Date.now()}`,
            memberId: formData.memberId,
            date: formData.date,
            instructorName: formData.instructorName,
            content: formData.content,
            tags: formData.tags
        };

        setLogs([newLog, ...logs]);

        notifications.show({
            title: '상담 기록 등록',
            message: '새로운 상담 기록이 추가되었습니다.',
            color: 'green',
            icon: <IconCheck size={18} />
        });

        close();
        // Reset form (optional, keeping instructor name)
        setFormData({
            ...formData,
            memberId: '',
            content: '',
            tags: []
        });
    };

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>상담/메모 기록</Title>
                    <Text c="dimmed">회원 상담 이력을 타임라인으로 확인합니다.</Text>
                </Box>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>새 상담 기록</Button>
            </Group>

            {/* Search */}
            <Paper p="md" mb="xl" withBorder radius="md">
                <TextInput
                    placeholder="회원 이름 검색..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />
            </Paper>

            {/* Timeline */}
            <Timeline active={filteredLogs.length} bulletSize={24} lineWidth={2}>
                {filteredLogs.map((log) => (
                    <Timeline.Item
                        key={log.id}
                        bullet={<Avatar size={24} radius="xl" color="indigo" />}
                        title={
                            <Group gap="xs">
                                <Text fw={600} size="sm">{getMemberName(log.memberId)} 회원님</Text>
                                <Text size="xs" c="dimmed">• {log.instructorName}</Text>
                            </Group>
                        }
                    >
                        <Text c="dimmed" size="xs" mt={4}>
                            {dayjs(log.date).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Card withBorder radius="md" mt="sm" p="sm" bg="gray.0">
                            <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{log.content}</Text>
                            <Group gap={4} mt="sm">
                                {log.tags.map(tag => (
                                    <Badge key={tag} size="sm" variant="dot" color="blue">{tag}</Badge>
                                ))}
                            </Group>
                        </Card>
                    </Timeline.Item>
                ))}
            </Timeline>

            {/* New Log Modal */}
            <Modal opened={opened} onClose={close} title="새 상담 기록 작성" size="lg">
                <Select
                    label="회원 선택"
                    placeholder="회원을 검색하세요"
                    data={members.map(m => ({ value: m.id, label: `${m.name} (${m.phone})` }))}
                    searchable
                    mb="sm"
                    value={formData.memberId}
                    onChange={(v) => setFormData({ ...formData, memberId: v || '' })}
                />
                <Group grow mb="sm">
                    <DatePickerInput
                        label="상담 일시"
                        value={formData.date}
                        onChange={(v) => setFormData({ ...formData, date: (v as any) || new Date() })}
                    />
                    <TextInput
                        label="작성자"
                        value={formData.instructorName}
                        onChange={(e) => setFormData({ ...formData, instructorName: e.currentTarget.value })}
                    />
                </Group>

                <MultiSelect
                    label="태그"
                    placeholder="태그를 입력하거나 선택하세요"
                    data={['#신규상담', '#재등록', '#통증케어', '#다이어트', '#불만사항', '#결석']}
                    searchable
                    mb="sm"
                    value={formData.tags}
                    onChange={(v) => setFormData({ ...formData, tags: v })}
                />

                <Textarea
                    label="상담 내용"
                    placeholder="상담 내용을 자세히 기록해주세요."
                    minRows={4}
                    mb="xl"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.currentTarget.value })}
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={close}>취소</Button>
                    <Button onClick={handleAddLog}>저장하기</Button>
                </Group>
            </Modal>
        </Container>
    );
}
