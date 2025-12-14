/**
 * iLovePDF API Service with Multi-API Key Rotation
 * 
 * Free tier: 250 files per month per account
 * With 5 accounts: 1,250 files per month!
 * 
 * Sign up at: https://developer.ilovepdf.com/signup
 * Get API keys from: https://developer.ilovepdf.com/user/projects
 * 
 * Add to .env.local:
 * VITE_ILOVEPDF_PUBLIC_KEY_1=project_public_xxxxx
 * VITE_ILOVEPDF_SECRET_KEY_1=secret_key_xxxxx
 * VITE_ILOVEPDF_PUBLIC_KEY_2=project_public_xxxxx
 * VITE_ILOVEPDF_SECRET_KEY_2=secret_key_xxxxx
 * ... up to 5 accounts
 */

// ==================== API KEY CONFIGURATION ====================

interface ApiKeyPair {
    publicKey: string;
    secretKey: string;
    name: string;
    isActive: boolean;
}

// Load all API keys from environment
const loadApiKeys = (): ApiKeyPair[] => {
    const keys: ApiKeyPair[] = [];

    for (let i = 1; i <= 5; i++) {
        const publicKey = import.meta.env[`VITE_ILOVEPDF_PUBLIC_KEY_${i}`] || '';
        const secretKey = import.meta.env[`VITE_ILOVEPDF_SECRET_KEY_${i}`] || '';

        if (publicKey && secretKey) {
            keys.push({
                publicKey,
                secretKey,
                name: `Account ${i}`,
                isActive: true,
            });
        }
    }

    return keys;
};

// API Keys pool
let apiKeyPool: ApiKeyPair[] = loadApiKeys();
let currentKeyIndex = 0;

// Track failed keys (quota exceeded) - reset daily
const failedKeys = new Map<string, number>(); // publicKey -> timestamp when failed
const FAILED_KEY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours - quota resets at start of new month

// ==================== KEY ROTATION LOGIC ====================

/**
 * Get the next available API key
 * Automatically rotates when one fails
 */
const getNextAvailableKey = (): ApiKeyPair | null => {
    if (apiKeyPool.length === 0) {
        console.error('No iLovePDF API keys configured');
        return null;
    }

    const now = Date.now();

    // Clean up old failed keys
    failedKeys.forEach((failedTime, key) => {
        if (now - failedTime > FAILED_KEY_TIMEOUT) {
            failedKeys.delete(key);
        }
    });

    // Try to find an available key starting from current index
    for (let attempts = 0; attempts < apiKeyPool.length; attempts++) {
        const keyIndex = (currentKeyIndex + attempts) % apiKeyPool.length;
        const key = apiKeyPool[keyIndex];

        if (!failedKeys.has(key.publicKey)) {
            currentKeyIndex = keyIndex;
            return key;
        }
    }

    // All keys exhausted
    console.error('All iLovePDF API keys exhausted for this period');
    return null;
};

/**
 * Mark a key as failed (quota exceeded)
 */
const markKeyAsFailed = (publicKey: string): void => {
    failedKeys.set(publicKey, Date.now());
    console.warn(`iLovePDF API key exhausted: ${publicKey.substring(0, 20)}...`);

    // Move to next key
    currentKeyIndex = (currentKeyIndex + 1) % apiKeyPool.length;
};

/**
 * Get current API status
 */
export const getApiStatus = (): {
    totalKeys: number;
    activeKeys: number;
    currentKey: string;
    exhaustedKeys: number;
} => {
    const activeCount = apiKeyPool.filter(k => !failedKeys.has(k.publicKey)).length;
    const currentKey = apiKeyPool[currentKeyIndex];

    return {
        totalKeys: apiKeyPool.length,
        activeKeys: activeCount,
        currentKey: currentKey?.name || 'None',
        exhaustedKeys: failedKeys.size,
    };
};

// ==================== API HELPERS ====================

const API_BASE = 'https://api.ilovepdf.com/v1';

interface StartTaskResponse {
    server: string;
    task: string;
}

interface UploadResponse {
    server_filename: string;
}

interface ProcessResponse {
    download_filename: string;
    filesize: number;
    output_filenumber: number;
    output_extensions: string[];
    timer: string;
    status: string;
}


/**
 * Get authenticated token from iLovePDF server
 * Uses HMAC-SHA256 signing via Web Crypto API
 */
