import { api, ApiResponse } from '@/lib/api';
import { MemberTicketResult, IssueTicketCommand } from './members.dto';

export const memberTicketsApi = {
    // 1. Issue Ticket
    issueTicket: async (command: IssueTicketCommand) => {
        const response = await api.post<ApiResponse<MemberTicketResult>>('/memberships/tickets', command);
        return response.data.data;
    },

    // 2. Get Tickets
    getTickets: async () => {
        const response = await api.get<ApiResponse<MemberTicketResult[]>>('/memberships/tickets');
        return response.data.data;
    },

    // 3. Get Tickets for specific member (if needed, or filter on frontend)
    getTicketsByMember: async (memberId: string) => {
        // Assuming backend supports filtering or we filter frontend
        const response = await api.get<ApiResponse<MemberTicketResult[]>>('/memberships/tickets', {
            params: { memberId }
        });
        return response.data.data;
    }
};
