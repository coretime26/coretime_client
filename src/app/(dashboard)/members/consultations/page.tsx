'use client';

import {
    Title, Text, Container, Timeline, Card, Avatar,
    Group, Badge, Paper, Button, Box, Modal, Select, Textarea, TagsInput, LoadingOverlay, Center
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconMessageCircle, IconPlus, IconCheck } from '@tabler/icons-react';
import { useMembers, useConsultationLogs, useCreateConsultationLog, ConsultationCategory } from '@/features/members';
import { useDisclosure } from '@mantine/hooks';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';

const CATEGORY_DATA = [
    { value: 'GENERAL', label: '일반 상담' },
    { value: 'RE_REGISTRATION', label: '재등록' },
    { value: 'COMPLAINT', label: '컴플레인' },
    { value: 'PHYSICAL', label: '체형/건강' },
    { value: 'OTHER', label: '기타' }
];

const TAG_DATA = ['#신규상담', '#재등록', '#통증케어', '#다이어트', '#불만사항', '#결석', '#운동목적', '#스케줄'];

export default function ConsultationLogsPage() {
    // 1. Members Data
    const { data: members = [] } = useMembers();
    const memberOptions = useMemo(() =>
        members.map(m => ({ value: m.id.toString(), label: `${m.name} (${m.phone})` })),
        [members]);

    // 2. State
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [opened, { open, close }] = useDisclosure(false);

    // 3. API Hooks
    const { data: logs = [], isLoading, isRefetching } = useConsultationLogs(selectedMemberId || undefined);
    const createLogMutation = useCreateConsultationLog();

    // 4. Form State
    const [formData, setFormData] = useState({
        memberId: '',
        date: new Date(),
        // instructorName removed from form, backend handles operator
        category: 'GENERAL' as ConsultationCategory,
        tags: [] as string[],
        content: ''
    });

    // Helper: Reset form when opening modal
    const handleOpenModal = () => {
        setFormData({
            memberId: selectedMemberId || '',
            date: new Date(),
            category: 'GENERAL',
            tags: [],
            content: ''
        });
        open();
    };

    const handleAddLog = () => {
        if (!formData.memberId) return;

        createLogMutation.mutate({
            membershipId: formData.memberId,
            category: formData.category,
            content: formData.content,
            tags: formData.tags,
            consultedAt: formData.date
        }, {
            onSuccess: () => {
                close();
                // If the user added a log for a different member than currently viewed, switch view?
                // For now, keep current view or switch if same.
                if (selectedMemberId !== formData.memberId) {
                    setSelectedMemberId(formData.memberId);
                }
            }
        });
    };

    const getMemberName = (id: string) => members.find(m => m.id.toString() === id)?.name || '알 수 없음';

    // Category Label Helper
    const getCategoryLabel = (cat: string) => CATEGORY_DATA.find(c => c.value === cat)?.label || cat;

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>상담/메모 기록</Title>
                    <Text c="dimmed">회원 상담 이력을 타임라인으로 확인합니다.</Text>
                </Box>
                <Button leftSection={<IconPlus size={18} />} onClick={handleOpenModal}>새 상담 기록</Button>
            </Group>

            {/* Member Selection Filter */}
            <Paper p="md" mb="xl" withBorder radius="md">
                <Select
                    label="회원 선택"
                    placeholder="상담 이력을 조회할 회원을 선택하세요"
                    data={memberOptions}
                    searchable
                    value={selectedMemberId}
                    onChange={setSelectedMemberId}
                    leftSection={<IconMessageCircle size={16} />}
                    clearable
                />
            </Paper>

            {/* Timeline Content */}
            <Box pos="relative" mih={200}>
                <LoadingOverlay visible={isLoading || isRefetching} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                {!selectedMemberId ? (
                    <Center h={200} bg="gray.0" style={{ borderRadius: 8 }}>
                        <Text c="dimmed">회원을 선택하면 상담 이력이 표시됩니다.</Text>
                    </Center>
                ) : logs.length === 0 ? (
                    <Center h={200} bg="gray.0" style={{ borderRadius: 8 }}>
                        <Text c="dimmed">등록된 상담 기록이 없습니다.</Text>
                    </Center>
                ) : (
                    <Timeline active={logs.length} bulletSize={24} lineWidth={2}>
                        {logs.map((log) => (
                            <Timeline.Item
                                key={log.id}
                                bullet={<Avatar size={24} radius="xl" color="indigo" />}
                                title={
                                    <Group gap="xs">
                                        <Text fw={600} size="sm">{getMemberName(log.membershipId)} 회원님</Text>
                                        <Badge size="sm" variant="light" color="gray">{getCategoryLabel(log.category)}</Badge>
                                    </Group>
                                }
                            >
                                <Text c="dimmed" size="xs" mt={4}>
                                    {dayjs(log.consultedAt).format('YYYY-MM-DD HH:mm')}
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
                )}
            </Box>

            {/* New Log Modal */}
            <Modal opened={opened} onClose={close} title="새 상담 기록 작성" size="lg">
                <LoadingOverlay visible={createLogMutation.isPending} />

                <Select
                    label="회원 선택"
                    placeholder="회원을 검색하세요"
                    data={memberOptions}
                    searchable
                    mb="sm"
                    value={formData.memberId}
                    onChange={(v) => setFormData({ ...formData, memberId: v || '' })}
                    error={!formData.memberId && '회원을 선택해주세요'}
                />

                <Group grow mb="sm">
                    <DatePickerInput
                        label="상담 일시"
                        value={formData.date}
                        onChange={(v) => setFormData({ ...formData, date: (v as any) || new Date() })}
                        maxDate={new Date()}
                    />
                    <Select
                        label="상담 카테고리"
                        data={CATEGORY_DATA}
                        value={formData.category}
                        onChange={(v) => setFormData({ ...formData, category: (v as ConsultationCategory) || 'GENERAL' })}
                        allowDeselect={false}
                    />
                </Group>

                <TagsInput
                    label="태그"
                    description="태그를 입력하고 Enter를 누르세요"
                    placeholder="태그 입력"
                    data={TAG_DATA}
                    mb="sm"
                    value={formData.tags}
                    onChange={(v) => setFormData({ ...formData, tags: v })}
                    clearable
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
                    <Button onClick={handleAddLog} disabled={!formData.memberId || !formData.content}>저장하기</Button>
                </Group>
            </Modal>
        </Container>
    );
}
