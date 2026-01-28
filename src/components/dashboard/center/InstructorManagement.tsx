import { useState } from 'react';
import dayjs from 'dayjs';
import {
    Title,
    Text,
    Group,
    Badge,
    Table,
    Avatar,
    Button,
    Stack,
    Card,
    TextInput,
    Select,
    Divider,
    Grid,
    Alert,
    Center,
    Loader
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IMaskInput } from 'react-imask';
import {
    IconUserCheck,
    IconUserX,
    IconUserPlus,
    IconAlertCircle,
    IconInfoCircle
} from '@tabler/icons-react';
import { InstructorDto } from '@/lib/api';
import { formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useForm } from '@mantine/form';

interface InstructorManagementProps {
    pendingInstructors: InstructorDto[];
    isLoadingPending: boolean;
    onApprove: (instructor: InstructorDto) => void;
    onReject: (instructor: InstructorDto) => void;
    onRegister: (data: any) => void;
    isRegistering: boolean;
}

export default function InstructorManagement({
    pendingInstructors,
    isLoadingPending,
    onApprove,
    onReject,
    onRegister,
    isRegistering
}: InstructorManagementProps) {

    // Direct Register Form
    const form = useForm({
        initialValues: {
            name: '',
            phone: '',
            email: '',
            gender: 'FEMALE',
            birthDate: null as Date | null,
            memo: ''
        },
        validate: {
            name: (val) => (val.length < 2 ? '이름은 2글자 이상이어야 합니다' : null),
            phone: (val) => (/^\d{3}-\d{3,4}-\d{4}$/.test(val) ? null : '올바른 전화번호 형식이 아닙니다 (010-0000-0000)'),
            email: (val) => (val && !/^\S+@\S+$/.test(val) ? '유효하지 않은 이메일입니다' : null)
        }
    });

    const handleFormSubmit = (values: typeof form.values) => {
        onRegister({
            ...values,
            birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined
        });
        form.reset();
    };

    return (
        <Stack gap="xl">
            {/* 1. Pending Approvals Section */}
            <section>
                <Group justify="space-between" mb="md">
                    <Title order={4} c="indigo">가입 승인 대기</Title>
                    {pendingInstructors.length > 0 && (
                        <Badge color="orange" size="lg" circle>{pendingInstructors.length}</Badge>
                    )}
                </Group>

                {isLoadingPending ? (
                    <Center p="xl"><Loader size="sm" /></Center>
                ) : pendingInstructors.length === 0 ? (
                    <Card withBorder radius="md" bg="gray.0" py="xl">
                        <Center>
                            <Stack align="center" gap="xs">
                                <IconUserCheck size={32} color="gray" style={{ opacity: 0.5 }} />
                                <Text c="dimmed" size="sm">대기 중인 가입 요청이 없습니다.</Text>
                            </Stack>
                        </Center>
                    </Card>
                ) : (
                    <Card withBorder radius="md" p={0}>
                        <Table striped highlightOnHover>
                            <Table.Thead bg="orange.0">
                                <Table.Tr>
                                    <Table.Th>신청 강사</Table.Th>
                                    <Table.Th>연락처</Table.Th>
                                    <Table.Th>신청일</Table.Th>
                                    <Table.Th style={{ width: 140, textAlign: 'center' }}>승인 / 거절</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pendingInstructors.map((instructor) => (
                                    <Table.Tr key={instructor.membershipId}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar src={instructor.profileImageUrl} radius="xl" size="sm" />
                                                <Text fw={500} size="sm">{instructor.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>{instructor.phone}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {instructor.approvedAt
                                                    ? formatDistance(new Date(instructor.approvedAt), new Date(), {
                                                        addSuffix: true,
                                                        locale: ko
                                                    })
                                                    : '-'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} justify="center">
                                                <Button
                                                    size="compact-xs"
                                                    color="green"
                                                    onClick={() => onApprove(instructor)}
                                                >
                                                    승인
                                                </Button>
                                                <Button
                                                    size="compact-xs"
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => onReject(instructor)}
                                                >
                                                    거절
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                )}
            </section>

            <Divider />

            {/* 2. Direct Registration Section */}
            <section>
                <Title order={4} mb="md" c="dark">강사 등록</Title>
                <Grid>
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Card withBorder radius="md" p="lg" h="100%">
                            <Stack gap="xs" c="dimmed" fz="sm">
                                <Group gap="xs">
                                    <IconInfoCircle size={18} />
                                    <Text fw={600} size="sm">알아두세요</Text>
                                </Group>
                                <Text>• 강사를 직접 등록하면 별도의 승인 절차 없이 바로 활동 상태가 됩니다.</Text>
                                <Text>• 등록된 강사에게는 가입 안내 메시지가 발송되지 않을 수 있으니 계정 정보를 별도로 전달해주세요.</Text>
                                <Alert color="indigo" variant="light" mt="md" title="Tip" icon={<IconUserPlus size={16} />}>
                                    빠른 등록을 위해 필수 정보만 입력받습니다.
                                </Alert>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Card withBorder radius="md" p="lg">
                            <form onSubmit={form.onSubmit(handleFormSubmit)}>
                                <Stack gap="md">
                                    <Group grow>
                                        <TextInput
                                            label="이름"
                                            placeholder="홍길동"
                                            required
                                            {...form.getInputProps('name')}
                                        />
                                        <TextInput
                                            component={IMaskInput}
                                            {...({ mask: "000-0000-0000" } as any)}
                                            label="연락처"
                                            placeholder="010-0000-0000"
                                            required
                                            {...form.getInputProps('phone')}
                                        />
                                    </Group>
                                    <Group grow>
                                        <Select
                                            label="성별"
                                            data={[
                                                { value: 'FEMALE', label: '여성' },
                                                { value: 'MALE', label: '남성' }
                                            ]}
                                            {...form.getInputProps('gender')}
                                        />
                                        <DateInput
                                            label="생년월일"
                                            placeholder="YYYY-MM-DD"
                                            valueFormat="YYYY-MM-DD"
                                            {...form.getInputProps('birthDate')}
                                        />
                                    </Group>
                                    <TextInput
                                        label="이메일 (선택)"
                                        placeholder="instructor@example.com"
                                        {...form.getInputProps('email')}
                                    />
                                    <TextInput
                                        label="메모"
                                        placeholder="채용 관련 메모"
                                        {...form.getInputProps('memo')}
                                    />

                                    <Group justify="flex-end" mt="md">
                                        <Button type="submit" loading={isRegistering} leftSection={<IconUserPlus size={16} />}>
                                            강사 등록
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Card>
                    </Grid.Col>
                </Grid>
            </section>
        </Stack>
    );
}
