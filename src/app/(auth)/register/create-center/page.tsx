'use client';

import { Container, Title, Text, Stack, TextInput, Button, Paper, Grid, LoadingOverlay, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

export default function CreateCenterPage() {
    const { user } = useAuth(); // User is already logged in
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            centerName: '',
            registrationNumber: '',
            ownerName: user?.name || '',
            address: '',
            phone: user?.phone || '',
            category: '필라테스',
        },
        validate: {
            centerName: (value) => (value.length < 2 ? '센터명을 입력해주세요' : null),
            registrationNumber: (value) =>
                /^\d{3}-\d{2}-\d{5}$/.test(value) ? null : '올바른 사업자 번호 형식이 아닙니다 (000-00-00000)',
            ownerName: (value) => (value.length < 2 ? '대표자 성함을 입력해주세요' : null),
        },
    });

    const handleRegistrationNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value.replace(/[^\d]/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        // Auto format 000-00-00000
        if (value.length >= 3 && value.length < 5) value = `${value.slice(0, 3)}-${value.slice(3)}`;
        else if (value.length >= 5) value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
        form.setFieldValue('registrationNumber', value);
    };

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            // Create Center
            await authApi.registerOrganization({
                organizationName: values.centerName,
                representativeName: values.ownerName,
                businessNumber: values.registrationNumber,
                category: values.category,
                address: values.address,
                organizationPhone: values.phone
            });
            // Success -> Go to Center List or Dashboard
            // Ideally refetch organizations or switch context
            router.push('/');
        } catch (error) {
            console.error(error);
            notifications.show({
                title: '오류',
                message: '센터 등록 중 오류가 발생했습니다.',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="lg" h="100vh" py="xl" style={{ display: 'flex', alignItems: 'center' }}>
            <Grid w="100%" gutter="xl" align="center">
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Stack>
                        <Title order={1}>새로운 센터 등록</Title>
                        <Text size="lg" c="dimmed">
                            추가로 운영하실 센터 정보를<br />입력해 주세요.
                        </Text>
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper p="xl" radius="md" withBorder shadow="sm" pos="relative">
                        <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <Select
                                    label="업종 선택"
                                    placeholder="업종을 선택해주세요"
                                    data={[
                                        { value: '필라테스', label: '필라테스' },
                                        { value: '헬스', label: '헬스' },
                                        { value: 'PT', label: 'PT' },
                                        { value: '요가', label: '요가' },
                                        { value: '골프', label: '골프' },
                                        { value: '기타', label: '기타' },
                                    ]}
                                    required
                                    {...form.getInputProps('category')}
                                />
                                <TextInput label="센터명" placeholder="예: 스튜디오웨이트 2호점" required {...form.getInputProps('centerName')} />
                                <TextInput label="사업자 번호" placeholder="000-00-00000" required maxLength={12} {...form.getInputProps('registrationNumber')} onChange={handleRegistrationNumberChange} />
                                <TextInput label="대표자 성함" placeholder="홍길동" required {...form.getInputProps('ownerName')} />
                                <TextInput label="주소" placeholder="도로명 주소 입력" {...form.getInputProps('address')} />
                                <TextInput label="연락처" placeholder="02-1234-5678" {...form.getInputProps('phone')} />
                                <Button type="submit" size="md" mt="md" loading={loading}>등록하기</Button>
                            </Stack>
                        </form>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
