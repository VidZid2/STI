
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToolsSkeleton } from '../components/ToolsShared';

describe('ToolsSkeleton', () => {
    it('renders the correct number of ToolItemSkeleton cards based on count prop', () => {
        // Render with 5 cards
        render(<ToolsSkeleton count={5} />);
        
        // The container role="status" should be present
        const statusContainer = screen.getByRole('status');
        expect(statusContainer).toBeInTheDocument();
        expect(statusContainer).toHaveAttribute('aria-label', 'Loading tools');

        // We expect exactly 5 skeletons for the grid items.
        // Wait, since motion.div in React Testing Library might render differently depending on setup,
        // we can count the elements by matching their unique class.
        // The grid container itself is present:
        const grid = document.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        
        // Each skeleton card has min-h-[280px]
        const skeletonCards = document.querySelectorAll('.min-h-\\[280px\\]');
        expect(skeletonCards.length).toBe(5);
    });

    it('renders the default number of cards when no count is provided', () => {
        render(<ToolsSkeleton />);
        
        // Default is 7 based on ToolsSkeletonProps
        const skeletonCards = document.querySelectorAll('.min-h-\\[280px\\]');
        expect(skeletonCards.length).toBe(7);
    });

    it('applies proper accessibility ARIA attributes', () => {
        render(<ToolsSkeleton />);
        
        // Main wrapper should have role="status"
        expect(screen.getByRole('status')).toBeInTheDocument();
        
        // Decorative elements like the Hero skeleton and Tab skeleton should be hidden from screen readers
        const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
        // Hero, Tabs, and Grid are 3 main hidden wrappers, plus each card has an aria-hidden background glow
        expect(hiddenElements.length).toBeGreaterThanOrEqual(3);
    });

    it('contains Tailwind animation and responsive grid classes to prevent layout shifts', () => {
        render(<ToolsSkeleton />);
        
        // Check grid wrapper for responsive classes
        const grid = document.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
        expect(grid).toHaveClass('xl:grid-cols-4');

        // Check if shimmer elements have 'animate-pulse'
        const pulseElements = document.querySelectorAll('.animate-pulse');
        expect(pulseElements.length).toBeGreaterThan(0);
    });
});
