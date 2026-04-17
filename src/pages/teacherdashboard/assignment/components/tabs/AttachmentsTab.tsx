import React from 'react';
import { motion } from 'motion/react';
import { FileUpload } from '../../../../../components/ui/file-upload';
import { useAssignmentContext } from '../../AssignmentFormContext';

const AttachmentsTab: React.FC = () => {
    const { formData, updateFormData } = useAssignmentContext();
    return (
        
                                                <motion.div
                                                    key="attachments"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div style={{
                                                        padding: '20px',
                                                        borderRadius: '16px',
                                                        background: 'var(--accent-bg)',
                                                        border: '1.5px solid var(--border-subtle)',
                                                        marginBottom: '20px',
                                                    }}>
                                                        {/* Header - Centered */}
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            textAlign: 'center',
                                                            marginBottom: '24px'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                marginBottom: '10px'
                                                            }}>
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke='var(--accent-primary)' strokeWidth="2">
                                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                                </svg>
                                                                <span style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: 700,
                                                                    color: 'var(--accent-primary)',
                                                                    letterSpacing: '-0.2px'
                                                                }}>
                                                                    Assignment Attachments
                                                                </span>
                                                            </div>
                                                            <p style={{
                                                                fontSize: '13px',
                                                                color: 'var(--text-primary)',
                                                                fontWeight: 500,
                                                                margin: 0,
                                                                maxWidth: '500px'
                                                            }}>
                                                                Upload necessary files for your students. (Max 25MB per file)
                                                            </p>
                                                        </div>

                                                        {/* FileUpload Component */}
                                                        <div className='' style={{
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            border: '1px solid var(--border-subtle)'
                                                        }}>
                                                            <FileUpload
                                                                files={formData.attachments}
                                                                onChange={(files) => updateFormData('attachments', files)}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
    );
};

export default AttachmentsTab;