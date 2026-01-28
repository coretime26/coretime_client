import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import { RegisterMemberCommand, MemberDto } from '../api/members.dto';
import { Member } from '../model/types';
import { notifications } from '@mantine/notifications';

export const memberKeys = {
    all: ['members'] as const,
    lists: () => [...memberKeys.all, 'list'] as const,
    list: (filters: any) => [...memberKeys.lists(), { filters }] as const,
    details: () => [...memberKeys.all, 'detail'] as const,
    detail: (id: string) => [...memberKeys.details(), id] as const,
};

function mapDtoToMember(dto: MemberDto): Member {
    return {
        id: String(dto.id), // Ensure string ID
        name: dto.name,
        phone: dto.phone,
        gender: dto.gender || 'FEMALE',
        status: (dto.status as any) || 'ACTIVE',
        registeredAt: new Date(dto.createdAt),
        lastAttendanceAt: dto.lastAttendanceAt ? new Date(dto.lastAttendanceAt) : undefined,
        pinnedNote: dto.pinnedNote,
        profileImageUrl: dto.profileImageUrl,
        tickets: (dto.tickets || []).map(t => ({
            id: String(t.id),
            name: t.name,
            remainingCount: t.remainingCount
        })),
    };
}

export interface MemberFilters {
    status?: string | string[];
    search?: string;
}

export function useMembers(filters?: MemberFilters) {
    return useQuery({
        queryKey: memberKeys.list(filters),
        queryFn: async () => {
            const dtos = await membersApi.getMembers(filters?.status, filters?.search);
            return dtos.map(mapDtoToMember);
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });
}

export function useMember(id: string) {
    return useQuery({
        queryKey: memberKeys.detail(id),
        queryFn: () => membersApi.getMember(id),
        enabled: !!id,
    });
}

export function useRegisterMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (command: RegisterMemberCommand) => membersApi.registerMember(command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
            notifications.show({
                title: '회원 등록 성공',
                message: '새로운 회원이 등록되었습니다.',
                color: 'blue'
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: '회원 등록 실패',
                message: error.message || '오류가 발생했습니다.',
                color: 'red'
            });
        }
    });
}

export function useUpdateMemberNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, note }: { id: string, note: string }) => membersApi.updateNote(id, note),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
            notifications.show({
                title: '메모 저장 완료',
                message: '회원 메모가 업데이트되었습니다.',
                color: 'green'
            });
        }
    });
}
