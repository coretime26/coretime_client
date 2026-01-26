'use client';

import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    Button,
    Group,
    Stack,
    Avatar,
    FileInput,
    Divider,
    Switch,
    Box,
    ActionIcon,
    LoadingOverlay,
    Grid,
    Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCamera, IconUser, IconPhone, IconMail, IconDeviceFloppy, IconX, IconUpload } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { profileApi, NotificationSettings } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function ProfileSettingsPage() {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Profile form
    const profileForm = useForm({
        initialValues: {
            name: user?.name || '',
            phone: '',
        },
        validate: {
            name: (value) => (value.trim().length < 2 ? '이름은 최소 2자 이상이어야 합니다' : null),
            phone: (value) => {
                if (!value) return null;
                const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
                return phoneRegex.test(value) ? null : '올바른 전화번호 형식이 아닙니다';
            },
        },
    });

    // Notification settings query
    const { data: notificationSettings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: profileApi.getNotificationSettings,
        initialData: {
            emailNotifications: true,
            smsNotifications: true,
            reservationReminder: true,
            marketingConsent: false,
        },
    });

    const [localNotificationSettings, setLocalNotificationSettings] = useState<NotificationSettings>(
        notificationSettings
    );

    useEffect(() => {
        if (notificationSettings) {
            setLocalNotificationSettings(notificationSettings);
        }
    }, [notificationSettings]);

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: profileApi.updateProfile,
        onSuccess: () => {
            notifications.show({
                title: '프로필 업데이트 성공',
                message: '프로필 정보가 성공적으로 업데이트되었습니다.',
                color: 'teal',
            });
            refreshUser();
        },
        onError: () => {
            notifications.show({
                title: '프로필 업데이트 실패',
                message: '프로필 정보를 업데이트하는 중 오류가 발생했습니다.',
                color: 'red',
            });
        },
    });

    // Upload avatar mutation
    const uploadAvatarMutation = useMutation({
        mutationFn: profileApi.uploadAvatar,
        onSuccess: (data) => {
            notifications.show({
                title: '프로필 사진 업로드 성공',
                message: '프로필 사진이 성공적으로 업데이트되었습니다.',
                color: 'teal',
            });
            setAvatarFile(null);
            setAvatarPreview(null);
            setIsUploading(false);
            refreshUser();
        },
        onError: () => {
            notifications.show({
                title: '프로필 사진 업로드 실패',
                message: '프로필 사진을 업로드하는 중 오류가 발생했습니다.',
                color: 'red',
            });
            setIsUploading(false);
        },
    });

    // Update notification settings mutation
    const updateNotificationsMutation = useMutation({
        mutationFn: profileApi.updateNotificationSettings,
        onSuccess: () => {
            notifications.show({
                title: '알림 설정 업데이트 성공',
                message: '알림 설정이 성공적으로 업데이트되었습니다.',
                color: 'teal',
            });
            queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
        },
        onError: () => {
            notifications.show({
                title: '알림 설정 업데이트 실패',
                message: '알림 설정을 업데이트하는 중 오류가 발생했습니다.',
                color: 'red',
            });
        },
    });

    // Handle avatar file change
    const handleAvatarChange = (file: File | null) => {
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload avatar
    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setIsUploading(true);
        uploadAvatarMutation.mutate(avatarFile);
    };

    // Cancel avatar upload
    const handleCancelAvatarUpload = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    // Handle profile submit
    const handleProfileSubmit = profileForm.onSubmit((values) => {
        updateProfileMutation.mutate(values);
    });

    // Handle notification settings change
    const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
        const updatedSettings = { ...localNotificationSettings, [key]: value };
        setLocalNotificationSettings(updatedSettings);
        updateNotificationsMutation.mutate(updatedSettings);
    };

    if (!user) {
        return null;
    }

    return (
        <Container size="lg" py="xl">
            {/* Header */}
            <Box
                mb="xl"
                p="xl"
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    color: 'white',
                }}
            >
                <Title order={2} mb="xs">
                    프로필 설정
                </Title>
                <Text size="sm" opacity={0.9}>
                    개인 정보와 계정 설정을 관리하세요
                </Text>
            </Box>

            {/* Profile Section - Integrated */}
            <Paper shadow="sm" p="xl" radius="md" mb="lg">
                <LoadingOverlay visible={updateProfileMutation.isPending} />
                <form onSubmit={handleProfileSubmit}>
                    <Stack gap="lg">
                        <div>
                            <Title order={4} mb={4}>
                                기본 정보
                            </Title>
                            <Text size="sm" c="dimmed">
                                프로필 사진과 기본 정보를 업데이트하세요
                            </Text>
                        </div>

                        <Divider />

                        <Grid gutter="xl">
                            {/* Left: Profile Picture */}
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <Stack gap="md" align="center">
                                    <Box pos="relative">
                                        <Avatar
                                            src={avatarPreview || user.profileImageUrl || undefined}
                                            size={150}
                                            radius="xl"
                                            name={user.name}
                                            color="initials"
                                            style={{
                                                border: '4px solid var(--mantine-color-gray-2)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <ActionIcon
                                            size="xl"
                                            radius="xl"
                                            variant="filled"
                                            color="indigo"
                                            style={{
                                                position: 'absolute',
                                                bottom: 5,
                                                right: 5,
                                                border: '3px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            <IconCamera size={20} />
                                        </ActionIcon>
                                    </Box>

                                    <Stack gap="xs" style={{ width: '100%' }}>
                                        <FileInput
                                            placeholder="이미지 선택"
                                            accept="image/*"
                                            value={avatarFile}
                                            onChange={handleAvatarChange}
                                            leftSection={<IconUpload size={16} />}
                                            size="sm"
                                        />
                                        {avatarFile && (
                                            <Group gap="xs" justify="center">
                                                <Button
                                                    size="xs"
                                                    leftSection={<IconDeviceFloppy size={14} />}
                                                    onClick={handleAvatarUpload}
                                                    loading={isUploading}
                                                    fullWidth
                                                >
                                                    업로드
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="red"
                                                    leftSection={<IconX size={14} />}
                                                    onClick={handleCancelAvatarUpload}
                                                    fullWidth
                                                >
                                                    취소
                                                </Button>
                                            </Group>
                                        )}
                                    </Stack>
                                </Stack>
                            </Grid.Col>

                            {/* Right: Basic Information Form */}
                            <Grid.Col span={{ base: 12, sm: 8 }}>
                                <Stack gap="md">
                                    <TextInput
                                        label="이름"
                                        placeholder="이름을 입력하세요"
                                        leftSection={<IconUser size={16} />}
                                        required
                                        {...profileForm.getInputProps('name')}
                                    />

                                    <TextInput
                                        label="이메일"
                                        placeholder={user.email || '이메일'}
                                        leftSection={<IconMail size={16} />}
                                        disabled
                                        value={user.email || ''}
                                        description="이메일은 변경할 수 없습니다"
                                    />

                                    <TextInput
                                        label="전화번호"
                                        placeholder="010-1234-5678"
                                        leftSection={<IconPhone size={16} />}
                                        {...profileForm.getInputProps('phone')}
                                    />

                                    <Group justify="flex-end" mt="md">
                                        <Button type="submit" leftSection={<IconDeviceFloppy size={16} />}>
                                            변경사항 저장
                                        </Button>
                                    </Group>
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Stack>
                </form>
            </Paper>

            {/* Notification Settings Section */}
            <Paper shadow="sm" p="xl" radius="md" mb="lg">
                <Stack gap="md">
                    <div>
                        <Title order={4} mb={4}>
                            알림 설정
                        </Title>
                        <Text size="sm" c="dimmed">
                            받고 싶은 알림을 선택하세요
                        </Text>
                    </div>

                    <Divider />

                    <Switch
                        label="이메일 알림"
                        description="중요한 업데이트를 이메일로 받습니다"
                        checked={localNotificationSettings.emailNotifications}
                        onChange={(event) =>
                            handleNotificationChange('emailNotifications', event.currentTarget.checked)
                        }
                    />

                    <Switch
                        label="SMS 알림"
                        description="문자 메시지로 알림을 받습니다"
                        checked={localNotificationSettings.smsNotifications}
                        onChange={(event) =>
                            handleNotificationChange('smsNotifications', event.currentTarget.checked)
                        }
                    />

                    <Switch
                        label="예약 알림"
                        description="수업 예약 및 취소 알림을 받습니다"
                        checked={localNotificationSettings.reservationReminder}
                        onChange={(event) =>
                            handleNotificationChange('reservationReminder', event.currentTarget.checked)
                        }
                    />

                    <Switch
                        label="마케팅 수신 동의"
                        description="프로모션 및 이벤트 정보를 받습니다"
                        checked={localNotificationSettings.marketingConsent}
                        onChange={(event) =>
                            handleNotificationChange('marketingConsent', event.currentTarget.checked)
                        }
                    />
                </Stack>
            </Paper>

            {/* Danger Zone - Account Deletion */}
            <Paper shadow="sm" p="xl" radius="md" style={{ borderWidth: '2px', borderStyle: 'solid' }}>
                <Stack gap="md">
                    <div>
                        <Text size="sm" c="dimmed">
                            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
                        </Text>
                    </div>

                    <Divider color="red" />

                    <Group justify="space-between" align="center">
                        <div>
                            <Text fw={600} size="sm" mb={4}>
                                회원 탈퇴
                            </Text>
                            <Text size="xs" c="dimmed">
                                계정과 모든 관련 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                            </Text>
                        </div>
                        <Button
                            color="red"
                            variant="outline"
                            onClick={() => {
                                modals.openConfirmModal({
                                    title: '회원 탈퇴',
                                    centered: true,
                                    children: (
                                        <Stack gap="md">
                                            <Text size="sm">
                                                정말로 계정을 삭제하시겠습니까?
                                            </Text>
                                            <Text size="sm" c="red" fw={600}>
                                                이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                • 프로필 정보<br />
                                                • 수업 기록<br />
                                                • 예약 내역<br />
                                                • 결제 정보
                                            </Text>
                                        </Stack>
                                    ),
                                    labels: { confirm: '계정 삭제', cancel: '취소' },
                                    confirmProps: { color: 'red' },
                                    onConfirm: async () => {
                                        try {
                                            await profileApi.deleteAccount();
                                            notifications.show({
                                                title: '계정 삭제 완료',
                                                message: '계정이 성공적으로 삭제되었습니다.',
                                                color: 'teal',
                                            });
                                            setTimeout(() => {
                                                window.location.href = '/login';
                                            }, 1000);
                                        } catch (error) {
                                            notifications.show({
                                                title: '계정 삭제 실패',
                                                message: '계정을 삭제하는 중 오류가 발생했습니다.',
                                                color: 'red',
                                            });
                                        }
                                    },
                                });
                            }}
                        >
                            계정 삭제
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}
