'use client';

import { Container, Title, Text, Stack, TextInput, Button, Paper, Grid, LoadingOverlay, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';

import { authApi } from '@/lib/api'; // Import authApi
import { Select, Modal, ThemeIcon, Center } from '@mantine/core'; // Added Modal, ThemeIcon, Center
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks'; // Added useDisclosure
import { IconCheck, IconX } from '@tabler/icons-react'; // Added IconCheck, IconX, IconAlertCircle
import { IMaskInput } from 'react-imask';

const CENTER_CATEGORIES = [
    { value: '필라테스', label: '필라테스' },
    { value: '헬스', label: '헬스' },
    { value: 'PT', label: 'PT' },
    { value: '요가', label: '요가' },
    { value: '골프', label: '골프' },
    { value: '기타', label: '기타' },
];

export default function RegisterOwnerPage() {
    const { createOwnerOrganization, registrationData, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [storedPhone, setStoredPhone] = useState('');
    const [storedName, setStoredName] = useState('');
    const [createdOrgId, setCreatedOrgId] = useState<number | string | null>(null); // Store ID for redirect using modal
    const [successOpened, { open: openSuccess, close: closeSuccess }] = useDisclosure(false);

    // Error Modal State
    const [errorOpened, { open: openError, close: closeError }] = useDisclosure(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Fallback: sessionStorage -> User Context -> Empty
        const phone = sessionStorage.getItem('pendingPhone') || user?.phone || '';
        const name = sessionStorage.getItem('pendingName') || user?.name || '';

        setStoredPhone(phone);
        setStoredName(name);

        form.setFieldValue('ownerName', name);
        form.setFieldValue('phone', phone);
    }, [user]); // Add user dependency to react if it loads late

    const form = useForm({
        initialValues: {
            centerName: '',
            registrationNumber: '',
            ownerName: '',
            address: '',
            phone: '',
            category: CENTER_CATEGORIES[0].value,
        },
        validate: {
            centerName: (value) => (value.length < 2 ? '센터명을 입력해주세요' : null),
            registrationNumber: (value) =>
                /^\d{3}-\d{2}-\d{5}$/.test(value) ? null : '올바른 사업자 번호 형식이 아닙니다 (000-00-00000)',
            ownerName: (value) => (value.length < 2 ? '대표자 성함을 입력해주세요' : null),
        },
    });


    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const orgId = await createOwnerOrganization({
                organizationName: values.centerName,
                representativeName: values.ownerName,
                businessNumber: values.registrationNumber,
                category: values.category,
                address: values.address,
                organizationPhone: values.phone
            });

            setCreatedOrgId(orgId);
            openSuccess();

        } catch (error: any) {
            console.error(error);
            // Extract error message
            const msg = error?.response?.data?.message || '센터 등록 중 오류가 발생했습니다.';
            notifications.show({
                title: '등록 실패',
                message: msg,
                color: 'red'
            });
            // setErrorMessage(msg);
            // openError();
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        window.location.href = '/login';
    };

    const handleErrorClose = () => {
        closeError();
    };

    return (
        <>
            <Container size="lg" h="100vh" py="xl" style={{ display: 'flex', alignItems: 'center' }}>
                <Grid w="100%" gutter="xl" align="center">
                    {/* Left Side: Guide */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Stack>
                            <Title order={1}>
                                스튜디오의 정보를<br />
                                입력해 주세요
                            </Title>
                            <Text size="lg" c="dimmed">
                                정확한 데이터 관리를 위해<br />
                                사업자 정보와 위치를 등록합니다.
                            </Text>
                        </Stack>
                    </Grid.Col>

                    {/* Right Side: Form */}
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Paper p="xl" radius="md" withBorder shadow="sm" pos="relative">
                            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
                            <form onSubmit={form.onSubmit(handleSubmit)}>
                                <Stack gap="md">
                                    <Select
                                        label="업종 선택"
                                        placeholder="업종을 선택해주세요"
                                        data={CENTER_CATEGORIES}
                                        required
                                        {...form.getInputProps('category')}
                                    />
                                    <TextInput
                                        label="센터명"
                                        placeholder="예: 스튜디오웨이트 강남점"
                                        required
                                        {...form.getInputProps('centerName')}
                                    />

                                    <TextInput
                                        component={IMaskInput}
                                        {...({ mask: '000-00-00000' } as any)}
                                        label="사업자 번호"
                                        placeholder="000-00-00000"
                                        required
                                        {...form.getInputProps('registrationNumber')}
                                    />

                                    <TextInput
                                        label="대표자 성함"
                                        placeholder="홍길동"
                                        required
                                        {...form.getInputProps('ownerName')}
                                    />

                                    <TextInput
                                        label="주소"
                                        placeholder="도로명 주소 입력"
                                        description="상세 주소는 나중에 입력할 수 있습니다."
                                        {...form.getInputProps('address')}
                                    />

                                    <TextInput
                                        component={IMaskInput}
                                        {...({
                                            mask: [
                                                { mask: '00-000-0000' },
                                                { mask: '00-0000-0000' },
                                                { mask: '000-000-0000' },
                                                { mask: '000-0000-0000' }
                                            ]
                                        } as any)}
                                        label="연락처"
                                        placeholder="02-1234-5678"
                                        {...form.getInputProps('phone')}
                                    />

                                    <Button
                                        type="submit"
                                        size="md"
                                        mt="md"
                                        loading={loading}
                                    >
                                        등록 완료
                                    </Button>
                                </Stack>
                            </form>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Container>

            <Modal
                opened={successOpened}
                onClose={handleSuccessClose}
                withCloseButton={false}
                centered
                size="md"
                padding="xl"
                radius="md"
            >
                <Stack align="center" gap="md">
                    <ThemeIcon size={64} radius="full" color="green" variant="light">
                        <IconCheck size={32} />
                    </ThemeIcon>

                    <Title order={3} ta="center">센터 등록 완료</Title>

                    <Text c="dimmed" ta="center" size="sm">
                        센터 등록 신청이 성공적으로 접수되었습니다.<br />
                        관리자 승인 후 서비스를 이용하실 수 있습니다.<br />
                    </Text>

                    <Button
                        fullWidth
                        size="md"
                        mt="md"
                        onClick={handleSuccessClose}
                        color="green"
                    >
                        확인
                    </Button>
                </Stack>
            </Modal>

            <Modal
                opened={errorOpened}
                onClose={handleErrorClose}
                withCloseButton={false}
                centered
                size="md"
                padding="xl"
                radius="md"
            >
                <Stack align="center" gap="md">
                    <ThemeIcon size={64} radius="full" color="red" variant="light">
                        <IconX size={32} />
                    </ThemeIcon>

                    <Title order={3} ta="center">등록 실패</Title>

                    <Text c="dimmed" ta="center" size="sm">
                        {errorMessage}
                    </Text>

                    <Button
                        fullWidth
                        size="md"
                        mt="md"
                        onClick={handleErrorClose}
                        color="red"
                        variant="light"
                    >
                        다시 시도
                    </Button>
                </Stack>
            </Modal>
        </>
    );
}
