'use client';

import {
    Title, Text, Container, Grid, Paper, Group, ActionIcon,
    ThemeIcon, Table, Badge, Stack, SegmentedControl, Skeleton, Center, Pagination
} from '@mantine/core';
import {
    IconTrendingUp, IconTrendingDown, IconCreditCard,
    IconCalendar, IconArrowUpRight, IconArrowDownRight, IconCoin, IconAlertCircle, IconRefresh
} from '@tabler/icons-react';
import { AreaChart, DonutChart } from '@mantine/charts';
import { MonthPickerInput } from '@mantine/dates';
import { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import {
    useFinanceStatsSummary,
    useFinanceStatsTrend,
    useFinanceStatsPaymentMethods,
    useFinanceStatsTransactions,
    PaymentMethod,
    PaymentStatus
} from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { IconDatabaseOff } from '@tabler/icons-react';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CARD: '신용카드',
    TRANSFER: '계좌이체',
    CASH: '현금'
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
    CARD: 'indigo.6',
    TRANSFER: 'teal.6',
    CASH: 'gray.6'
};

export default function FinanceStatsPage() {
    const queryClient = useQueryClient();
    const [dateValue, setDateValue] = useState<Date | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setDateValue(new Date());
    }, []);

    // Auto-refresh finance data when component mounts or becomes visible
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ['finance'] });
    }, [queryClient]);

    // Refetch on window focus to ensure data freshness
    useEffect(() => {
        const handleFocus = () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [queryClient]);

    // Calculate Date Range
    const dateRange = useMemo(() => {
        if (!dateValue) return { startDate: '', endDate: '' };
        return {
            startDate: dayjs(dateValue).startOf('month').format('YYYY-MM-DD'),
            endDate: dayjs(dateValue).endOf('month').format('YYYY-MM-DD')
        };
    }, [dateValue]);

    // Queries
    const { data: summary, isLoading: isSummaryLoading } = useFinanceStatsSummary(dateRange);
    const { data: trend, isLoading: isTrendLoading } = useFinanceStatsTrend(dateRange);
    const { data: paymentMethods, isLoading: isPaymentLoading } = useFinanceStatsPaymentMethods(dateRange);
    const { data: transactionsData, isLoading: isTxLoading } = useFinanceStatsTransactions({
        ...dateRange,
        page,
        limit: 10
    });

    // Chart Data Mappings
    const chartTrendData = useMemo(() => {
        if (!trend) return [];
        return trend.map(t => ({
            date: dayjs(t.date).format('M/D'),
            '매출': t.revenue,
            '환불': t.refund,
            '미수': t.unpaid
        }));
    }, [trend]);

    const chartPaymentData = useMemo(() => {
        if (!paymentMethods) return [];
        return paymentMethods.map(m => ({
            name: m.label || PAYMENT_METHOD_LABELS[m.method as PaymentMethod],
            value: m.amount,
            color: m.color || PAYMENT_METHOD_COLORS[m.method as PaymentMethod]
        }));
    }, [paymentMethods]);

    return (
        <Container size="xl" py="xl">
            {/* Header: Title & Controls */}
            <Group justify="space-between" mb="lg" align="flex-end">
                <div>
                    <Title order={2}>매출 통계</Title>
                    <Text c="dimmed" size="sm">기간별 매출 현황 및 추이를 확인합니다.</Text>
                </div>
                <Group>
                    <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => {
                            notifications.show({ title: '새로고침', message: '데이터를 최신화합니다.', color: 'blue', icon: <IconRefresh size={16} /> });
                            queryClient.invalidateQueries({ queryKey: ['finance'] });
                        }}
                    >
                        <IconRefresh size={18} />
                    </ActionIcon>
                    <MonthPickerInput
                        placeholder="기간 선택"
                        leftSection={<IconCalendar size={16} />}
                        value={dateValue}
                        onChange={(date: any) => { setDateValue(date); setPage(1); }}
                        w={150}
                    />
                </Group>
            </Group>

            {/* 1. Summary Metrics */}
            <Paper shadow="sm" radius="md" p="lg" withBorder mb="lg" bg="var(--mantine-color-body)">
                <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }} style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                        {isSummaryLoading ? <Skeleton h={80} /> : (
                            <StatItem
                                label="총 매출액"
                                value={summary?.totalSales || 0}
                                icon={IconCoin}
                                color="blue"
                                trend={summary?.growthRate}
                            />
                        )}
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }} style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                        {isSummaryLoading ? <Skeleton h={80} /> : (
                            <StatItem
                                label="실 결제액 (순매출)"
                                value={summary?.netSales || 0}
                                icon={IconTrendingUp}
                                color="indigo"
                                desc="환불 제외"
                            />
                        )}
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }} style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                        {isSummaryLoading ? <Skeleton h={80} /> : (
                            <StatItem
                                label="미수금"
                                value={summary?.unpaidAmount || 0}
                                icon={IconAlertCircle}
                                color="orange"
                            />
                        )}
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        {isSummaryLoading ? <Skeleton h={80} /> : (
                            <>
                                <Text c="dimmed" size="xs" fw={700} tt="uppercase">결제 수단 비중 1위</Text>
                                <Group mt="xs">
                                    <ThemeIcon variant="light" color="indigo" size="lg"><IconCreditCard size={20} /></ThemeIcon>
                                    <div>
                                        <Text fw={700} size="md">
                                            {summary?.topPaymentMethod ? (PAYMENT_METHOD_LABELS[summary.topPaymentMethod.method as PaymentMethod] || summary.topPaymentMethod.method) : '-'}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {summary?.topPaymentMethod ? `전체 ${summary.topPaymentMethod.percentage}%` : '데이터 없음'}
                                        </Text>
                                    </div>
                                </Group>
                            </>
                        )}
                    </Grid.Col>
                </Grid>
            </Paper>

            {/* 2. Main Analytics Area */}
            <Grid gutter="lg" mb="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
                        <Group justify="space-between" mb="md">
                            <Text fw={700} size="lg">매출 추이</Text>
                            <Badge variant="light" color="gray">단위: 원</Badge>
                        </Group>
                        {isTrendLoading ? <Skeleton h={300} /> : chartTrendData.length > 0 ? (
                            <AreaChart
                                h={300}
                                data={chartTrendData}
                                dataKey="date"
                                series={[
                                    { name: '매출', color: 'indigo.6' },
                                    { name: '환불', color: 'red.6' },
                                    { name: '미수', color: 'orange.5' },
                                ]}
                                curveType="monotone"
                                gridAxis="xy"
                                tickLine="y"
                                withLegend
                                legendProps={{ verticalAlign: 'top', height: 30 }}
                                valueFormatter={(value) => value.toLocaleString('ko-KR')}
                                activeDotProps={{
                                    r: 6,
                                    style: { cursor: 'pointer' }
                                }}
                                areaProps={(series) => ({
                                    onClick: (data: any) => {
                                        if (data && data.activePayload && data.activePayload[0]) {
                                            const point = data.activePayload[0].payload;
                                            notifications.show({
                                                title: `${point.date} 상세 현황`,
                                                message: `매출: ${point['매출'].toLocaleString()}원 / 환불: ${point['환불'].toLocaleString()}원`,
                                                color: 'indigo',
                                                icon: <IconTrendingUp size={16} />
                                            });
                                        }
                                    }
                                })}
                            />
                        ) : (
                            <Center h={300}>
                                <Stack align="center" gap="xs">
                                    <IconDatabaseOff size={40} style={{ opacity: 0.2 }} />
                                    <Text c="dimmed" size="sm">해당 기간의 매출 추이 데이터가 없습니다.</Text>
                                </Stack>
                            </Center>
                        )}
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
                        <Text fw={700} size="lg" mb="md">결제 수단별 비중</Text>
                        {isPaymentLoading ? <Center h={180}><Skeleton circle w={180} h={180} /></Center> : chartPaymentData.length > 0 ? (
                            <Group justify="center" mb="xl">
                                <DonutChart
                                    size={180}
                                    thickness={20}
                                    paddingAngle={2}
                                    data={chartPaymentData}
                                    withTooltip
                                    tooltipDataSource="segment"
                                />
                            </Group>
                        ) : (
                            <Center h={180} mb="xl">
                                <Stack align="center" gap="xs">
                                    <IconCreditCard size={40} style={{ opacity: 0.2 }} />
                                    <Text c="dimmed" size="sm">결제 수단 데이터 없음</Text>
                                </Stack>
                            </Center>
                        )}
                        <Stack gap="xs" mt="md">
                            {chartPaymentData.map((item) => (
                                <Group key={item.name} justify="space-between">
                                    <Group gap="xs">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--mantine-color-${item.color})` }} />
                                        <Text size="sm">{item.name}</Text>
                                    </Group>
                                    <Text size="sm" fw={500}>{item.value.toLocaleString()}원</Text>
                                </Group>
                            ))}
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* 3. Detailed Transaction Log */}
            <Paper shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={700} size="lg">상세 매출 내역</Text>
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
