'use client';

import {
    Title, Text, Container, Group, Card, Table, Badge,
    Button, Modal, Select, Stack, Divider, NumberInput,
    Avatar, TextInput, Checkbox, ActionIcon, Box, LoadingOverlay, Center,
    SegmentedControl, ThemeIcon, Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconReceipt, IconCreditCard, IconMoneybag, IconSearch,
    IconFilter, IconDotsVertical, IconRefresh, IconAlertCircle
} from '@tabler/icons-react';
import { useMembers } from '@/features/members';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
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
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>('ALL');

    // Data Fetching
    const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
        queryKey: ['payments'],
        queryFn: paymentApi.getAll,
    });

    const { data: products = [] } = useQuery({
        queryKey: ['ticketProducts'],
        queryFn: ticketProductApi.getAll,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: paymentApi.create,
        onSuccess: () => {
            notifications.show({
                title: '결제 승인 완료',
                message: '결제가 성공적으로 등록되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            close();
        },
        onError: () => {
            notifications.show({
                title: '오류 발생',
                message: '결제 처리 중 문제가 발생했습니다.',
                color: 'red',
            });
        },
    });

    const refundMutation = useMutation({
        mutationFn: paymentApi.refund,
        onSuccess: () => {
            notifications.show({
                title: '환불 완료',
                message: '결제가 환불 처리되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            closeDetail();
        },
        onError: () => {
            notifications.show({
                title: '오류 발생',
                message: '환불 처리 중 문제가 발생했습니다.',
                color: 'red',
            });
        },
    });

    // Filtering
    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const matchesSearch = payment.memberName.includes(search) || payment.productName.includes(search);
            const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    }, [payments, search, statusFilter]);

    // Handlers
    const handleRowClick = (payment: Payment) => {
        setSelectedPayment(payment);
        openDetail();
    };

    const handleRefundConfirm = () => {
        if (!selectedPayment) return;

        modals.openConfirmModal({
            title: '결제 환불',
            children: (
                <Text size="sm">
                    이 결제 건을 환불 처리하시겠습니까?
                    <br />
                    환불 시 관련된 미수금 내역도 조정됩니다.
                </Text>
            ),
            labels: { confirm: '환불 진행', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => refundMutation.mutate(selectedPayment.id),
        });
    };

    const handleCreatePayment = (command: CreatePaymentCommand) => {
        createMutation.mutate(command);
    };

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case 'PAID': return 'green';
            case 'REFUNDED': return 'gray';
            case 'CANCELLED': return 'red';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status: PaymentStatus) => {
        switch (status) {
            case 'PAID': return '결제 완료';
            case 'REFUNDED': return '환불';
            case 'CANCELLED': return '취소';
            default: return status;
        }
    };

    const hasPayments = payments.length > 0;

    return (
        <Container size="xl" py="xl">
            <LoadingOverlay visible={isLoadingPayments} />

            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>결제 및 미수금</Title>
                    <Text c="dimmed">매출 내역을 확인하고 수강권을 판매(결제)합니다.</Text>
                </Box>
                {hasPayments && (
                    <Button leftSection={<IconPlus size={18} />} onClick={open} color="indigo">
                        새 결제 (수강권 판매)
                    </Button>
                )}
            </Group>

            <Group mb="md">
                <TextInput
                    placeholder="회원명 또는 상품명 검색"
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 300 }}
                />
                <Select
                    placeholder="상태 필터"
                    leftSection={<IconFilter size={16} />}
                    data={[
                        { value: 'ALL', label: '전체' },
                        { value: 'PAID', label: '결제 완료' },
                        { value: 'REFUNDED', label: '환불' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowDeselect={false}
                    w={150}
                />
            </Group>

            {/* Empty State */}
            {!isLoadingPayments && !hasPayments ? (
                <Card withBorder radius="md" p="xl" style={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Stack align="center" gap="md">
                        <IconCreditCard size={64} style={{ opacity: 0.2 }} />
                        <Title order={3} c="dimmed">결제 내역이 없습니다</Title>
                        <Text c="dimmed" ta="center">
                            첫 번째 수강권 판매를 진행해보세요.
                        </Text>
                        <Button leftSection={<IconPlus size={18} />} onClick={open} mt="sm">
                            새 결제 등록하기
                        </Button>
                    </Stack>
                </Card>
            ) : (
                <Card withBorder radius="md" p={0} mb="xl">
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th>결제 일시</Table.Th>
                                <Table.Th>회원명</Table.Th>
                                <Table.Th>상품명</Table.Th>
                                <Table.Th>결제 금액</Table.Th>
                                <Table.Th>결제 수단</Table.Th>
                                <Table.Th>상태</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredPayments.map((payment) => (
                                <Table.Tr
                                    key={payment.id}
                                    onClick={() => handleRowClick(payment)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Table.Td>{dayjs(payment.paidAt).format('YY.MM.DD HH:mm')}</Table.Td>
                                    <Table.Td fw={500}>{payment.memberName}</Table.Td>
                                    <Table.Td>{payment.productName}</Table.Td>
                                    <Table.Td fw={700}>{payment.amount.toLocaleString()}원</Table.Td>
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
                        <Group justify="space-between">
                            <Text c="dimmed">결제 금액</Text>
                            <Text fw={700} c="indigo">
                                {new Intl.NumberFormat('ko-KR').format(selectedPayment.amount)}원
                            </Text>
                        </Group>
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
    const [amount, setAmount] = useState<number | ''>('');
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
            setAmount('');
            setMethod('CARD');
            setAutoRegister(true);
        }
    }, [opened]);

    const productDetails = useMemo(() =>
        products.find(p => p.id.toString() === selectedProductId),
        [products, selectedProductId]
    );

    // Auto-fill price when product selected
    useMemo(() => {
        if (productDetails) {
            setAmount(productDetails.price);
        }
    }, [productDetails]);

    const handleProcess = () => {
        if (selectedMemberId && selectedProductId && amount !== '') {
            onProcess({
                membershipId: selectedMemberId,
                productId: selectedProductId,
                amount: Number(amount),
                method: method,
                autoIssue: autoRegister,
            });
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={700} size="lg">수강권 판매</Text>}
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
                                    <Button variant="light" size="compact-xs" leftSection={<IconPlus size={12} />}>
                                        신규 회원 등록하러 가기
                                    </Button>
                                </Stack>
                            ) : "회원을 검색해주세요"
                        }
                        required
                        leftSection={isLoadingMembers ? <Loader size="xs" /> : <IconSearch size={16} />}
                    />

                    <Select
                        label="상품 선택"
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
                    <Card
                        withBorder
                        padding="lg"
                        radius="md"
                        bg="var(--mantine-color-indigo-0)"
                        style={{ borderColor: 'var(--mantine-color-indigo-2)' }}
                    >
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                                <Badge color="indigo" variant="light">선택된 상품</Badge>
                                <Text fw={700} size="lg" mt={4}>{productDetails.name}</Text>
                                <Group gap="xs" c="dimmed" fz="sm">
                                    <Text span>{productDetails.sessionCount}회</Text>
                                    <Divider orientation="vertical" />
                                    <Text span>{productDetails.durationDays}일 유효</Text>
                                </Group>
                            </Stack>
                            <ThemeIcon size={48} radius="md" color="indigo" variant="white">
                                <IconReceipt size={28} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                )}

                <Divider />

                {/* 2. 결제 정보 섹션 */}
                <Stack gap="md">
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">2. 결제 처리</Text>

                    <NumberInput
                        label="최종 결제 금액"
                        placeholder="0"
                        value={amount}
                        onChange={(val) => setAmount(val === '' ? '' : Number(val))}
                        required
                        leftSection={<IconMoneybag size={16} />}
                        thousandSeparator=","
                        prefix="₩ "
                        size="md"
                        styles={{
                            input: { fontWeight: 700, fontSize: '18px', color: 'var(--mantine-color-indigo-7)' }
                        }}
                    />

                    <Box>
                        <Text size="sm" fw={500} mb={8}>결제 수단</Text>
                        <SegmentedControl
                            fullWidth
                            value={method}
                            onChange={(val) => setMethod(val as PaymentMethod)}
                            data={[
                                {
                                    value: 'CARD',
                                    label: (
                                        <Center style={{ gap: 10 }}>
                                            <IconCreditCard size={16} />
                                            <span>카드</span>
                                        </Center>
                                    )
                                },
                                {
                                    value: 'TRANSFER',
                                    label: (
                                        <Center style={{ gap: 10 }}>
                                            <IconMoneybag size={16} />
                                            <span>계좌이체</span>
                                        </Center>
                                    )
                                },
                                {
                                    value: 'CASH',
                                    label: (
                                        <Center style={{ gap: 10 }}>
                                            <IconMoneybag size={16} />
                                            <span>현금</span>
                                        </Center>
                                    )
                                },
                            ]}
                        />
                    </Box>

                    <Card withBorder radius="md" p="sm" bg="gray.0">
                        <Checkbox
                            label="결제 즉시 수강권 자동 등록"
                            description="체크 시 회원의 보유 수강권 목록에 자동으로 추가됩니다."
                            checked={autoRegister}
                            onChange={(e) => setAutoRegister(e.currentTarget.checked)}
                            color="indigo"
                        />
                    </Card>
                </Stack>

                <Button
                    mt="md"
                    size="xl"
                    disabled={!selectedMemberId || !selectedProductId || amount === ''}
                    loading={isLoading}
                    onClick={handleProcess}
                    color="indigo"
                    rightSection={<IconCreditCard size={20} />}
                >
                    {amount ? `${new Intl.NumberFormat('ko-KR').format(Number(amount))}원 결제 승인` : '결제 승인'}
                </Button>
            </Stack>
        </Modal>
    );
}

