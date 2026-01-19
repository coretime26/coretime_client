'use client';

import { AppShell, Burger, Group, Skeleton, Text, NavLink, Avatar, Menu, UnstyledButton, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconLayoutDashboard,
    IconCalendarEvent,
    IconUsers,
    IconReceipt2,
    IconSpeakerphone,
    IconSettings,
    IconLogout,
    IconBell
} from '@tabler/icons-react';
import { StudioWeightLogo } from '@/components/common/StudioWeightLogo';
import { useAuth, UserRole } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Navigation items based on role
interface NavItem {
    label: string;
    icon: React.ElementType;
    link: string;
    children?: { label: string; link: string }[];
}

const getNavItems = (role: UserRole): NavItem[] => {
    const common = [
        { label: '대시보드', icon: IconLayoutDashboard, link: '/' },
        {
            label: '회원 관리 (CRM)',
            icon: IconUsers,
            link: '/members',
            children: [
                { label: '회원 목록', link: '/members' },
                { label: '수강권 현황', link: '/members/tickets' },
                { label: '상담/메모 기록', link: '/members/consultations' },
            ]
        },
    ];

    if (role === 'OWNER') {
        return [
            ...common,
            {
                label: '스케줄 관리',
                icon: IconCalendarEvent,
                link: '/schedule',
                children: [
                    { label: '캘린더 뷰', link: '/schedule' },
                    { label: '예약 관리', link: '/schedule/reservations' },
                    { label: '출석 체크', link: '/schedule/attendance' },
                ]
            },

            {
                label: '매출 및 결제',
                icon: IconReceipt2,
                link: '/finance',
                children: [
                    { label: '수강권 관리', link: '/finance/tickets' },
                    { label: '수강권 생성', link: '/finance/tickets/create' },
                    { label: '결제/미수금', link: '/finance/payments' },
                    { label: '매출 통계', link: '/finance/stats' },
                ]
            },
            {
                label: '마케팅/소통',
                icon: IconSpeakerphone,
                link: '/marketing',
                children: [
                    { label: '메시지 발송', link: '/marketing/messages' },
                    { label: '알림 설정', link: '/marketing/settings' },
                ]
            },
            {
                label: '관리자 설정',
                icon: IconSettings,
                link: '/settings',
            },
        ];
    } else {
        return [
            ...common,
            {
                label: '스케줄 관리',
                icon: IconCalendarEvent,
                link: '/schedule',
                children: [
                    { label: '캘린더 (수업)', link: '/schedule' },
                    { label: '예약 관리', link: '/schedule/reservations' },
                    { label: '출석 체크', link: '/schedule/attendance' },
                ]
            },
            {
                label: '관리자 설정',
                icon: IconSettings,
                link: '/settings',
            },
        ];
    }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    if (!user) {
        return null;
    }

    const navItems = getNavItems(user.role);

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
            bg="gray.0"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Group gap={8} style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
                            <StudioWeightLogo size={30} />
                            <Text fw={700} size="lg" c="indigo">
                                CoreTime
                            </Text>
                        </Group>

                        {/* Breadcrumbs or Page Title could go here */}
                        {user.organizationId && (
                            <Badge variant="light" color="gray" size="lg" radius="xs">
                                {user.organizationId === 'org_pending' ? '승인 대기 중' : '스튜디오웨이트 강남점'}
                            </Badge>
                        )}
                    </Group>

                    <Group>
                        <IconBell size={20} stroke={1.5} />
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <UnstyledButton>
                                    <Group gap={8}>
                                        <Avatar radius="xl" color="indigo" name={user.name} />
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" fw={500}>{user.name}</Text>
                                            <Text c="dimmed" size="xs">
                                                {user.role === 'OWNER' ? '센터장' : '강사'}
                                            </Text>
                                        </div>
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item leftSection={<IconSettings size={14} />}>내 프로필</Menu.Item>
                                <Menu.Item
                                    color="red"
                                    leftSection={<IconLogout size={14} />}
                                    onClick={logout}
                                >
                                    로그아웃
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                {navItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = pathname === item.link || pathname.startsWith(item.link + '/');

                    return (
                        <NavLink
                            key={item.label}
                            label={item.label}
                            leftSection={<item.icon size={20} stroke={1.5} />}
                            active={isActive && !hasChildren} // Only active if no children (or handle parent active state distinct)
                            // If has children, we might want it opened by default if active
                            defaultOpened={isActive}
                            onClick={() => {
                                if (!hasChildren) router.push(item.link);
                            }}
                            variant="light"
                            color="indigo"
                            style={{ borderRadius: '8px', marginBottom: '4px' }}
                        >
                            {hasChildren && item.children!.map((child) => (
                                <NavLink
                                    key={child.label}
                                    label={child.label}
                                    active={pathname === child.link}
                                    onClick={() => router.push(child.link)}
                                    // Indent or style
                                    style={{ borderRadius: '8px', fontSize: '14px' }}
                                />
                            ))}
                        </NavLink>
                    );
                })}
            </AppShell.Navbar>

            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
