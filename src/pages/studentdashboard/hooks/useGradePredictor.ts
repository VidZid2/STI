/**
 * useGradePredictor Hook
 * Handles grade prediction loading and calculation
 */

import { useState, useEffect } from 'react';
import { getCourseProgressData } from '../../../services/studyTimeService';
import type { GradePrediction } from '../types';
import { COURSE_NAMES } from '../constants';
import { getLetterGrade } from '../utils';

interface UseGradePredictorReturn {
    gradePredictor: GradePrediction;
    refreshGradePredictor: () => Promise<void>;
}

export const useGradePredictor = (refreshTrigger: number): UseGradePredictorReturn => {
    const [gradePredictor, setGradePredictor] = useState<GradePrediction>({
        predictedGrade: 0,
        letterGrade: 'N/A',
        confidence: 0,
        breakdown: []
    });

    const loadGradePrediction = async () => {
        try {
            // Import the service dynamically to avoid circular dependencies
            const { getGradePrediction } = await import('../../../services/gradePredictorService');
            const prediction = await getGradePrediction();
            setGradePredictor(prediction);
        } catch (err) {
            console.error('[GradePredictor] Failed to load prediction:', err);
            // Fallback to local calculation
            calculateLocalPrediction();
        }
    };

    const calculateLocalPrediction = () => {
        const courseData = getCourseProgressData();
        const courses = Object.entries(courseData);

        if (courses.length === 0) {
            setGradePredictor({ predictedGrade: 0, letterGrade: 'N/A', confidence: 0, breakdown: [] });
            return;
        }

        let totalWeight = 0;
        let weightedSum = 0;
        const breakdown: { name: string; progress: number; contribution: number }[] = [];

        courses.forEach(([id, data]) => {
            const weight = data.totalModules;
            totalWeight += weight;
            const progressScore = data.progress;
            const completionBonus = data.progress === 100 ? 5 : 0;
            const adjustedScore = Math.min(100, progressScore + completionBonus);
            weightedSum += adjustedScore * weight;
            breakdown.push({
                name: COURSE_NAMES[id] || id,
                progress: data.progress,
                contribution: Math.round((adjustedScore * weight) / Math.max(totalWeight, 1))
            });
        });

        const predictedGrade = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        const letterGrade = getLetterGrade(predictedGrade);

        const avgProgress = courses.reduce((sum, [, d]) => sum + d.progress, 0) / courses.length;
        const confidence = Math.min(100, Math.round(avgProgress * 1.2));
        breakdown.sort((a, b) => b.contribution - a.contribution);

        setGradePredictor({
            predictedGrade,
            letterGrade,
            confidence,
            breakdown: breakdown.slice(0, 3)
        });
    };

    useEffect(() => {
        loadGradePrediction();
    }, [refreshTrigger]);

    return {
        gradePredictor,
        refreshGradePredictor: loadGradePrediction,
    };
};

export default useGradePredictor;
