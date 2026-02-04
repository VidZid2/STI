/**
 * StatCard Component Tests
 * Phase 4D: Unit tests for StatCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatCard } from '../components';

// Mock framer-motion
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
            const validProps = Object.fromEntries(
                Object.entries(props).filter(([key]) => 
                    !['initial', 'animate', 'transition', 'whileHover', 'whileTap'].includes(key)
                )
            );
            return <div {...validProps}>{children}</div>;
        },
    },
}));

describe('StatCard', () => {
    const defaultProps = {
        title: 'Total Students',
        value: 42,
        subtitle: '+5 this week',
        color: '#3b82f6',
        index: 0,
        icon: <span data-testid="icon">📊</span>,
    };

    it('should render title correctly', () => {
        render(<StatCard {...defaultProps} />);
        expect(screen.getByText('Total Students')).toBeInTheDocument();
    });

    it('should render value correctly', () => {
        render(<StatCard {...defaultProps} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render subtitle correctly', () => {
        render(<StatCard {...defaultProps} />);
        expect(screen.getByText('+5 this week')).toBeInTheDocument();
    });

    it('should render icon', () => {
        render(<StatCard {...defaultProps} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render string value correctly', () => {
        render(<StatCard {...defaultProps} value="87.5%" />);
        expect(screen.getByText('87.5%')).toBeInTheDocument();
    });
});
