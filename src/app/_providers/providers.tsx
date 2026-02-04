'use client';

import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme';

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
            <QueryClientProvider client={queryClient}>
                <MantineProvider theme={theme}>
                    <Notifications />
                    <ModalsProvider>
                        {children}
                    </ModalsProvider>
                </MantineProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
