import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationsApi } from '../api/consultations.api';
import { ConsultationLog, TSID, ConsultationCategory } from '../model/types';
import { notifications } from '@mantine/notifications';

export const consultationKeys = {
    all: ['consultations'] as const,
    byMember: (membershipId: TSID) => ['consultations', 'member', membershipId] as const,
};

// 1. Fetch Logs
export function useConsultationLogs(membershipId: TSID | undefined) {
    return useQuery({
        queryKey: consultationKeys.byMember(membershipId || ''),
        queryFn: () => consultationsApi.getLogs(membershipId!),
        enabled: !!membershipId, // Only fetch if ID is present
        staleTime: 5 * 60 * 1000,
    });
}

// 2. Create Log (Mutation)
export function useCreateConsultationLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (log: { membershipId: TSID; category: ConsultationCategory; content: string; tags: string[]; consultedAt: Date }) =>
            consultationsApi.createLog(log),
        onSuccess: (newLog) => {
            // Invalidate the specific member's logs
            queryClient.invalidateQueries({ queryKey: consultationKeys.byMember(newLog.membershipId) });

            notifications.show({
                title: '상담 기록 등록',
                message: '새로운 상담 기록이 성공적으로 추가되었습니다.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '등록 실패',
                message: error.message || '상담 기록 등록 중 오류가 발생했습니다.',
                color: 'red',
            });
        }
    });
}

// 3. Update Log (Mutation)
export function useUpdateConsultationLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ logId, data }: { logId: TSID, data: { membershipId: TSID; category: ConsultationCategory; content: string; tags: string[]; consultedAt: Date } }) =>
            consultationsApi.updateLog(logId, data),
        onSuccess: (updatedLog) => {
            queryClient.invalidateQueries({ queryKey: consultationKeys.byMember(updatedLog.membershipId) });

            notifications.show({
                title: '상담 기록 수정',
                message: '상담 기록이 수정되었습니다.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '수정 실패',
                message: error.message || '상담 기록 수정 중 오류가 발생했습니다.',
                color: 'red',
            });
        }
    });
}

// 4. Delete Log (Mutation)
export function useDeleteConsultationLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { logId: TSID; membershipId: TSID }) => consultationsApi.deleteLog(data.logId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: consultationKeys.byMember(variables.membershipId) });

            notifications.show({
                title: '상담 기록 삭제',
                message: '상담 기록이 삭제되었습니다.',
                color: 'blue',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '삭제 실패',
                message: error.message || '상담 기록 삭제 중 오류가 발생했습니다.',
                color: 'red',
            });
        }
    });
}
