import { Modal, TextInput, Select, Button, Group, Textarea, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { IMaskInput } from 'react-imask';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi, UpdateMemberCommand, RegisterByStaffCommand } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { useSession } from 'next-auth/react';
import { Member } from '@/features/members';

interface MemberFormModalProps {
    opened: boolean;
    onClose: () => void;
    member?: Member | null; // If provided, edit mode
}

export default function MemberFormModal({ opened, onClose, member }: MemberFormModalProps) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    const form = useForm({
        initialValues: {
            name: '',
            phone: '',
            gender: 'FEMALE',
            birthDate: null as Date | null,
            pinnedNote: '',
            status: 'ACTIVE',
        },
        validate: {
            name: (value) => (value.length < 2 ? '이름은 2글자 이상이어야 합니다.' : null),
            phone: (value) => (/^\d{3}-\d{3,4}-\d{4}$/.test(value) ? null : '올바른 전화번호 형식이 아닙니다 (010-0000-0000)'),
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            // New Staff-initiated Registration Point 2 (POST /memberships/register)
            const membership = await memberApi.registerByStaff({
                name: values.name,
                phone: values.phone,
                gender: values.gender as any,
                birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined,
            });

            // Update remaining fields (Note, Status) via Unified Update API (Point 4)
            await memberApi.updateMember(membership.id, {
                name: values.name,
                phone: values.phone,
                gender: values.gender as any,
                birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined,
                status: values.status,
                pinnedNote: values.pinnedNote,
            });

            return membership;
        },
        onSuccess: () => {
            notifications.show({
                title: '등록 완료',
                message: '신규 회원이 성공적으로 등록되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['members'] });
            onClose();
            form.reset();
        },
        onError: (error) => {
            console.error('Registration failed:', error);
            notifications.show({
                title: '등록 실패',
                message: '회원 등록 중 오류가 발생했습니다.',
                color: 'red',
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            if (!member) return;
            const membershipId = member.id;

            await memberApi.updateMember(membershipId, {
                name: values.name,
                phone: values.phone,
                gender: values.gender as any,
                birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : undefined,
                status: values.status,
                pinnedNote: values.pinnedNote,
            });
        },
        onSuccess: () => {
            notifications.show({
                title: '수정 완료',
                message: '회원 정보가 성공적으로 업데이트되었습니다.',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['members'] });
            onClose();
        },
        onError: (error) => {
            console.error('Update failed:', error);
            notifications.show({
                title: '수정 실패',
                message: '정보 수정 중 오류가 발생했습니다.',
                color: 'red',
            });
        }
    });

    // Reset or populate form when opened/member changes
    useEffect(() => {
        if (opened) {
            if (member) {
                form.setValues({
                    name: member.name,
                    phone: member.phone,
                    gender: member.gender,
                    birthDate: member.birthDate ? new Date(member.birthDate) : null,
                    pinnedNote: member.pinnedNote || '',
                    status: member.status,
                });
            } else {
                form.reset();
            }
        }
    }, [opened, member]);

    const handleSubmit = (values: typeof form.values) => {
        if (member) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={member ? "회원 정보 수정" : "신규 회원 등록"}
            centered
            zIndex={300}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="이름"
                    placeholder="홍길동"
                    required
                    mb="sm"
                    {...form.getInputProps('name')}
                />

                <TextInput
                    component={IMaskInput}
                    {...({ mask: "000-0000-0000" } as any)}
                    label="전화번호"
                    placeholder="010-0000-0000"
                    required
                    mb="sm"
                    {...form.getInputProps('phone')}
                />

                <Group grow mb="sm">
                    <Select
                        label="성별"
                        data={[
                            { value: 'FEMALE', label: '여성' },
                            { value: 'MALE', label: '남성' }
                        ]}
                        {...form.getInputProps('gender')}
                    />
                    <DateInput
                        label="생년월일"
                        placeholder="YYYY-MM-DD"
                        valueFormat="YYYY-MM-DD"
                        {...form.getInputProps('birthDate')}
                    />
                </Group>

                {member && (
                    <Select
                        label="회원 상태"
                        mb="sm"
                        data={[
                            { value: 'ACTIVE', label: '활성화' },
                            { value: 'INACTIVE', label: '비활성화' },
                            { value: 'PENDING_APPROVAL', label: '승인대기' },
                            { value: 'WITHDRAWN', label: '탈퇴' },
                            { value: 'REJECTED', label: '가입거절' },
                        ]}
                        {...form.getInputProps('status')}
                    />
                )}

                <Textarea
                    label="신체 특이사항 (중요)"
                    placeholder="예: 허리 디스크, 목 통증 등"
                    minRows={3}
                    mb="lg"
                    {...form.getInputProps('pinnedNote')}
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>취소</Button>
                    <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                        {member ? "수정 저장" : "등록하기"}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
