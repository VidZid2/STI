/**
 * useWidgetVisibility Hook
 * Handles widget show/hide state management
 */

import { useState } from 'react';
import type { WidgetVisibility } from '../types';
import { DEFAULT_WIDGET_VISIBILITY } from '../constants';

interface UseWidgetVisibilityReturn {
    widgetVisibility: WidgetVisibility;
    toggleWidget: (id: string) => void;
    restoreAllWidgets: () => void;
    hasHiddenWidgets: boolean;
    isWidgetVisible: (id: string) => boolean;
}

export const useWidgetVisibility = (): UseWidgetVisibilityReturn => {
    const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>(DEFAULT_WIDGET_VISIBILITY);

    const toggleWidget = (id: string) => {
        setWidgetVisibility((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const restoreAllWidgets = () => {
        setWidgetVisibility(DEFAULT_WIDGET_VISIBILITY);
    };

    const hasHiddenWidgets = Object.values(widgetVisibility).some(visible => !visible);

    const isWidgetVisible = (id: string) => widgetVisibility[id] ?? true;

    return {
        widgetVisibility,
        toggleWidget,
        restoreAllWidgets,
        hasHiddenWidgets,
        isWidgetVisible,
    };
};

export default useWidgetVisibility;
