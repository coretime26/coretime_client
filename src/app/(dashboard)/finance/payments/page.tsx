'use client';

import {
    Title, Text, Container, Group, Card, Table, Badge,
    Button, Modal, Select, Stack, Divider, NumberInput,
    Avatar, TextInput, Checkbox, ActionIcon, Box, LoadingOverlay, Center,
    SegmentedControl, ThemeIcon, Loader, Grid
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconReceipt, IconCreditCard, IconMoneybag, IconSearch,
    IconFilter, IconDotsVertical, IconRefresh, IconAlertCircle
} from '@tabler/icons-react';
import { useMembers } from '@/features/members';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { notifications } from '@mantine/notifications';

dayjs.locale('ko');
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    paymentApi, ticketProductApi, Payment, CreatePaymentCommand,
    PaymentStatus, PaymentMethod, TicketProduct, memberApi
} from '@/lib/api';
import { modals } from '@mantine/modals';
import { useDebouncedValue } from '@mantine/hooks';

export default function PaymentPage() {
    const queryClient = useQueryClient();
    const { data: members = [] } = useMembers();

    // UI States
    const [opened, { open, close }] = useDisclosure(false);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search, 500);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [hasUnpaidOnly, setHasUnpaidOnly] = useState(false);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        dayjs().subtract(1, 'month').startOf('day').toDate(),
        dayjs().endOf('day').toDate(),
    ]);

    // Queries
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments', debouncedSearch, dateRange, hasUnpaidOnly],
        queryFn: () => paymentApi.getAll({
            startDate: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
            endDate: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
            search: debouncedSearch || undefined,
            hasUnpaid: hasUnpaidOnly || undefined
        }),
    });

    const { data: products = [] } = useQuery({
        queryKey: ['ticket-products'],
        queryFn: () => ticketProductApi.getAll(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (command: CreatePaymentCommand) => paymentApi.create(command),
        onSuccess: () => {
            notifications.show({
                title: '결제 완료',
                message: '수강권 판매 및 결제 처리가 완료되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['members'] });
            close();
        },
        onError: (error: any) => {
            notifications.show({
                title: '결제 실패',
                message: error.response?.data?.message || '결제 처리 중 오류가 발생했습니다.',
                color: 'red',
            });
        },
    });

    const refundMutation = useMutation({
        mutationFn: (paymentId: string) => paymentApi.refund(paymentId),
        onSuccess: () => {
            notifications.show({
                title: '환불 완료',
                message: '결제 환불 처리가 완료되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            closeDetail();
        },
    });

    const handleCreatePayment = (command: CreatePaymentCommand) => {
        createMutation.mutate(command);
    };

    const handleRefundConfirm = () => {
        if (!selectedPayment) return;
        modals.openConfirmModal({
            title: '결제 환불 확인',
            children: (
                <Text size="sm">
                    정말로 이 결제 건을 환불 처리하시겠습니까? <br />
                    연동된 수강권이 있는 경우 함께 취소될 수 있습니다.
                </Text>
            ),
            labels: { confirm: '환불하기', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => refundMutation.mutate(selectedPayment.id),
        });
    };

    // For frontend-only status filtering since it's not in the provided API spec
    const filteredPayments = useMemo(() => {
        return payments.filter((payment: Payment) => {
            return statusFilter === 'ALL' || payment.status === statusFilter;
        }).sort((a: Payment, b: Payment) => dayjs(b.paidAt).diff(dayjs(a.paidAt)));
    }, [payments, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'green';
            case 'REFUNDED': return 'red';
            case 'CANCELLED': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return '결제완료';
            case 'REFUNDED': return '환불완료';
            case 'CANCELLED': return '취소됨';
            default: return status;
        }
    };

    return (
        <Container size="xl" py="lg">
            <LoadingOverlay visible={createMutation.isPending || refundMutation.isPending} />

            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2} fw={700}>결제 및 미수금 관리</Title>
                    <Text c="dimmed" size="sm">회원의 수강권 결제 내역과 미납 금액을 관리합니다.</Text>
                </div>
                <Button leftSection={<IconPlus size={18} />} onClick={open} color="indigo" size="md">
                    새 결제 등록
                </Button>
            </Group>

            {/* Filter & Search Bar */}
            <Card withBorder mb="lg" p="md" radius="md">
                <Grid align="flex-end">
                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <TextInput
                            label="회원명/상품명"
                            placeholder="검색어 입력..."
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Group align="flex-end" gap="xs" grow>
                            <DatePickerInput
                                type="range"
                                label="결제 기간"
                                locale="ko"
                                valueFormat="YYYY.MM.DD"
                                placeholder="기간을 선택하세요"
                                value={dateRange}
                                onChange={(val: any) => setDateRange(val)}
                                clearable
                                style={{ flex: 1 }}
                            />
                            <Checkbox
                                label="미수금만 보기"
                                checked={hasUnpaidOnly}
                                onChange={(e) => setHasUnpaidOnly(e.currentTarget.checked)}
                                mb={8}
                            />
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Select
                            label="상태"
                            data={[
                                { value: 'ALL', label: '전체 상태' },
                                { value: 'PAID', label: '결제완료' },
                                { value: 'REFUNDED', label: '환불완료' },
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val || 'ALL')}
                        />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Payments Table */}
            {isLoading ? (
                <Card withBorder padding={0} radius="md">
                    <Table verticalSpacing="sm">
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                                <Table.Th><Loader size="xs" variant="dots" /></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <Table.Tr key={i}>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '80%' }} /></Table.Td>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '40%' }} /></Table.Td>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '60%' }} /></Table.Td>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '50%' }} /></Table.Td>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '30%' }} /></Table.Td>
                                    <Table.Td><Box h={20} bg="gray.1" style={{ borderRadius: 4, width: '40%' }} /></Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            ) : (
                <Card withBorder padding={0} radius="md">
                    <Table verticalSpacing="sm" highlightOnHover>
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th>결제일시</Table.Th>
                                <Table.Th>회원명</Table.Th>
                                <Table.Th>상품명</Table.Th>
                                <Table.Th>결제금액</Table.Th>
                                <Table.Th>수단</Table.Th>
                                <Table.Th>상태</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredPayments.map((payment: Payment) => (
                                <Table.Tr
                                    key={payment.id}
                                    onClick={() => {
                                        setSelectedPayment(payment);
                                        openDetail();
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Table.Td>{dayjs(payment.paidAt).format('YY.MM.DD HH:mm')}</Table.Td>
                                    <Table.Td fw={500}>{payment.memberName}</Table.Td>
                                    <Table.Td>{payment.productName}</Table.Td>
                                    <Table.Td fw={700}>
                                        <Stack gap={0}>
                                            <Text size="sm" fw={700}>{Number(payment.amount).toLocaleString()}원</Text>
                                            {payment.unpaidAmount && payment.unpaidAmount > 0 && (
                                                <Group gap={4}>
                                                    <IconAlertCircle size={12} color="var(--mantine-color-red-6)" />
                                                    <Text size="xs" c="red" fw={700}>미수: {Number(payment.unpaidAmount).toLocaleString()}원</Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge size="sm" variant="outline" color="gray">
                                            {payment.method === 'CARD' ? '카드' : payment.method === 'TRANSFER' ? '계좌이체' : '현금'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={getStatusColor(payment.status)} variant="light">
                                            {getStatusLabel(payment.status)}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text ta="center" c="dimmed" py="xl">검색 결과가 없습니다.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Payment Modal */}
            <PaymentModal
                opened={opened}
                onClose={close}
                products={products.filter(p => p.isActive)}
                onProcess={handleCreatePayment}
                isLoading={createMutation.isPending}
            />

            {/* Transaction Detail Modal */}
            <Modal opened={detailOpened} onClose={closeDetail} title="결제 상세 정보" centered>
                {selectedPayment && (
                    <Stack>
                        <Group justify="space-between">
                            <Text c="dimmed">주문 번호</Text>
                            <Text>{selectedPayment.id}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">회원명</Text>
                            <Text fw={500}>{selectedPayment.memberName}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">상품명</Text>
                            <Text>{selectedPayment.productName}</Text>
                        </Group>
                        <Divider />
                        <Group justify="space-between">
                            <Text c="dimmed">상품 원가</Text>
                            <Text>{Number(selectedPayment.totalAmount || selectedPayment.amount).toLocaleString()}원</Text>
                        </Group>
                        {selectedPayment.discountAmount !== undefined && (
                            <Group justify="space-between">
                                <Text c="dimmed">할인 금액</Text>
                                <Text c="red">-{Number(selectedPayment.discountAmount).toLocaleString()}원</Text>
                            </Group>
                        )}
                        <Group justify="space-between">
                            <Text c="dimmed">실 결제액</Text>
                            <Text fw={700} c="indigo">
                                {Number(selectedPayment.amount).toLocaleString()}원
                            </Text>
                        </Group>
                        {selectedPayment.unpaidAmount && selectedPayment.unpaidAmount > 0 && (
                            <Group justify="space-between">
                                <Text fw={600} c="red">미수금</Text>
                                <Stack gap={0} align="flex-end">
                                    <Text fw={700} c="red">{Number(selectedPayment.unpaidAmount).toLocaleString()}원</Text>
                                    {selectedPayment.unpaidDueDate && (
                                        <Text size="xs" c="dimmed">지불 기한: {selectedPayment.unpaidDueDate}</Text>
                                    )}
                                </Stack>
                            </Group>
                        )}
                        <Divider />
                        <Group justify="space-between">
                            <Text c="dimmed">결제 수단</Text>
                            <Badge color="gray">
                                {selectedPayment.method === 'CARD' ? '카드' : selectedPayment.method === 'TRANSFER' ? '계좌이체' : '현금'}
                            </Badge>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">결제 일시</Text>
                            <Text>{dayjs(selectedPayment.paidAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                        </Group>
                        <Divider />
                        <Group justify="space-between">
                            <Text c="dimmed">상태</Text>
                            <Badge color={getStatusColor(selectedPayment.status)}>
                                {getStatusLabel(selectedPayment.status)}
                            </Badge>
                        </Group>

                        {selectedPayment.status === 'PAID' && (
                            <Button
                                color="red"
                                variant="light"
                                mt="md"
                                onClick={handleRefundConfirm}
                                loading={refundMutation.isPending}
                            >
                                결제 환불
                            </Button>
                        )}
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}

// Payment Modal Component
function PaymentModal({ opened, onClose, products, onProcess, isLoading }: {
    opened: boolean;
    onClose: () => void;
    products: TicketProduct[];
    onProcess: (command: CreatePaymentCommand) => void;
    isLoading: boolean;
}) {
    const [memberSearch, setMemberSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(memberSearch, 300);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // States for detailed amounts
    const [basePrice, setBasePrice] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [paidAmount, setPaidAmount] = useState<number | ''>('');
    const [isManualPaid, setIsManualPaid] = useState(false);
    const [unpaidDate, setUnpaidDate] = useState<Date | null>(null);

    const [method, setMethod] = useState<PaymentMethod>('CARD');
    const [autoRegister, setAutoRegister] = useState(true);

    // Fetch members based on search
    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['members', 'search', debouncedSearch],
        queryFn: () => memberApi.getMembers({ search: debouncedSearch || undefined, status: 'ACTIVE' }),
        enabled: opened,
    });

    // Reset form on open
    useMemo(() => {
        if (opened) {
            setMemberSearch('');
            setSelectedMemberId(null);
            setSelectedProductId(null);
            setBasePrice(0);
            setDiscount(0);
            setPaidAmount('');
            setIsManualPaid(false);
            setUnpaidDate(null);
            setMethod('CARD');
            setAutoRegister(true);
        }
    }, [opened]);

    const productDetails = useMemo(() =>
        products.find((p: TicketProduct) => p.id.toString() === selectedProductId),
        [products, selectedProductId]
    );

    // Sync state when product or discount changes
    useMemo(() => {
        if (productDetails) {
            setBasePrice(productDetails.price);
            if (!isManualPaid) {
                setPaidAmount(productDetails.price - discount);
            }
        }
    }, [productDetails, discount, isManualPaid]);

    const netAmount = basePrice - discount;
    const unpaidAmount = typeof paidAmount === 'number' ? netAmount - paidAmount : 0;

    const handleProcess = () => {
        if (selectedMemberId && selectedProductId && paidAmount !== '') {
            onProcess({
                membershipId: selectedMemberId,
                productId: selectedProductId,
                totalAmount: basePrice,
                discountAmount: discount,
                amount: Number(paidAmount),
                unpaidAmount: unpaidAmount > 0 ? unpaidAmount : undefined,
                unpaidDueDate: unpaidDate ? dayjs(unpaidDate).format('YYYY-MM-DD') : undefined,
                method: method,
                autoIssue: autoRegister,
            });
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={700} size="lg">수강권 판매 및 정산</Text>}
            size="lg"
            centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="xl">
                {/* 1. 회원 및 상품 선택 섹션 */}
                <Stack gap="md">
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">1. 판매 정보</Text>
                    <Select
                        label="회원 선택"
                        placeholder="이름 또는 전화번호 검색"
                        data={members.map(m => ({
                            value: m.id.toString(),
                            label: `${m.name} (${m.phone.slice(-4)})`
                        }))}
                        value={selectedMemberId}
                        onChange={setSelectedMemberId}
                        searchable
                        searchValue={memberSearch}
                        onSearchChange={setMemberSearch}
                        nothingFoundMessage={
                            memberSearch.length > 0 ? (
                                <Stack align="center" gap="xs" py="sm">
                                    <IconSearch size={24} style={{ opacity: 0.3 }} />
                                    <Text size="sm" c="dimmed">검색 결과가 없습니다.</Text>
                                </Stack>
                            ) : "회원을 검색해주세요"
                        }
                        required
                        leftSection={isLoadingMembers ? <Loader size="xs" /> : <IconSearch size={16} />}
                    />

                    <Select
                        label="수강권 선택"
                        placeholder="판매할 수강권 상품 선택"
                        data={products.map(p => ({
                            value: p.id.toString(),
                            label: p.name
                        }))}
                        value={selectedProductId}
                        onChange={setSelectedProductId}
                        required
                        leftSection={<IconReceipt size={16} />}
                    />
                </Stack>

                {/* 상품 미리보기 카드 */}
                {productDetails && (
                    <Card withBorder padding="md" radius="md" bg="gray.0">
                        <Group justify="space-between">
                            <Box>
                                <Text fw={700}>{productDetails.name}</Text>
                                <Text size="xs" c="dimmed">{productDetails.sessionCount}회 / {productDetails.durationDays}일</Text>
                            </Box>
                            <Text fw={700} c="indigo">{Number(productDetails.price).toLocaleString()}원</Text>
                        </Group>
                    </Card>
                )}

                <Divider />

                {/* 2. 결제 및 미수금 상세 설정 */}
                <Stack gap="md">
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">2. 결제 및 미수금 설정</Text>

                    <Grid gutter="md">
                        <Grid.Col span={6}>
                            <NumberInput
                                label="상품 원가"
                                value={basePrice}
                                readOnly
                                variant="filled"
                                thousandSeparator=","
                                suffix="원"
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="현장 할인 금액"
                                value={discount}
                                onChange={(val: string | number) => setDiscount(Number(val) || 0)}
                                min={0}
                                max={basePrice}
                                thousandSeparator=","
                                suffix="원"
                                color="red"
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="실제 결제 금액"
                                placeholder="0"
                                value={paidAmount}
                                onChange={(val: string | number) => {
                                    setPaidAmount(val === '' ? '' : Number(val));
                                    setIsManualPaid(true);
                                }}
                                required
                                thousandSeparator=","
                                suffix="원"
                                styles={{ input: { fontWeight: 700, fontSize: '16px', border: '2px solid var(--mantine-color-indigo-2)' } }}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Card withBorder padding="7px 12px" radius="sm" bg={unpaidAmount > 0 ? "red.0" : "gray.0"}>
                                <Text size="xs" c="dimmed">최종 미수금 (Receivable)</Text>
                                <Text fw={700} c={unpaidAmount > 0 ? "red.7" : "gray.6"}>
                                    {Number(unpaidAmount).toLocaleString()}원
                                </Text>
                            </Card>
                        </Grid.Col>
                    </Grid>

                    {unpaidAmount > 0 && (
                        <Card withBorder radius="md" p="sm" bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-2)' }}>
                            <Group gap="xs" mb={4}>
                                <IconAlertCircle size={14} color="var(--mantine-color-orange-7)" />
                                <Text size="xs" fw={600} c="orange.8">미수금 처리 안내</Text>
                            </Group>
                            <Text size="xs" c="orange.9" mb="xs">결제 금액이 부족하여 미수금이 발생합니다. 지불 기한을 설정하시겠습니까?</Text>
                            <DatePickerInput
                                size="xs"
                                locale="ko"
                                valueFormat="YYYY.MM.DD"
                                placeholder="미수금 지불 기한 선택 (선택)"
                                value={unpaidDate}
                                onChange={(val: any) => setUnpaidDate(val)}
                                clearable
                                minDate={new Date()}
                            />
                        </Card>
                    )}

                    <Box>
                        <Text size="sm" fw={500} mb={8}>결제 수단</Text>
                        <SegmentedControl
                            fullWidth
                            value={method}
                            onChange={(val) => setMethod(val as PaymentMethod)}
                            data={[
                                { value: 'CARD', label: '카드' },
                                { value: 'TRANSFER', label: '계좌이체' },
                                { value: 'CASH', label: '현금' },
                            ]}
                        />
                    </Box>

                    <Checkbox
                        label="결제 즉시 수강권 자동 등록"
                        checked={autoRegister}
                        onChange={(e) => setAutoRegister(e.currentTarget.checked)}
                        size="sm"
                    />
                </Stack>

                <Button
                    mt="md"
                    size="lg"
                    disabled={!selectedMemberId || !selectedProductId || paidAmount === ''}
                    loading={isLoading}
                    onClick={handleProcess}
                    color="indigo"
                    fullWidth
                >
                    {paidAmount ? `${Number(paidAmount).toLocaleString()}원 결제 승인` : '판매 등록'}
                </Button>
            </Stack>
        </Modal>
    );
}
