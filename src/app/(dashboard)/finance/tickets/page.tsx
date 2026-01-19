'use client';

import {
    Title, Text, Container, SimpleGrid, Card, Group,
    Button, Badge, ActionIcon, NumberInput, TextInput,
    Select, Stack, Switch, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCurrencyKRW, IconEdit, IconCheck } from '@tabler/icons-react';
import { useFinance, TicketProduct } from '@/context/FinanceContext';
import { useForm } from '@mantine/form';

export default function TicketProductPage() {
    const { products, addProduct, toggleProductStatus } = useFinance();
    const [isCreating, { open, close }] = useDisclosure(false);

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <Box>
                    <Title order={2}>수강권 상품 관리 (Products)</Title>
                    <Text c="dimmed">회원에게 판매할 수강권 상품을 등록하고 관리합니다.</Text>
                </Box>
                {!isCreating && (
                    <Button leftSection={<IconPlus size={18} />} onClick={open}>
                        새 상품 등록
                    </Button>
                )}
            </Group>

            {isCreating && (
                <CreateProductForm onClose={close} onSubmit={addProduct} />
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onToggle={() => toggleProductStatus(product.id)}
                    />
                ))}
            </SimpleGrid>
        </Container>
    );
}

function ProductCard({ product, onToggle }: { product: TicketProduct, onToggle: () => void }) {
    return (
        <Card withBorder shadow="sm" radius="md" padding="lg">
            <Group justify="space-between" mb="xs">
                <Badge variant="light" color={product.type === '1:1' ? 'grape' : 'blue'}>
                    {product.type}
                </Badge>
                <Switch
                    label={product.isActive ? '판매 중' : '판매 중지'}
                    checked={product.isActive}
                    onChange={onToggle}
                    size="xs"
                />
            </Group>

            <Text fw={700} size="lg" mt="xs">{product.name}</Text>

            <Group gap="xs" mt={4} mb="md">
                <Badge variant="outline" color="gray">{product.sessionCount}회</Badge>
                <Badge variant="outline" color="gray">{product.durationDays}일 유효</Badge>
            </Group>

            <Group justify="space-between" align="center" mt="auto">
                <Text size="xl" fw={700} c="indigo">
                    {product.price.toLocaleString()}원
                </Text>
                <ActionIcon variant="subtle" color="gray">
                    <IconEdit size={18} />
                </ActionIcon>
            </Group>
        </Card>
    );
}

function CreateProductForm({ onClose, onSubmit }: any) {
    const form = useForm({
        initialValues: {
            name: '',
            type: '1:1',
            sessionCount: 10,
            durationDays: 30,
            price: 0,
        },
        validate: {
            name: (val) => val.length > 0 ? null : '상품명을 입력하세요',
            price: (val) => val > 0 ? null : '가격을 입력하세요',
        }
    });

    const handleSubmit = form.onSubmit((values) => {
        onSubmit(values);
        onClose();
    });

    return (
        <Card withBorder radius="md" mb="xl" bg="gray.0">
            <Text fw={600} mb="md">새 상품 등록</Text>
            <form onSubmit={handleSubmit}>
                <SimpleGrid cols={2} spacing="md">
                    <TextInput
                        label="상품명"
                        placeholder="예: 1:1 10회 패키지"
                        required
                        {...form.getInputProps('name')}
                    />
                    <Select
                        label="수업 유형"
                        data={['1:1', 'GROUP']}
                        required
                        {...form.getInputProps('type')}
                    />
                    <NumberInput
                        label="제공 횟수"
                        min={1}
                        {...form.getInputProps('sessionCount')}
                    />
                    <NumberInput
                        label="유효 기간 (일)"
                        min={1}
                        {...form.getInputProps('durationDays')}
                    />
                    <NumberInput
                        label="판매 가격"
                        required
                        leftSection={<IconCurrencyKRW size={16} />}
                        thousandSeparator
                        {...form.getInputProps('price')}
                    />
                </SimpleGrid>

                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={onClose}>취소</Button>
                    <Button type="submit">등록</Button>
                </Group>
            </form>
        </Card>
    );
}
