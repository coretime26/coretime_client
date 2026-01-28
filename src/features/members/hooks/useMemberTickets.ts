import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberTicketsApi } from '../api/tickets.api';
import { IssueTicketCommand } from '../api/members.dto';
import { notifications } from '@mantine/notifications';

export const ticketKeys = {
    all: ['member-tickets'] as const,
    lists: () => [...ticketKeys.all, 'list'] as const,
    byMember: (memberId: string) => [...ticketKeys.lists(), memberId] as const,
};

export function useMemberTickets(memberId?: string) {
    return useQuery({
        queryKey: memberId ? ticketKeys.byMember(memberId) : ticketKeys.lists(),
        queryFn: () => memberId ? memberTicketsApi.getTicketsByMember(memberId) : memberTicketsApi.getTickets(),
        // If memberId is NOT provided, it fetches ALL tickets (context behavior). 
        // If memberId IS provided, it fetches specific.
    });
}

export function useIssueTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: IssueTicketCommand) => memberTicketsApi.issueTicket(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
            notifications.show({
                title: '수강권 부여 성공',
                message: '회원에게 수강권이 부여되었습니다.',
                color: 'blue'
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '수강권 부여 실패',
                message: error.message || '오류가 발생했습니다.',
                color: 'red'
            });
        }
    });
}
