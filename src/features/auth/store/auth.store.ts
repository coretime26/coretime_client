import { create } from 'zustand';
import { SignUpCommand } from '../api/auth.dto';

interface AuthState {
    signupToken: string | null;
    registrationData: Partial<SignUpCommand> | null;
    setSignupToken: (token: string | null) => void;
    setRegistrationData: (data: Partial<SignUpCommand> | null) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    signupToken: null,
    registrationData: null,
    setSignupToken: (token) => {
        const currentToken = useAuthStore.getState().signupToken;
        if (currentToken === token) return;

        if (token) {
            sessionStorage.setItem('signupToken', token);
        } else {
            sessionStorage.removeItem('signupToken');
        }
        set({ signupToken: token });
    },
    setRegistrationData: (data) => set({ registrationData: data }),
    reset: () => {
        sessionStorage.removeItem('signupToken');
        set({ signupToken: null, registrationData: null });
    }
}));
