'use client';

import {
    Title, Text, Container, SimpleGrid, Card, Group,
    RingProgress, Center, ThemeIcon, Progress
} from '@mantine/core';
import { IconTrendingUp, IconCreditCard, IconReceipt } from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
// import { BarChart } from '@mantine/charts'; // Assuming available or simulate with simple bars

export default function FinanceStatsPage() {
    const { transactions } = useFinance();

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const cardRevenue = transactions.filter(tx => tx.method === 'CARD').reduce((sum, tx) => sum + tx.amount, 0);

    // Simulate data for chart (if real charts installed, use them. Else Custom Bar)
    const mockDailyData = [
        { date: '1/15', value: 150000 },
        { date: '1/16', value: 300000 },
        { date: '1/17', value: 0 },
        { date: '1/18', value: 700000 },
        { date: '1/19', value: 450000 },
    ];

    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="lg">매출 통계 (Revenue Stats)</Title>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
                <StatCard label="총 매출 (Total Sales)" value={totalRevenue} icon={IconTrendingUp} color="indigo" />
                <StatCard label="카드 결제" value={cardRevenue} icon={IconCreditCard} color="blue" />
                <StatCard label="계좌 이체 / 현금" value={totalRevenue - cardRevenue} icon={IconReceipt} color="green" />
            </SimpleGrid>

            {/* Simple Bar Visualization */}
            <Card withBorder radius="md" p="xl">
                <Text fw={700} size="lg" mb="lg">최근 5일 매출 추이</Text>
                <Group align="flex-end" justify="space-around" h={200} bg="gray.0" style={{ borderRadius: 8 }} p="md">
                    {mockDailyData.map((d) => (
                        <div key={d.date} style={{ textAlign: 'center', width: '100%' }}>
                            <div
                                style={{
                                    height: `${(d.value / 1000000) * 150}px`,
                                    background: '#5c7cfa',
                                    width: '40px',
                                    margin: '0 auto',
                                    borderRadius: '4px 4px 0 0'
                                }}
                            />
                            <Text size="xs" mt="xs" c="dimmed">{d.date}</Text>
                        </div>
                    ))}
                </Group>
            </Card>
        </Container>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
                <div>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        {label}
                    </Text>
                    <Text fw={700} size="xl" mt="xs">
                        {value.toLocaleString()}원
                    </Text>
                </div>
                <ThemeIcon size="xl" radius="md" variant="light" color={color}>
                    <Icon size={24} />
                </ThemeIcon>
            </Group>
        </Card>
    );
}
