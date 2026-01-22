'use client';

import {
    Title, Text, Container, Group, Card, Table, Badge,
    Button, Modal, Select, Stack, Divider, NumberInput,
    Avatar, TextInput, Checkbox, ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconReceipt, IconCreditCard, IconMoneybag, IconSearch, IconFilter, IconDotsVertical, IconRefresh } from '@tabler/icons-react';
import { useFinance, Transaction } from '@/context/FinanceContext';
import { useMembers, Ticket } from '@/context/MemberContext';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';

export default function PaymentPage() {
    const { transactions, products, processPayment, updateTransaction } = useFinance();
    const { members, addTicket } = useMembers();

    // UI State
    const [opened, { open, close }] = useDisclosure(false);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>('ALL');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = tx.memberName.includes(search) || tx.productName.includes(search);
            const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    }, [transactions, search, statusFilter]);

    const handleRowClick = (tx: Transaction) => {
        setSelectedTx(tx);
        openDetail();
    };

    const handleRefund = () => {
        if (selectedTx) {
            updateTransaction(selectedTx.id, { status: 'REFUNDED' });
            notifications.show({ title: '환불 처리', message: '결제 상태가 환불로 변경되었습니다.', color: 'gray' });
            closeDetail();
        }
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>결제 및 미수금 (Payments)</Title>
                    <Text c="dimmed">매출 내역을 확인하고 수강권을 판매(결제)합니다.</Text>
                </Box>
                <Button leftSection={<IconPlus size={18} />} onClick={open} color="indigo">
                    새 결제 (수강권 판매)
                </Button>
            </Group>

            <Group mb="md">
                <TextInput
                    placeholder="회원명 또는 상품명 검색"
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
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
                />
            </Group>

            {/* Payment Modal */}
            <PaymentModal
                opened={opened}
                onClose={close}
                members={members}
                products={products}
                onProcess={async (memberId: string, productId: string, method: any, autoRegister: boolean) => {
                    const member = members.find(m => m.id === memberId);
                    const product = products.find(p => p.id === productId);

                    if (member && product) {
                        let linkedTicketId: string | undefined = undefined;

                        if (autoRegister) {
                            const newTicket = addTicket({
                                memberId: member.id,
                                name: product.name,
                                totalCount: product.sessionCount,
                                remainingCount: product.sessionCount,
                                startDate: new Date(),
                                endDate: dayjs().add(product.durationDays, 'day').toDate(),
                                status: 'ACTIVE'
                            });
                            linkedTicketId = newTicket.id;
                        }

                        processPayment(memberId, member.name, productId, method, linkedTicketId);

                        notifications.show({
                            title: '결제 완료',
                            message: autoRegister ? '결제 및 수강권 등록이 완료되었습니다.' : '결제가 완료되었습니다. (미사용 수강권)',
                            color: 'green'
                        });
                    }
                    close();
                }}
            />

            {/* Transaction Detail Modal */}
            <Modal opened={detailOpened} onClose={closeDetail} title="결제 상세 정보">
                {selectedTx && (
                    <Stack>
                        <Group justify="space-between">
                            <Text c="dimmed">주문 번호</Text>
                            <Text>{selectedTx.id}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">회원명</Text>
                            <Text fw={500}>{selectedTx.memberName}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">상품명</Text>
                            <Text>{selectedTx.productName}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">결제 금액</Text>
                            <Text fw={700} c="indigo">{selectedTx.amount.toLocaleString()}원</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">결제 수단</Text>
                            <Badge color="gray">{selectedTx.method}</Badge>
                        </Group>
                        <Group justify="space-between">
                            <Text c="dimmed">결제 일시</Text>
                            <Text>{dayjs(selectedTx.paidAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                        </Group>
                        <Divider />
                        <Group justify="space-between">
                            <Text c="dimmed">상태</Text>
                            <Badge color={selectedTx.status === 'PAID' ? 'green' : 'gray'}>{selectedTx.status}</Badge>
                        </Group>
                        {selectedTx.linkedTicketId ? (
                            <Group justify="space-between">
                                <Text c="dimmed">연동된 수강권</Text>
                                <Badge color="blue" variant="dot">등록됨</Badge>
                            </Group>
                        ) : (
                            <Text size="sm" c="orange" ta="center">⚠️ 수강권이 아직 등록되지 않았습니다.</Text>
                        )}

                        {selectedTx.status === 'PAID' && (
                            <Button color="red" variant="subtle" mt="md" onClick={handleRefund}>
                                결제 취소 / 환불
                            </Button>
                        )}
                    </Stack>
                )}
            </Modal>

            {/* Transaction Table */}
            <Card withBorder radius="md" p={0}>
                <Table highlightOnHover verticalSpacing="sm" className="cursor-pointer">
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th>결제 일시</Table.Th>
                            <Table.Th>회원명</Table.Th>
                            <Table.Th>상품명</Table.Th>
                            <Table.Th>결제 금액</Table.Th>
                            <Table.Th>결제 수단</Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th>수강권</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredTransactions.map((tx) => (
                            <Table.Tr key={tx.id} onClick={() => handleRowClick(tx)} style={{ cursor: 'pointer' }}>
                                <Table.Td>{dayjs(tx.paidAt).format('YY.MM.DD HH:mm')}</Table.Td>
                                <Table.Td fw={500}>{tx.memberName}</Table.Td>
                                <Table.Td>{tx.productName}</Table.Td>
                                <Table.Td fw={700}>{tx.amount.toLocaleString()}원</Table.Td>
                                <Table.Td>
                                    <Badge size="sm" variant="outline" color="gray">{tx.method}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={tx.status === 'PAID' ? 'green' : 'gray'} variant="light">
                                        {tx.status === 'PAID' ? '결제 완료' : '환불'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    {tx.linkedTicketId ? (
                                        <IconReceipt size={16} color="gray" />
                                    ) : (
                                        <Badge color="orange" size="xs" variant="dot">미등록</Badge>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Container>
    );
}

// --- Components ---
import { Box } from '@mantine/core';

function PaymentModal({ opened, onClose, members, products, onProcess }: any) {
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [method, setMethod] = useState<string>('CARD');
    const [autoRegister, setAutoRegister] = useState(true);

    const productDetails = products.find((p: any) => p.id === selectedProduct);

    const handleProcess = () => {
        onProcess(selectedMember, selectedProduct, method, autoRegister);
        // Reset states
        setSelectedMember(null);
        setSelectedProduct(null);
        setMethod('CARD');
        setAutoRegister(true);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={700}>수강권 판매 (POS)</Text>}
            size="lg"
        >
            <Stack>
                <Select
                    label="회원 선택"
                    placeholder="이름 또는 전화번호 검색"
                    data={members.map((m: any) => ({ value: m.id, label: `${m.name} (${m.phone.slice(-4)})` }))}
                    value={selectedMember}
                    onChange={setSelectedMember}
                    searchable
                />

                <Select
                    label="상품 선택"
                    placeholder="판매할 수강권 선택"
                    data={products.filter((p: any) => p.isActive).map((p: any) => ({ value: p.id, label: p.name }))}
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                />

                {productDetails && (
                    <Card bg="gray.0" withBorder radius="md">
                        <Group justify="space-between" mb={4}>
                            <Text size="sm">결제 금액</Text>
                            <Text fw={700} size="lg" c="indigo">{productDetails.price.toLocaleString()}원</Text>
                        </Group>
                        <Text size="xs" c="dimmed">{productDetails.sessionCount}회 / {productDetails.durationDays}일 유효</Text>
                    </Card>
                )}

                <Divider label="결제 설정" labelPosition="center" />

                <Group grow>
                    <Button
                        variant={method === 'CARD' ? 'filled' : 'default'}
                        onClick={() => setMethod('CARD')}
                        leftSection={<IconCreditCard size={16} />}
                    >
                        카드
                    </Button>
                    <Button
                        variant={method === 'TRANSFER' ? 'filled' : 'default'}
                        onClick={() => setMethod('TRANSFER')}
                        leftSection={<IconMoneybag size={16} />}
                    >
                        이체/현금
                    </Button>
                </Group>

                <Card withBorder radius="md" p="sm">
                    <Checkbox
                        label="결제 즉시 수강권 등록"
                        description="체크 해제 시 결제 내역만 생성됩니다. (나중에 수강권 등록 가능)"
                        checked={autoRegister}
                        onChange={(e) => setAutoRegister(e.currentTarget.checked)}
                    />
                </Card>

                <Button
                    mt="md"
                    size="lg"
                    disabled={!selectedMember || !selectedProduct}
                    onClick={handleProcess}
                >
                    결제 승인
                </Button>
            </Stack>
        </Modal>
    );
}
