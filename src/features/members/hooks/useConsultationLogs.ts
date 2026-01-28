import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationsApi } from '../api/consultations.api';
import { ConsultationLog } from '../model/types';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

// Since the original was local state, and we don't have a real backend for logs yet,
// we might need to mimic the local state behavior if we want PERMANENCE across re-renders 
// but query cache is better.
// However, MemberContext was Global State.
// We can use a simple store or just Query Cache with `initialData`.

export const logKeys = {
    all: ['consultations'] as const,
    byMember: (memberId: string) => [...logKeys.all, memberId] as const,
};

export function useConsultationLogs(memberId: string) {
    // We strictly need memberId to fetch logs.
    // If MemberContext provided GLOBAL logs (for all members mixed?), that would be weird.
    // Let's assume memberId is passed or we return empty.

    // Original MemberContext had `logs` which seemed global or tied to current view?
    // "logs: ConsultationLog[]"
    // And "addLog"

    // Let's implement a Client-Side only logs store (Zustand) if we want to match exact behavior 
    // without backend, OR just use React Query with `staleTime: Infinity` to act as cache.

    return useQuery({
        queryKey: logKeys.byMember(memberId),
        queryFn: () => consultationsApi.getLogs(memberId),
        initialData: [],
    });
}

export function useAddConsultationLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (log: Omit<ConsultationLog, 'id' | 'date'>) => consultationsApi.addLog(log),
        onSuccess: (newLog, variables) => {
            const memberId = variables.memberId;
            // Optimistic update or refetch
            queryClient.setQueryData(logKeys.byMember(memberId), (old: ConsultationLog[] = []) => [newLog, ...old]);

            notifications.show({
                title: '상담 기록 저장',
                message: '상담 내용이 저장되었습니다.',
                color: 'green'
            });
        }
    });
}
