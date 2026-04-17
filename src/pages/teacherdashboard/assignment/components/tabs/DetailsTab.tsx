/**
 * DetailsTab — orchestrator for the assignment details form.
 * Phase 20: Decomposed from 587 lines into 3 focused sub-components.
 *
 *  QuickStartSection    — template grid + "use previous assignment"
 *  BasicInfoSection     — title, course/section, type, dates, description, instructions
 *  SaveAsTemplateSection — toggle + template name input
 */
import React from 'react';
import { motion } from 'motion/react';
import { useAssignmentContext } from '../../AssignmentFormContext';
import QuickStartSection from '../details/QuickStartSection';
import BasicInfoSection from '../details/BasicInfoSection';
import SaveAsTemplateSection from '../details/SaveAsTemplateSection';

const DetailsTab: React.FC = () => {
    const { isSmallMobile } = useAssignmentContext();

    return (
        <motion.div
            key="details"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
        >
            <QuickStartSection />
            <BasicInfoSection />
            {!isSmallMobile && <SaveAsTemplateSection />}
        </motion.div>
    );
};

export default DetailsTab;
