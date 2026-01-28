'use client';

import { AppShell, Burger, Group, Skeleton, Text, NavLink, Avatar, Menu, UnstyledButton, Badge, Box, Stack, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
    IconLayoutDashboard,
    IconCalendarEvent,
    IconUsers,
    IconReceipt2,
    IconSpeakerphone,
    IconSettings,
    IconLogout,
    IconBell,
    IconChevronDown,
    IconBuildingStore,
    IconPlus,
    IconUserCheck
} from '@tabler/icons-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth, UserRole } from '@/features/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { authApi, useMyOrganizations, OrganizationResult } from '@/lib/api'; // Added useMyOrganizations
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

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
            label: '회원 관리',
            icon: IconUsers,
            link: '/members',
            children: [
                { label: '회원 목록', link: '/members' },
                { label: '수강권 현황', link: '/members/tickets' },
                { label: '상담/메모 기록', link: '/members/consultations' },
            ]
        },
    ];

    if (role === 'OWNER' || role === 'SYSTEM_ADMIN') {
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
                label: '강사 관리',
                icon: IconUserCheck,
                link: '/center/instructors',
                children: [
                    { label: '강사 조회', link: '/center/instructors' },
                    { label: '강사 등록/승인', link: '/center/instructors?tab=management' },
                ]
            },
            {
                label: '매출 및 결제',
                icon: IconReceipt2,
                link: '/finance',
                children: [
                    { label: '수강권 관리', link: '/finance/tickets' },
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
                label: '설정',
                icon: IconSettings,
                link: '/settings',
                children: [
                    { label: '관리자 설정', link: '/settings' },
                    { label: '프로필 설정', link: '/settings/profile' },
                ]
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
                label: '설정',
                icon: IconSettings,
                link: '/settings',
                children: [
                    { label: '관리자 설정', link: '/settings' },
                    { label: '프로필 설정', link: '/settings/profile' },
                ]
            },
        ];
    }
};

