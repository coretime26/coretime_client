'use client';

import { Container, Title, Text, Stack, Card, Button, Group, Badge, SimpleGrid, ThemeIcon, LoadingOverlay } from '@mantine/core';
import { IconBuilding, IconPlus, IconArrowRight, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, OrganizationDto } from '@/lib/api';
import { useAuth } from '@/features/auth';

export default function MyCentersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [centers, setCenters] = useState<OrganizationDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        setLoading(true);
        try {
            // 1. Check if user belongs to an organization
            const me = await authApi.getMe();
            if (me.organizationId) {
                // 2. We have an ID. Try to get details from the list of centers (or specific endpoint if it existed)
                // Assuming 3.2 Get Organizations returns all active centers.
                // 2. We have an ID. Try to get details from the list of centers
                // Fetch specific center
                const allCenters = await authApi.getOrganizations([me.organizationId]);
                const myCenter = allCenters.find(c => c.id === me.organizationId);

                if (myCenter) {
                    setCenters([myCenter]);
                } else {
                    // Fallback if not found in list (e.g. pending or issue)
                    // Construct partial from 'me'
                    setCenters([{
                        id: me.organizationId,
                        name: me.organizationName || '내 센터',
                        address: '주소 정보 없음',
                        status: 'ACTIVE' // or UNKNOWN
                    } as OrganizationDto]);
                }
            } else {
                setCenters([]);
            }
        } catch (error) {
            console.error('Failed to fetch centers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        router.push('/register/create-center');
    };

    const handleManage = (id: string) => {
        router.push(`/center/manage/${id}`);
    };

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Stack gap={0}>
                        <Title order={2}>내 센터 관리</Title>
                        <Text c="dimmed">등록된 센터 목록과 상태를 확인하세요.</Text>
                    </Stack>
                    <Button leftSection={<IconPlus size={18} />} onClick={handleCreateNew}>
                        새 센터 등록
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {loading ? (
                        <LoadingOverlay visible={true} zIndex={100} overlayProps={{ radius: "sm", blur: 2 }} />
                    ) : centers.length > 0 ? (
                        centers.map((center) => (
                            <Card key={center.id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Card.Section withBorder inheritPadding py="md" bg="gray.0">
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                                                <IconBuilding size={16} />
                                            </ThemeIcon>
                                            <Text fw={600} size="md" truncate>{center.name}</Text>
                                        </Group>
                                        {/* Mock Status Badge - API doesn't have status yet, assume Active */}
                                        <Badge color="green">운영중</Badge>
                                    </Group>
                                </Card.Section>

                                <Stack mt="md" gap="xs">
                                    <Text size="sm" c="dimmed">주소: {center.address}</Text>
                                    <Text size="sm" c="dimmed">대표자: {center.representativeName}</Text>
                                    <Text size="sm" c="dimmed">연락처: {center.phone || '-'}</Text>
                                </Stack>

                                <Button
                                    fullWidth
                                    mt="md"
                                    variant="light"
                                    rightSection={<IconArrowRight size={16} />}
                                    onClick={() => handleManage(center.id)}
                                >
                                    관리하기
                                </Button>
                            </Card>
                        ))
                    ) : (
                        <Card withBorder padding="xl" radius="md" style={{ gridColumn: '1 / -1' }}>
                            <Stack align="center" gap="md" py="xl">
                                <ThemeIcon size={60} radius="circle" variant="light" color="gray">
                                    <IconBuilding size={30} />
                                </ThemeIcon>
                                <Text size="lg" fw={500}>등록된 센터가 없습니다.</Text>
                                <Text size="sm" c="dimmed">새로운 센터를 등록하고 운영을 시작해보세요.</Text>
                                <Button onClick={handleCreateNew} variant="outline" color="dark">
                                    첫 센터 등록하기
                                </Button>
                            </Stack>
                        </Card>
                    )}
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
