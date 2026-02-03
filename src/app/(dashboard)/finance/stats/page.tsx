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

                {isTxLoading ? <Skeleton h={400} /> : (
                    <>
                        <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
                            <Table.Thead bg="gray.0">
                                <Table.Tr>
                                    <Table.Th>승인일시</Table.Th>
                                    <Table.Th>상품명</Table.Th>
                                    <Table.Th>회원명</Table.Th>
                                    <Table.Th>결제수단</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>금액</Table.Th>
                                    <Table.Th style={{ textAlign: 'center' }}>상태</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {transactionsData?.list && transactionsData.list.length > 0 ? (
                                    transactionsData.list.map((tx) => (
                                        <Table.Tr key={tx.id}>
                                            <Table.Td>{dayjs(tx.paidAt).format('YYYY-MM-DD HH:mm')}</Table.Td>
                                            <Table.Td fw={500}>{tx.productName}</Table.Td>
                                            <Table.Td>{tx.memberName}</Table.Td>
                                            <Table.Td>
                                                <Badge variant="dot" color={PAYMENT_METHOD_COLORS[tx.method as PaymentMethod]?.split('.')[0] || 'gray'}>
                                                    {PAYMENT_METHOD_LABELS[tx.method as PaymentMethod] || tx.method}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{tx.amount.toLocaleString()}원</Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Badge
                                                    size="sm"
                                                    variant="light"
                                                    color={tx.status === 'PAID' ? 'green' : 'red'}
                                                >
                                                    {tx.status === 'PAID' ? '결제완료' : '환불완료'}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                ) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={6}>
                                            <Center py={60}>
                                                <Stack align="center" gap="xs">
                                                    <IconDatabaseOff size={40} style={{ opacity: 0.2 }} />
                                                    <Text c="dimmed" fw={500}>해당 기간의 상세 매출 내역이 없습니다.</Text>
                                                </Stack>
                                            </Center>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>

                        {transactionsData && transactionsData.pagination.totalPages > 1 && (
                            <Group justify="center" mt="xl">
                                <Pagination
                                    total={transactionsData.pagination.totalPages}
                                    value={page}
                                    onChange={setPage}
                                />
                            </Group>
                        )}
                    </>
                )}
            </Paper>
        </Container>
    );
}

// Helper: Dashboard Stat Item
function StatItem({ label, value, icon: Icon, color, trend, desc }: any) {
    return (
        <Stack gap={4}>
            <Group justify="space-between" align="flex-start">
                <Text c="dimmed" size="xs" fw={700} tt="uppercase">{label}</Text>
                <ThemeIcon variant="light" color={color} radius="md" size="lg">
                    <Icon size={18} />
                </ThemeIcon>
            </Group>

            <Group align="flex-end" gap="xs">
                <Text fw={700} size="xl" style={{ lineHeight: 1 }}>{value.toLocaleString()}원</Text>
            </Group>

            {trend !== undefined && (
                <Group gap={4} mt={4}>
                    <ThemeIcon color={trend >= 0 ? 'teal' : 'red'} variant="transparent" size="xs">
                        {trend >= 0 ? <IconArrowUpRight /> : <IconArrowDownRight />}
                    </ThemeIcon>
                    <Text c={trend >= 0 ? 'teal' : 'red'} size="xs" fw={600}>
                        {Math.abs(trend)}%
                    </Text>
                    <Text c="dimmed" size="xs">전월 대비</Text>
                </Group>
            )}

            {desc && <Text c="dimmed" size="xs" mt={4}>{desc}</Text>}
        </Stack>
    );
}
