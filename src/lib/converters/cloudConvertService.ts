/**
 * CloudConvert API Service for PDF to Word conversion
 * 
 * Free tier: 25 conversions per day
 * Sign up at: https://cloudconvert.com/
 * Get API key from: https://cloudconvert.com/dashboard/api/v2/keys
 */

const CLOUDCONVERT_API_KEY = import.meta.env.VITE_CLOUDCONVERT_API_KEY || '';
const API_BASE = 'https://api.cloudconvert.com/v2';

interface UploadTask {
    id: string;
    operation: string;
    status: string;
    result?: {
        form?: {
            url: string;
            parameters: Record<string, string>;
        };
    };
}

interface CloudConvertTask {
    id: string;
    name: string;
    operation: string;
    status: string;
    result?: {
        files?: Array<{
            filename: string;
            url: string;
        }>;
        form?: {
            url: string;
            parameters: Record<string, string>;
        };
    };
}

interface CloudConvertJob {
    id: string;
    status: string;
    tasks: CloudConvertTask[];
}

/**
 * Convert PDF to DOCX using CloudConvert API
 */
export const convertPdfToDocxCloud = async (file: File): Promise<Blob> => {
    if (!CLOUDCONVERT_API_KEY) {
        throw new Error(
            'CloudConvert API key not configured. Add VITE_CLOUDCONVERT_API_KEY to your .env.local file.'
        );
    }

    try {
        // Step 1: Create a job
        const jobResponse = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tasks: {
                    'import-file': {
                        operation: 'import/upload',
                    },
                    'convert-file': {
                        operation: 'convert',
                        input: ['import-file'],
                        input_format: 'pdf',
                        output_format: 'docx',
                    },
                    'export-file': {
                        operation: 'export/url',
                        input: ['convert-file'],
                        inline: false,
                        archive_multiple_files: false,
                    },
                },
                tag: 'pdf-to-docx',
            }),
        });

        if (!jobResponse.ok) {
            const errorData = await jobResponse.json().catch(() => ({}));
            console.error('Job creation failed:', errorData);
            throw new Error(errorData.message || `Failed to create job: ${jobResponse.status}`);
        }

        const jobData: { data: CloudConvertJob } = await jobResponse.json();
        console.log('Job created:', jobData.data.id);

        // Find the import task
        const importTask = jobData.data.tasks.find(t => t.operation === 'import/upload');
        if (!importTask) {
            throw new Error('Import task not found in job response');
        }

        // Step 2: Get upload URL for the task
        const taskResponse = await fetch(`${API_BASE}/tasks/${importTask.id}`, {
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
            },
        });

        if (!taskResponse.ok) {
            throw new Error('Failed to get upload task details');
        }

        const taskData: { data: UploadTask } = await taskResponse.json();
        
        if (!taskData.data.result?.form) {
            throw new Error('Upload form not available in task');
        }

        const { url: uploadUrl, parameters } = taskData.data.result.form;
        console.log('Upload URL:', uploadUrl);

        // Step 3: Upload the file using the form
        const formData = new FormData();
        
        // Add all parameters from the form
        Object.entries(parameters).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        // Add the file last (important!)
        formData.append('file', file, file.name);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            console.error('Upload failed:', uploadError);
            throw new Error(`Failed to upload file: ${uploadResponse.status}`);
        }

        console.log('File uploaded successfully');

        // Step 4: Wait for job to complete
        const completedJob = await waitForJob(jobData.data.id);
        console.log('Job completed:', completedJob.status);

        // Step 5: Get the download URL
        const exportTask = completedJob.tasks.find(
            t => t.operation === 'export/url' && t.status === 'finished'
        );

        if (!exportTask?.result?.files?.[0]?.url) {
            console.error('Export task:', exportTask);
            throw new Error('Conversion completed but no output file found');
        }

        // Step 6: Download the converted file
        const downloadUrl = exportTask.result.files[0].url;
        console.log('Downloading from:', downloadUrl);

        const downloadResponse = await fetch(downloadUrl);
        if (!downloadResponse.ok) {
            throw new Error('Failed to download converted file');
        }

        return await downloadResponse.blob();
    } catch (error) {
        console.error('CloudConvert error:', error);
        throw error;
    }
};

/**
 * Convert DOCX to PDF using CloudConvert API
 */
export const convertDocxToPdfCloud = async (file: File): Promise<Blob> => {
    if (!CLOUDCONVERT_API_KEY) {
        throw new Error(
            'CloudConvert API key not configured. Add VITE_CLOUDCONVERT_API_KEY to your .env.local file.'
        );
    }

    try {
        // Step 1: Create a job
        const jobResponse = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tasks: {
                    'import-file': {
                        operation: 'import/upload',
                    },
                    'convert-file': {
                        operation: 'convert',
                        input: ['import-file'],
                        input_format: 'docx',
                        output_format: 'pdf',
                    },
                    'export-file': {
                        operation: 'export/url',
                        input: ['convert-file'],
                        inline: false,
                        archive_multiple_files: false,
                    },
                },
                tag: 'docx-to-pdf',
            }),
        });

        if (!jobResponse.ok) {
            const errorData = await jobResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create job');
        }

        const jobData: { data: CloudConvertJob } = await jobResponse.json();
        const importTask = jobData.data.tasks.find(t => t.operation === 'import/upload');
        
        if (!importTask) {
            throw new Error('Import task not found');
        }

        // Step 2: Get upload URL
        const taskResponse = await fetch(`${API_BASE}/tasks/${importTask.id}`, {
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
            },
        });

        if (!taskResponse.ok) {
            throw new Error('Failed to get upload task details');
        }

        const taskData: { data: UploadTask } = await taskResponse.json();
        
        if (!taskData.data.result?.form) {
            throw new Error('Upload form not available');
        }

        const { url: uploadUrl, parameters } = taskData.data.result.form;

        // Step 3: Upload file
        const formData = new FormData();
        Object.entries(parameters).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('file', file, file.name);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
        }

        // Step 4: Wait for completion
        const completedJob = await waitForJob(jobData.data.id);

        // Step 5: Get download URL
        const exportTask = completedJob.tasks.find(
            t => t.operation === 'export/url' && t.status === 'finished'
        );

        if (!exportTask?.result?.files?.[0]?.url) {
            throw new Error('No output file found');
        }

        // Step 6: Download
        const downloadResponse = await fetch(exportTask.result.files[0].url);
        if (!downloadResponse.ok) {
            throw new Error('Failed to download file');
        }

        return await downloadResponse.blob();
    } catch (error) {
        console.error('CloudConvert error:', error);
        throw error;
    }
};

// Poll job status until complete
const waitForJob = async (jobId: string, maxAttempts = 120): Promise<CloudConvertJob> => {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to check job status');
        }

        const { data: job }: { data: CloudConvertJob } = await response.json();

        console.log(`Job status (attempt ${i + 1}):`, job.status);

        if (job.status === 'finished') {
            return job;
        }

        if (job.status === 'error') {
            const errorTask = job.tasks.find(t => t.status === 'error');
            console.error('Error task:', errorTask);
            throw new Error('Conversion job failed');
        }

        // Wait 500ms before next poll
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Conversion timed out');
};

/**
 * Check if CloudConvert is configured
 */
export const isCloudConvertConfigured = (): boolean => {
    return !!CLOUDCONVERT_API_KEY;
};