const getAuthToken = async (publicKey: string, secretKey: string): Promise<string> => {
    // Create self-signed JWT token
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: 'ilovepdf',
        iat: now,
        exp: now + 7200,
        jti: publicKey
    };

    // Simple base64url encoding
    const b64url = (str: string): string => {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const headerB64 = b64url(JSON.stringify(header));
    const payloadB64 = b64url(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;

    // For HMAC-SHA256 signature, we need to use the Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const data = encoder.encode(signatureInput);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureB64 = b64url(String.fromCharCode(...new Uint8Array(signature)));

    return `${headerB64}.${payloadB64}.${signatureB64}`;
};

// ==================== CONVERSION FUNCTIONS ====================

// Tool names for iLovePDF API:
// - pdfoffice: PDF to Word/Excel/PowerPoint
// - officepdf: Word/Excel/PowerPoint to PDF
// - imagepdf: Images to PDF
// - merge: Merge multiple PDFs
type ToolType = 'pdfoffice' | 'officepdf' | 'imagepdf' | 'merge';

/**
 * Main conversion function with automatic key rotation
 */
const convertWithILovePDF = async (
    files: File[],
    tool: ToolType,
    outputFormat?: string
): Promise<Blob> => {
    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = apiKeyPool.length;

    while (attempts < maxAttempts) {
        const apiKey = getNextAvailableKey();

        if (!apiKey) {
            throw new Error(
                'All iLovePDF API keys are exhausted. Please wait until quota resets (monthly) or add more API keys.'
            );
        }

        try {
            console.log(`Using iLovePDF ${apiKey.name} for ${tool} conversion`);
            return await performConversion(files, tool, apiKey, outputFormat);
        } catch (error) {
            lastError = error as Error;
            const errorMessage = (error as Error).message.toLowerCase();

            // Check if this is a quota/limit error
            if (
                errorMessage.includes('limit') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('exceeded') ||
                errorMessage.includes('credits') ||
                errorMessage.includes('403') ||
                errorMessage.includes('429')
            ) {
                console.warn(`API key limit reached for ${apiKey.name}, rotating to next key...`);
                markKeyAsFailed(apiKey.publicKey);
                attempts++;
            } else {
                // Non-quota error, don't rotate
                throw error;
            }
        }
    }

    throw lastError || new Error('All API keys exhausted');
};

/**
 * Perform the actual conversion
 */
const performConversion = async (
    files: File[],
    tool: ToolType,
    apiKey: ApiKeyPair,
    outputFormat?: string
): Promise<Blob> => {
    // Step 1: Get auth token
    const token = await getAuthToken(apiKey.publicKey, apiKey.secretKey);

    // Step 2: Start task
    const startResponse = await fetch(`${API_BASE}/start/${tool}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('Start task failed:', errorText);
        throw new Error(`Failed to start task: ${startResponse.status} - ${errorText}`);
    }

    const startData: StartTaskResponse = await startResponse.json();
    const { server, task } = startData;
    console.log('Task started:', task, 'on server:', server);

    // Step 3: Upload files
    const uploadedFiles: { server_filename: string; filename: string }[] = [];

    for (const file of files) {
        const formData = new FormData();
        formData.append('task', task);
        formData.append('file', file);

        const uploadResponse = await fetch(`https://${server}/v1/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload failed:', errorText);
            throw new Error(`Failed to upload file: ${uploadResponse.status}`);
        }

        const uploadData: UploadResponse = await uploadResponse.json();
        uploadedFiles.push({
            server_filename: uploadData.server_filename,
            filename: file.name,
        });
        console.log('File uploaded:', file.name);
    }

    // Step 4: Process files
    const processBody: Record<string, unknown> = {
        task: task,
        tool: tool,
        files: uploadedFiles,
    };

    // Add tool-specific options
    if (tool === 'officepdf' && outputFormat) {
        processBody.output_format = outputFormat;
    }

    const processResponse = await fetch(`https://${server}/v1/process`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(processBody),
    });

    if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Process failed:', errorText);
        throw new Error(`Failed to process files: ${processResponse.status} - ${errorText}`);
    }

    const processData: ProcessResponse = await processResponse.json();
    console.log('Processing complete:', processData);

    // Step 5: Download result
    const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!downloadResponse.ok) {
        throw new Error(`Failed to download result: ${downloadResponse.status}`);
    }

    return await downloadResponse.blob();
};

// ==================== PUBLIC API ====================

// NOTE: iLovePDF API does NOT support PDF to Word conversion!
// Only these tools are available:
// - officepdf: Word/Excel/PowerPoint to PDF
// - imagepdf: Images to PDF  
// - merge: Merge multiple PDFs

/**
 * Convert Word (DOCX/DOC) to PDF
 * Uses iLovePDF with automatic key rotation
 */
export const convertDocxToPdfILovePDF = async (file: File): Promise<Blob> => {
    return convertWithILovePDF([file], 'officepdf');
};

/**
 * Convert Images to PDF
 * Supports multiple images, combines into single PDF
 */
export const convertImagesToPdfILovePDF = async (files: File[]): Promise<Blob> => {
    return convertWithILovePDF(files, 'imagepdf');
};

/**
 * Merge multiple PDFs into one
 */
export const mergePdfsILovePDF = async (files: File[]): Promise<Blob> => {
    if (files.length < 2) {
        throw new Error('Please select at least 2 PDF files to merge');
    }
    return convertWithILovePDF(files, 'merge');
};

/**
 * Check if iLovePDF is configured (at least one API key)
 */
export const isILovePDFConfigured = (): boolean => {
    return apiKeyPool.length > 0;
};

/**
 * Get the number of configured API keys
 */
export const getConfiguredKeyCount = (): number => {
    return apiKeyPool.length;
};

/**
 * Get remaining active keys (not exhausted)
 */
export const getActiveKeyCount = (): number => {
    return apiKeyPool.filter(k => !failedKeys.has(k.publicKey)).length;
};

/**
 * Reset all failed keys (useful for testing or manual reset)
 */
export const resetFailedKeys = (): void => {
    failedKeys.clear();
    currentKeyIndex = 0;
    console.log('All iLovePDF API keys reset');
};

/**
 * Reload API keys from environment (useful after config changes)
 */
export const reloadApiKeys = (): void => {
    apiKeyPool = loadApiKeys();
    failedKeys.clear();
    currentKeyIndex = 0;
    console.log(`Loaded ${apiKeyPool.length} iLovePDF API keys`);
};
