'use client';

import { AppShell, Group, Skeleton, Stack, Box } from '@mantine/core';

export function AppShellSkeleton() {
    return (
        <AppShell
            id="mantine-app-shell"
            header={{ height: 64 }}
            navbar={{
                width: 260,
                breakpoint: 'sm',
            }}
            padding="md"
            bg="gray.0"
        >
            <AppShell.Header style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="xl">
                        {/* Logo Placeholder */}
                        <Skeleton height={30} width={120} />

                        {/* Branch Switcher Placeholder */}
                        <Skeleton height={36} width={180} radius="md" />
                    </Group>

                    {/* Right Side Tools */}
                    <Group>
                        <Skeleton circle height={24} />
                        <Group gap={10}>
                            <Skeleton circle height={36} />
                            <div className="hidden-mobile">
                                <Skeleton height={14} width={80} mb={4} />
                                <Skeleton height={10} width={60} />
                            </div>
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
                <Stack gap="sm">
                    {/* Simulate Nav Items */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} height={42} radius="md" />
                    ))}
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main bg="#f8f9fa">
                {/* Content Placeholder */}
                <Stack gap="md">
                    <Skeleton height={40} width={200} mb="lg" />
                    <Group>
                        <Skeleton height={120} radius="md" style={{ flex: 1 }} />
                        <Skeleton height={120} radius="md" style={{ flex: 1 }} />
                        <Skeleton height={120} radius="md" style={{ flex: 1 }} />
                    </Group>
                    <Skeleton height={400} radius="md" />
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
