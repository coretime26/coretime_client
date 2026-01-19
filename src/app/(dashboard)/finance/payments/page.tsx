'use client';

import {
    Title, Text, Container, Group, Card, Table, Badge,
    Button, Modal, Select, Stack, Divider, NumberInput,
    Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconReceipt, IconCreditCard, IconMoneybag } from '@tabler/icons-react';
import { useFinance } from '@/context/FinanceContext';
import { useMembers } from '@/context/MemberContext';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function PaymentPage() {
    const { transactions, products, processPayment } = useFinance();
    const { members, addTicket } = useMembers(); // Need members to select payer
    const [opened, { open, close }] = useDisclosure(false);

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

            {/* Payment Modal */}
            <PaymentModal
                opened={opened}
                onClose={close}
                members={members}
                products={products}
                onProcess={(memberId, productId, method) => {
                    // 1. Process Logic
                    const member = members.find(m => m.id === memberId);
                    const product = products.find(p => p.id === productId);

                    if (member && product) {
                        // A. Create Transaction Log
                        processPayment(memberId, member.name, productId, method);

                        // B. Grant Ticket to Member (Integration Logic)
                        // In real app, this happens on server side transactional boundary
                        addTicket({
                            memberId: member.id,
                            name: product.name,
                            totalCount: product.sessionCount,
                            remainingCount: product.sessionCount,
                            startDate: new Date(),
                            endDate: dayjs().add(product.durationDays, 'day').toDate(),
                            status: 'ACTIVE'
                        });
                    }
                    close();
                }}
            />

            {/* Transaction Table */}
            <Card withBorder radius="md" p={0}>
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
                        {transactions.map((tx) => (
                            <Table.Tr key={tx.id}>
                                <Table.Td>{dayjs(tx.paidAt).format('YY.MM.DD HH:mm')}</Table.Td>
                                <Table.Td fw={500}>{tx.memberName}</Table.Td>
                                <Table.Td>{tx.productName}</Table.Td>
                                <Table.Td fw={700}>{tx.amount.toLocaleString()}원</Table.Td>
                                <Table.Td>
                                    <Badge size="sm" variant="outline" color="gray">{tx.method}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color="green" variant="light">결제 완료</Badge>
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

    const productDetails = products.find((p: any) => p.id === selectedProduct);

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

                <Divider label="결제 수단" labelPosition="center" />

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

                <Button
                    mt="md"
                    size="lg"
                    disabled={!selectedMember || !selectedProduct}
                    onClick={() => onProcess(selectedMember, selectedProduct, method)}
                >
                    결제 승인
                </Button>
            </Stack>
        </Modal>
    );
}
