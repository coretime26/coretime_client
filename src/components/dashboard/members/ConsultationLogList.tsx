import { Stack, Button, Text, Group, Card, Textarea, Avatar, Badge, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ConsultationLog, useConsultationLogs, useCreateConsultationLog, ConsultationCategory } from '@/features/members';
import { IconPlus, IconMessageCircle } from '@tabler/icons-react';
import { useState } from 'react';
import dayjs from 'dayjs';

interface ConsultationLogListProps {
    memberId: string;
}

const CATEGORY_DATA = [
    { value: 'GENERAL', label: '일반' },
    { value: 'RE_REGISTRATION', label: '재등록' },
    { value: 'COMPLAINT', label: '컴플레인' },
    { value: 'PHYSICAL', label: '건강' },
    { value: 'OTHER', label: '기타' }
];

export default function ConsultationLogList({ memberId }: ConsultationLogListProps) {
    const { data: logs = [] } = useConsultationLogs(memberId);
    const { mutate: addLog } = useCreateConsultationLog();
    const [isAdding, setIsAdding] = useState(false);

    // Filter logs for this member (redundant if hook filters, but safe)
    const memberLogs = logs.filter((l: ConsultationLog) => l.membershipId.toString() === memberId)
        .sort((a, b) => new Date(b.consultedAt).getTime() - new Date(a.consultedAt).getTime());

    const form = useForm({
        initialValues: {
            content: '',
            category: 'GENERAL' as ConsultationCategory,
        },
        validate: {
            content: (value) => (value.trim().length > 0 ? null : '내용을 입력해주세요.'),
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        addLog({
            membershipId: memberId,
            category: values.category,
            content: values.content,
            tags: [], // Simple list doesn't support tags yet
            consultedAt: new Date()
        });
        setIsAdding(false);
        form.reset();
    };

    const getCategoryLabel = (cat: string) => CATEGORY_DATA.find(c => c.value === cat)?.label || cat;

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Text fw={600}>상담/관리 기록 ({memberLogs.length})</Text>
                <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? '취소' : '기록 추가'}
                </Button>
            </Group>

            {isAdding && (
                <Card withBorder radius="md" bg="gray.0">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Select
                            size="xs"
                            mb="xs"
                            data={CATEGORY_DATA}
                            defaultValue="GENERAL"
                            style={{ maxWidth: 120 }}
                            allowDeselect={false}
                            {...form.getInputProps('category')}
                        />
                        <Textarea
                            placeholder="상담 내용을 입력하세요..."
                            minRows={3}
                            mb="xs"
                            autoFocus
                            {...form.getInputProps('content')}
                        />
                        <Group justify="flex-end">
                            <Button size="xs" type="submit">저장</Button>
                        </Group>
                    </form>
                </Card>
            )}

            {memberLogs.length > 0 ? (
                memberLogs.map((log) => (
                    <Card key={String(log.id)} withBorder radius="md" p="md">
                        <Group justify="space-between" align="start" mb={4}>
                            <Group gap="xs">
                                <Avatar size="sm" radius="xl" color="blue" />
                                <Text size="sm" fw={600}>관리자({log.operatorAccountId})</Text>
                                <Badge size="xs" variant="light">{getCategoryLabel(log.category)}</Badge>
                            </Group>
                            <Text size="xs" c="dimmed">
                                {dayjs(log.consultedAt).format('YYYY-MM-DD HH:mm')}
                            </Text>
                        </Group>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{log.content}</Text>
                        {log.tags && log.tags.length > 0 && (
                            <Group gap={4} mt="xs">
                                {log.tags.map((tag) => (
                                    <Badge key={tag} size="xs" variant="dot" color="gray">{tag}</Badge>
                                ))}
                            </Group>
                        )}
                    </Card>
                ))
            ) : (
                !isAdding && (
                    <Stack align="center" py="xl" c="dimmed">
                        <IconMessageCircle size={32} stroke={1.5} />
                        <Text size="sm">아직 상담 기록이 없습니다.</Text>
                    </Stack>
                )
            )}
        </Stack>
    );
}
