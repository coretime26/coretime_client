import { Modal, Textarea, Button, Group, Text, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceMobileMessage } from '@tabler/icons-react';
import { Member } from '@/features/members';
import { useEffect } from 'react';

interface AlimTalkModalProps {
    opened: boolean;
    onClose: () => void;
    member: Member | null;
}

export default function AlimTalkModal({ opened, onClose, member }: AlimTalkModalProps) {
    const form = useForm({
        initialValues: {
            message: '',
        },
        validate: {
            message: (value) => (value.trim().length > 0 ? null : '메시지 내용을 입력해주세요.'),
        },
    });

    // Reset form when modal opens or member changes
    useEffect(() => {
        if (opened) {
            form.setValues({ message: '' });
        }
    }, [opened, member]);

    const handleSubmit = (values: typeof form.values) => {
        if (!member) return;

        // Mock sending AlimTalk
        console.log(`Sending AlimTalk to ${member.name} (${member.phone}): ${values.message}`);

        notifications.show({
            title: '알림톡 발송 완료',
            message: `${member.name}님에게 알림톡을 성공적으로 발송했습니다.`,
            color: 'green',
            icon: <IconDeviceMobileMessage size={18} />
        });

        onClose();
        form.reset();
    };

    if (!member) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="알림톡 발송"
            centered
            zIndex={300} // Ensure it appears above Drawer
        >
            <Box mb="sm">
                <Text size="sm" fw={500}>수신자: {member.name} ({member.phone})</Text>
            </Box>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Textarea
                    label="메시지 내용"
                    placeholder="알림톡 내용을 입력하세요..."
                    minRows={4}
                    mb="lg"
                    data-autofocus
                    {...form.getInputProps('message')}
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>취소</Button>
                    <Button type="submit" color="yellow" c="dark">발송하기</Button>
                </Group>
            </form>
        </Modal>
    );
}
