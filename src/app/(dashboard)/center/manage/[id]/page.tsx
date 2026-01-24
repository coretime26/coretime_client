'use client';

import { Container, Title, Text, Stack, Card, Button, Tabs, TextInput, Group, Alert, Badge, ActionIcon, Table, LoadingOverlay, Box, CopyButton, Tooltip, rem, ThemeIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX, IconInfoCircle, IconRefresh, IconCopy, IconUserCheck, IconUserX, IconTicket, IconBuilding } from '@tabler/icons-react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, RegisterOrganizationCommand, OrganizationDto, InviteCodeResult } from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CenterManagePage({ params }: PageProps) {
    const { id } = use(params);
    const centerId = Number(id);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<string | null>('info');
    const [center, setCenter] = useState<OrganizationDto | null>(null);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [inviteCode, setInviteCode] = useState<InviteCodeResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Forms
    const infoForm = useForm({
        initialValues: {
            name: '',
            representativeName: '',
            businessNumber: '',
            category: 'Pilates',
            address: '',
            phone: '',
        },
        // validation rules...
    });

    useEffect(() => {
        if (centerId) {
            fetchCenterInfo();
        }
    }, [centerId]);

    const fetchCenterInfo = async () => {
        setLoading(true);
        try {
            // New Spec: Owner gets their center via 1.3 Get My Info or 3.2 Get All Centers (if active)
            // But 3.2 is 'All Centers'. 
            // We should use `getMe` to identify the user's organizationId
            const me = await authApi.getMe();
            if (me.organizationId === centerId) {
                setCenter({
                    id: me.organizationId,
                    name: me.organizationName,
                    address: '', // MeResult doesn't have address. We might need to fetch details from another endpoint or 3.2 list?
                    // Let's try 3.2 to get full details matching the ID
                    phone: ''
                } as OrganizationDto);

                // Fetch full details from public list?
                const allCenters = await authApi.getOrganizations();
                const detail = allCenters.find(c => c.id === centerId);
                if (detail) {
                    setCenter(detail);
                    infoForm.setValues({
                        name: detail.name,
                        representativeName: detail.representativeName || '',
                        businessNumber: '000-00-00000',
                        category: 'Pilates',
                        address: detail.address,
                        phone: detail.phone || ''
                    });
                }
            } else {
                // If trying to access a center that isn't yours?
                alert('권한이 없습니다.');
                router.push('/center');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSaveInfo = async (values: typeof infoForm.values) => {
        // Spec 3.1 is Register (POST). No Update (PUT/PATCH) documented in new spec.
        // Assuming update is not available or same endpoint?
        // For now, disabling or just alerting.
        alert('센터 정보 수정 기능은 API 명세서에 없습니다.');
    };

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            // Spec separate Active vs Pending
            // We want to show both?
            const [active, pending] = await Promise.all([
                authApi.getActiveInstructors(),
                authApi.getPendingInstructors()
            ]);
            // Merge or separate? The UI uses one table.
            // Let's merge them.
            setInstructors([...pending, ...active]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleApprove = async (membershipId: number) => {
        if (!confirm('승인하시겠습니까?')) return;
        try {
            await authApi.updateMembershipStatus(membershipId, true);
            fetchInstructors(); // Refresh
        } catch (e) { alert('처리 실패'); }
    };

    const handleReject = async (membershipId: number) => {
        if (!confirm('거절하시겠습니까?')) return;
        try {
            await authApi.updateMembershipStatus(membershipId, false);
            fetchInstructors();
        } catch (e) { alert('처리 실패'); }
    };

    const fetchInviteCode = async () => {
        setLoading(true);
        try {
            const data = await authApi.getInviteCode(centerId);
            setInviteCode(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleReissueCode = async () => {
        if (!confirm('새로운 코드를 발급하시겠습니까? 기존 코드는 만료됩니다.')) return;
        setLoading(true);
        try {
            const data = await authApi.reissueInviteCode(centerId);
            setInviteCode(data);
        } catch (e) { alert('발급 실패'); }
        finally { setLoading(false); }
    };

    // Tab Change Handler
    const handleTabChange = (value: string | null) => {
        setActiveTab(value);
        if (value === 'instructors') fetchInstructors();
        if (value === 'invite') fetchInviteCode();
    };

    if (!center) return <LoadingOverlay visible />; // Better loading state needed

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={2}>{center.name} 관리</Title>
                    <Button variant="default" onClick={() => router.push('/center')}>목록으로</Button>
                </Group>

                <Tabs value={activeTab} onChange={handleTabChange} radius="md" keepMounted={false}>
                    <Tabs.List>
                        <Tabs.Tab value="info" leftSection={<IconBuilding size={16} />}>기본 정보</Tabs.Tab>
                        <Tabs.Tab value="instructors" leftSection={<IconUserCheck size={16} />}>강사 관리</Tabs.Tab>
                        <Tabs.Tab value="invite" leftSection={<IconTicket size={16} />}>초대 코드</Tabs.Tab>
                    </Tabs.List>

                    {/* Tab: Info */}
                    <Tabs.Panel value="info" pt="xl">
                        <Card withBorder padding="xl" radius="md">
                            <form onSubmit={infoForm.onSubmit(handleSaveInfo)}>
                                <Stack gap="md" maw={600}>
                                    <TextInput label="센터명" {...infoForm.getInputProps('name')} />
                                    <TextInput label="대표자명" {...infoForm.getInputProps('representativeName')} />
                                    <TextInput label="주소" {...infoForm.getInputProps('address')} />
                                    <TextInput label="연락처" {...infoForm.getInputProps('phone')} />
                                    <Group mt="md">
                                        <Button type="submit" loading={loading}>저장하기</Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Card>
                    </Tabs.Panel>

                    {/* Tab: Instructors */}
                    <Tabs.Panel value="instructors" pt="xl">
                        <Card withBorder padding="lg" radius="md">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Title order={4}>강사 목록</Title>
                                    <Button variant="light" size="xs" leftSection={<IconRefresh size={14} />} onClick={fetchInstructors}>새로고침</Button>
                                </Group>

                                <Table verticalSpacing="sm" withTableBorder>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>이름</Table.Th>
                                            <Table.Th>이메일</Table.Th>
                                            <Table.Th>상태</Table.Th>
                                            <Table.Th>관리</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {instructors.length > 0 ? instructors.map((inst) => (
                                            <Table.Tr key={inst.id}>
                                                <Table.Td>{inst.name}</Table.Td>
                                                <Table.Td>{inst.email}</Table.Td>
                                                <Table.Td>
                                                    <Badge color={inst.status === 'PENDING_APPROVAL' ? 'yellow' : inst.status === 'ACTIVE' ? 'green' : 'gray'}>
                                                        {inst.status === 'PENDING_APPROVAL' ? '승인 대기' : inst.status === 'ACTIVE' ? '활동 중' : inst.status}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    {inst.status === 'PENDING_APPROVAL' && (
                                                        <Group gap="xs">
                                                            <Button size="compact-xs" color="green" onClick={() => handleApprove(inst.id)}>승인</Button>
                                                            <Button size="compact-xs" color="red" variant="subtle" onClick={() => handleReject(inst.id)}>거절</Button>
                                                        </Group>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        )) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={4} align="center">
                                                    <Text c="dimmed" py="xl">등록된 강사가 없습니다.</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </Stack>
                        </Card>
                    </Tabs.Panel>

                    {/* Tab: Invite Code */}
                    <Tabs.Panel value="invite" pt="xl">
                        <Card withBorder padding="xl" radius="md">
                            <Stack align="center" gap="xl" py="lg">
                                <Stack align="center" gap="xs">
                                    <ThemeIcon size={60} radius="circle" variant="light" color="indigo">
                                        <IconTicket size={32} />
                                    </ThemeIcon>
                                    <Title order={3}>강사 초대 코드</Title>
                                    <Text c="dimmed" ta="center" maw={400}>
                                        강사가 회원가입 시 이 코드를 입력하면<br />
                                        자동으로 본 센터 소속으로 신청됩니다.
                                    </Text>
                                </Stack>

                                {inviteCode ? (
                                    <Stack align="center" gap="md" w="100%" maw={400}>
                                        <Box
                                            bg="gray.1"
                                            p="xl"
                                            style={{ borderRadius: 12, fontSize: 32, fontWeight: 700, letterSpacing: 4, width: '100%', textAlign: 'center', border: '1px dashed #ced4da' }}
                                        >
                                            {inviteCode.code}
                                        </Box>

                                        <Group gap="xs">
                                            <Badge color="red" variant="dot" size="lg">
                                                만료: {new Date(inviteCode.expireAt).toLocaleString()}
                                            </Badge>
                                            {/* Timer visual could go here */}
                                        </Group>

                                        <Group w="100%" mt="sm">
                                            <CopyButton value={inviteCode.code} timeout={2000}>
                                                {({ copied, copy }) => (
                                                    <Button color={copied ? 'teal' : 'blue'} onClick={copy} fullWidth leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}>
                                                        {copied ? '복사됨' : '코드 복사'}
                                                    </Button>
                                                )}
                                            </CopyButton>
                                            <Button variant="default" fullWidth onClick={handleReissueCode} loading={loading}>
                                                새로 발급하기
                                            </Button>
                                        </Group>
                                    </Stack>
                                ) : (
                                    <Stack align="center">
                                        <Text>활성화된 코드가 없습니다.</Text>
                                        <Button onClick={handleReissueCode} loading={loading}>코드 발급하기</Button>
                                    </Stack>
                                )}
                            </Stack>
                        </Card>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
