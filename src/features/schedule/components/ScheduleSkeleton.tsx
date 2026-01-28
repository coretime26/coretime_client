'use client';

import { Card, Grid, Skeleton, Stack, Group, Box } from '@mantine/core';

export function ScheduleSkeleton() {
    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <div>
                    <Skeleton height={28} width={200} mb={8} />
                    <Skeleton height={14} width={150} />
                </div>
                <Group>
                    <Skeleton height={36} width={100} radius="md" />
                    <Skeleton height={36} width={100} radius="md" />
                </Group>
            </Group>

            {/* Week Grid Skeleton */}
            <Grid>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <Grid.Col key={day} span="auto" style={{ minWidth: 140 }}>
                        <Card withBorder padding="sm" h={600} radius="md">
                            <Stack gap="xs" mb="md">
                                <Skeleton height={20} width={40} radius="xl" mb="xs" />
                            </Stack>

                            <Stack gap="sm">
                                <Skeleton height={100} radius="md" />
                                <Skeleton height={100} radius="md" />
                                <Skeleton height={100} radius="md" />
                            </Stack>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
        </Stack>
    );
}
