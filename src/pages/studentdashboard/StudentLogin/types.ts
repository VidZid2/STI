/**
 * StudentLogin Types
 * TypeScript type definitions for the login page
 */

export type LoginStep = 'pick' | 'email' | 'password' | 'options';

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
