/**
 * JoinGroupPage Types
 * TypeScript type definitions for the join group page
 */

export type JoinStatus = 'loading' | 'success' | 'error' | 'already-member';

export interface JoinGroupState {
    status: JoinStatus;
    message: string;
}
