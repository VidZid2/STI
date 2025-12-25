/**
 * StudentLogin Types
 * TypeScript type definitions for the login page
 */

export type LoginStep = 'email' | 'pick-account' | 'password' | 'sign-in-options';

export interface SavedAccount {
    email: string;
    name: string;
}

export interface LoginFormState {
    email: string;
    password: string;
    selectedEmail: string;
    loginError: string;
    emailError: string;
    isLoading: boolean;
    showForgetDropdown: string | null;
    isTransitioning: boolean;
}
