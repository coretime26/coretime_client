'use client';

import { Card, Grid, Skeleton, Stack, Group, Box } from '@mantine/core';

export function ScheduleSkeleton() {
    return (
        <Stack gap="md" h="100%" w="100%">
            {/* Header / Toolbar Skeleton */}
            <Group justify="space-between" mb="sm">
                <Skeleton height={32} width={200} radius="md" />
                <Group>
                    <Skeleton height={32} width={80} radius="md" />
                    <Skeleton height={32} width={100} radius="md" />
                </Group>
            </Group>

            {/* Calendar Grid Skeleton */}
            <Grid gutter="xs" style={{ flex: 1 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <Grid.Col key={i} span="auto" style={{ minWidth: 0, height: '100%' }}>
                        <Stack h="100%" gap="sm">
                            {/* Day Header */}
                            <Box ta="center" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                                <Skeleton height={20} width={40} radius="sm" mx="auto" mb={4} />
                                <Skeleton height={14} width={30} radius="sm" mx="auto" />
                            </Box>

                            {/* Slots */}
                            <Stack gap="xs" px={4} style={{ flex: 1 }}>
                                {/* Randomly place a few skeleton blocks to mimic schedule */}
                                <Skeleton height={80} radius="md" mt={20} />
                                <Skeleton height={60} radius="md" mt={40} />
                                <Skeleton height={90} radius="md" />
                            </Stack>
                        </Stack>
                    </Grid.Col>
                ))}
            </Grid>
        </Stack>
    );
}
