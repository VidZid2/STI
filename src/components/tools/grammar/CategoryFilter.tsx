/**
 * CategoryFilter Component
 * 
 * Displays category tabs with issue counts, allows filter selection,
 * and shows checkmark for resolved categories.
 * 
 * Requirements: 4.2, 4.3, 4.4
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { IssueCategory } from '../../../lib/grammar/types';
import { CATEGORY_COLORS } from '../../../lib/grammar/types';

/**
 * Category display information
 */
export interface CategoryInfo {
  id: IssueCategory;
  name: string;
  count: number;
  isResolved: boolean;
}

export interface CategoryFilterProps {
  categories: CategoryInfo[];
  activeCategory: IssueCategory | null;
  onCategorySelect: (category: IssueCategory | null) => void;
}

/**
 * Category configuration with labels and icons
 */
const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: string }> = {
  correctness: { label: 'Correctness', icon: '✓' },
  clarity: { label: 'Clarity', icon: '◎' },
  engagement: { label: 'Engagement', icon: '★' },
  delivery: { label: 'Delivery', icon: '◆' },
};

/**
 * Individual category tab component
 */
const CategoryTab: React.FC<{
  category: CategoryInfo;
  isActive: boolean;
  onClick: () => void;
}> = ({ category, isActive, onClick }) => {
  const config = CATEGORY_CONFIG[category.id];
  const colors = CATEGORY_COLORS[category.id];

  return (
    <motion.button
      className={`category-tab ${isActive ? 'active' : ''} ${category.isResolved ? 'resolved' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        '--category-color': colors.underline,
        '--category-bg': colors.bg,
      } as React.CSSProperties}
    >
      <span className="tab-icon">{config.icon}</span>
      <span className="tab-label">{config.label}</span>
      {category.isResolved ? (
        <span className="tab-checkmark">✓</span>
      ) : (
        <span className="tab-count">{category.count}</span>
      )}
    </motion.button>
  );
};

/**
 * CategoryFilter component that displays category tabs for filtering issues.
 * Requirements: 4.2 (show issue counts), 4.3 (filter on click), 4.4 (checkmark for resolved)
 */
const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategorySelect,
}) => {
  const totalIssues = categories.reduce((sum, cat) => sum + cat.count, 0);
  const allResolved = categories.every(cat => cat.isResolved);

  return (
    <div className="category-filter">
      {/* All Issues Tab */}
      <motion.button
        className={`category-tab all-tab ${activeCategory === null ? 'active' : ''} ${allResolved ? 'resolved' : ''}`}
        onClick={() => onCategorySelect(null)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="tab-icon">📋</span>
        <span className="tab-label">All Issues</span>
        {allResolved ? (
          <span className="tab-checkmark">✓</span>
        ) : (
          <span className="tab-count">{totalIssues}</span>
        )}
      </motion.button>

      {/* Category Tabs */}
      {categories.map((category) => (
        <CategoryTab
          key={category.id}
          category={category}
          isActive={activeCategory === category.id}
          onClick={() => onCategorySelect(category.id)}
        />
      ))}

      <style>{`
        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s ease;
        }

        .category-tab:hover {
          border-color: var(--category-color, #94a3b8);
          background: var(--category-bg, #f1f5f9);
        }

        .category-tab.active {
          border-color: var(--category-color, #3b82f6);
          background: var(--category-bg, #eff6ff);
          color: #1e293b;
        }

        .category-tab.resolved {
          opacity: 0.7;
        }

        .category-tab.resolved .tab-checkmark {
          color: #22c55e;
        }

        .all-tab {
          --category-color: #3b82f6;
          --category-bg: #eff6ff;
        }

        .tab-icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        .tab-label {
          white-space: nowrap;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: var(--category-color, #94a3b8);
          color: white;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .tab-checkmark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #d1fae5;
          color: #22c55e;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .category-filter {
            padding: 8px 12px;
            gap: 6px;
          }

          .category-tab {
            padding: 6px 10px;
            font-size: 12px;
          }

          .tab-label {
            display: none;
          }

          .category-tab.active .tab-label,
          .all-tab .tab-label {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;

// Export sub-components for potential reuse
export { CategoryTab };