// ... imports ...

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const { user, logout, isLoading: isAuthLoading, refreshUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Fetch Organizations using React Query
    // Use manual query hook or just rely on the one imported
    // Since useMyOrganizations is a hook, we use it directly
    const { data: organizations = [], isLoading: isOrgsLoading } = useMyOrganizations({
        enabled: !!user, // Only fetch if user exists
    });

    const [currentBranch, setCurrentBranch] = useState<string>(''); // Name of current branch
    const [isSwitching, setIsSwitching] = useState(false);

    // Initialize Current Branch
    useEffect(() => {
        if (organizations.length > 0 && !currentBranch) {
            // Logic to select default
            if (user?.organizationId) {
                const current = organizations.find(o => String(o.id) === String(user.organizationId));
                if (current) setCurrentBranch(current.name);
                else setCurrentBranch(organizations[0].name);
            } else {
                setCurrentBranch(organizations[0].name);
            }
        }
    }, [organizations, user, currentBranch]);

    const handleBranchSwitch = (branchName: string) => {
        setIsSwitching(true);
        // Simulate API call/Context update
        setTimeout(() => {
            setCurrentBranch(branchName);
            setIsSwitching(false);
            // In real app: update session or redirect
        }, 800);
    };

    // Show Skeleton if Auth is loading or (optional) if user is null initially but loading
    if (isAuthLoading) {
        return <AppShellSkeleton />;
    }

    if (!user) {
        return null; // Should redirect via middleware or AuthContext logic
    }

    // Critical Fix: If user exists but role is null (e.g. during initial hydration from partial session),
    // show Skeleton until the full profile is loaded to avoid flickering to "Staff" view.
    if (!user.role) {
        return <AppShellSkeleton />;
    }

    const handleRegisterBranch = () => {
        // Direct redirect for Owner, bypassing Identity Check if already logged in
        if (user) {
            if (user.role === 'OWNER' || user.role === 'SYSTEM_ADMIN') {
                router.push('/register/create-center');
                return;
            }
            // If instructor wants to 'register' a branch? Usually they join one. 
            // Let's assume they want to become an owner or join another. 
            // For now, default to identity page or instructor invite page.
            router.push('/register/instructor');
            return;
        }

        // Fallback for non-logged in (unreachable here usually)
        modals.openConfirmModal({
            title: '새 지점 등록',
            children: (
                <Text size="sm">
                    새로운 지점을 등록하시겠습니까? 등록 프로세스를 위해 신원 확인 및 지점 설정 페이지로 이동합니다.
                </Text>
            ),
            labels: { confirm: '이동하기', cancel: '취소' },
            confirmProps: { color: 'teal' },
            onConfirm: () => router.push('/identity'),
        });
    };

    if (!user) {
        return null; // Or skeleton
    }

    const navItems = getNavItems(user.role);

    return (
        <AppShell
            header={{ height: 64 }} // Slightly taller header
            navbar={{
                width: 260,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
            bg="gray.0"
        >
            <AppShell.Header style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="xl">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                            {/* Brand Logo - Click to Home */}
                            <Box onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                                <BrandLogo size="md" />
                            </Box>
                        </Group>

                        {/* Branch Switcher */}
                        {isOrgsLoading ? (
                            <Skeleton height={36} width={180} radius="md" />
                        ) : (
                            <Menu shadow="md" width={220} position="bottom-start" radius="md">
                                <Menu.Target>
                                    <UnstyledButton
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            transition: 'background 0.2s',
                                        }}
                                        className="branch-switcher-btn"
                                    >
                                        <Group gap={6}>
                                            <Box style={{
                                                width: 24, height: 24, borderRadius: '6px',
                                                backgroundColor: 'var(--mantine-color-gray-2)',
                                                color: 'var(--mantine-color-dark-6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <IconBuildingStore size={14} stroke={2} />
                                            </Box>
                                            <Stack gap={0}>
                                                <Text size="10px" c="dimmed" fw={600} style={{ lineHeight: 1 }}>STUDIO</Text>
                                                <Group gap={4} align="center">
                                                    <Text size="sm" fw={700} c="dark.8" style={{ lineHeight: 1 }}>
                                                        {currentBranch || '지점 선택'}
                                                    </Text>
                                                    <IconChevronDown size={12} color="gray" />
                                                </Group>
                                            </Stack>
                                        </Group>
                                    </UnstyledButton>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>내 지점 목록</Menu.Label>
                                    {organizations.map(org => (
                                        <Menu.Item
                                            key={org.id}
                                            leftSection={<IconBuildingStore size={14} />}
                                            color={currentBranch === org.name ? 'indigo' : undefined}
                                            bg={currentBranch === org.name ? 'indigo.0' : undefined}
                                            onClick={() => handleBranchSwitch(org.name)}
                                        >
                                            {org.name}
                                        </Menu.Item>
                                    ))}

                                    <Menu.Divider />

                                    <Menu.Item
                                        leftSection={<IconPlus size={14} />}
                                        onClick={handleRegisterBranch}
                                    >
                                        새 지점 등록하기
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        )}
                    </Group>

                    {/* Right Side Tools */}
                    <Group>
                        <IconBell size={22} stroke={1.5} color="var(--mantine-color-gray-6)" style={{ cursor: 'pointer' }} />
                        {isAuthLoading || !user ? (
                            <Group gap={10}>
                                <Skeleton height={36} circle />
                                <div className="hidden-mobile">
                                    <Skeleton height={14} width={80} mb={4} />
                                    <Skeleton height={11} width={60} />
                                </div>
                            </Group>
                        ) : (
                            <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={400}>
                                <Menu.Target>
                                    <UnstyledButton>
                                        <Group gap={10}>
                                            <Avatar radius="xl" size={36} name={user.name} />
                                            <div style={{ flex: 1 }} className="hidden-mobile">
                                                <Text size="sm" fw={600} style={{ lineHeight: 1.2 }}>{user.name}</Text>
                                                <Text c="dimmed" size="11px" fw={500} style={{ lineHeight: 1 }}>
                                                    {user.role === 'SYSTEM_ADMIN' ? '시스템 관리자' : user.role === 'OWNER' ? '센터장' : user.role === 'INSTRUCTOR' ? '강사' : user.role === 'MEMBER' ? '회원' : '직원'}
                                                </Text>
                                            </div>
                                        </Group>
                                    </UnstyledButton>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>계정 설정</Menu.Label>
                                    <Menu.Item
                                        leftSection={<IconSettings size={14} />}
                                        onClick={() => router.push('/settings/profile')}
                                    >
                                        내 프로필 설정
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item
                                        color="red"
                                        leftSection={<IconLogout size={14} />}
                                        onClick={logout}
                                    >
                                        로그아웃
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                <Suspense fallback={<NavbarSkeleton />}>
                    <NavbarContent navItems={navItems} pathname={pathname} router={router} />
                </Suspense>
            </AppShell.Navbar>

            <AppShell.Main bg="#f8f9fa" style={{ position: 'relative' }}>
                <LoadingOverlay visible={isSwitching} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'teal', type: 'bars' }} />
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
function NavbarContent({ navItems, pathname, router }: { navItems: NavItem[], pathname: string, router: any }) {
    const searchParams = useSearchParams();

    // Reconstruct current path with query params for accurate navbar highlighting
    const currentFullLink = useMemo(() => {
        const query = searchParams.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [pathname, searchParams]);

    return (
        <>
            {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isActive = pathname === item.link || pathname.startsWith(item.link + '/');

                return (
                    <NavLink
                        key={item.label}
                        label={item.label}
                        leftSection={<item.icon size={20} stroke={1.5} />}
                        active={isActive && !hasChildren}
                        defaultOpened={isActive}
                        onClick={() => {
                            if (!hasChildren) router.push(item.link);
                        }}
                        variant="light"
                        fw={500}
                        style={{ borderRadius: '8px', marginBottom: '4px' }}
                    >
                        {hasChildren && item.children!.map((child) => (
                            <NavLink
                                key={child.label}
                                label={child.label}
                                active={currentFullLink === child.link}
                                onClick={() => router.push(child.link)}
                                style={{ borderRadius: '8px', fontSize: '14px', fontWeight: 400 }}
                            />
                        ))}
                    </NavLink>
                );
            })}
        </>
    );
}

function NavbarSkeleton() {
    return (
        <Stack gap="xs">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height={38} radius="8px" />
            ))}
        </Stack>
    );
}
