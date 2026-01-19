'use client';

import {
    Title, Text, Container, Timeline, Card, Avatar,
    Group, TextInput, Badge, Paper, Button
} from '@mantine/core';
import { IconSearch, IconMessageCircle, IconTag } from '@tabler/icons-react';
import { useMembers } from '@/context/MemberContext';
import dayjs from 'dayjs';

export default function ConsultationLogsPage() {
    // In a real app we'd fetch logs joined with member info
    // For now we simulate an aggregate view
    const { members } = useMembers();

    // Generating mock logs on the fly for demo since context logs might be empty initially
    const mockLogs = [
        {
            id: 'LOG_1', memberId: members[0].id, date: new Date(),
            instructorName: '김필라 강사', content: '허리 통증이 조금 완화되셨다고 함. 오늘 스트레칭 위주 진행.',
            tags: ['#통증케어', '#허리']
        },
        {
            id: 'LOG_2', memberId: members[1].id, date: dayjs().subtract(1, 'day').toDate(),
            instructorName: '이수민 강사', content: '재등록 상담 진행. 30회권 관심 있으심.',
            tags: ['#재등록', '#상담']
        },
        {
            id: 'LOG_3', memberId: members[2].id, date: dayjs().subtract(2, 'day').toDate(),
            instructorName: '김필라 강사', content: '처음 오심. 운동 목적은 다이어트.',
            tags: ['#신규', '#다이어트']
        },
    ];

    const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>상담/메모 기록 (Consultation Logs)</Title>
                    <Text c="dimmed">회원 상담 이력을 타임라인으로 확인합니다.</Text>
                </Box>
                <Button>새 상담 기록</Button>
            </Group>

            {/* Search */}
            <Paper p="md" mb="xl" withBorder radius="md">
                <TextInput
                    placeholder="상담 내용 또는 태그 검색 (#태그)"
                    leftSection={<IconSearch size={16} />}
                />
            </Paper>

            {/* Timeline */}
            <Timeline active={mockLogs.length} bulletSize={24} lineWidth={2}>
                {mockLogs.map((log) => (
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
        </Container>
    );
}

// For sub-components
import { Box } from '@mantine/core';
