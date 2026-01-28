'use client';

import { Table, Badge, Button, Group, Text, ActionIcon, Menu } from '@mantine/core';
import { Reservation } from '@/features/schedule';
import { IconDotsVertical, IconCheck, IconX, IconUser } from '@tabler/icons-react';
import dayjs from 'dayjs';

interface ReservationTableProps {
    data: Reservation[];
    onStatusChange: (id: string, status: Reservation['status']) => void;
}

export function ReservationTable({ data, onStatusChange }: ReservationTableProps) {
    const rows = data.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>
                <Text size="sm" fw={500}>{item.userName}</Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Text size="sm">{item.classTitle}</Text>
                    <Badge variant="outline" size="xs" color="gray">{item.instructorName}</Badge>
                </Group>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{dayjs(item.date).format('YYYY-MM-DD HH:mm')}</Text>
            </Table.Td>
            <Table.Td>
                <Badge
                    color={item.status === 'RESERVED' ? 'teal' : item.status === 'WAITING' ? 'orange' : 'gray'}
                    variant="light"
                >
                    {item.status === 'RESERVED' ? '예약확정' : item.status === 'WAITING' ? '대기' : '취소'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text size="xs" c="dimmed">{dayjs(item.createdAt).format('YYYY-MM-DD')}</Text>
            </Table.Td>
            <Table.Td>
                <Menu shadow="md" width={160} position="bottom-end">
                    <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label>관리</Menu.Label>
                        {item.status !== 'RESERVED' && (
                            <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => onStatusChange(item.id, 'RESERVED')}>
                                예약 확정
                            </Menu.Item>
                        )}
                        {item.status !== 'CANCELED' && (
                            <Menu.Item color="red" leftSection={<IconX size={14} />} onClick={() => onStatusChange(item.id, 'CANCELED')}>
                                예약 취소
                            </Menu.Item>
                        )}
                    </Menu.Dropdown>
                </Menu>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>회원명</Table.Th>
                    <Table.Th>수업 정보</Table.Th>
                    <Table.Th>수업 일시</Table.Th>
                    <Table.Th>상태</Table.Th>
                    <Table.Th>신청일</Table.Th>
                    <Table.Th style={{ width: 50 }}></Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    );
}
