/**
 * Adobe PDF Services API - PDF to Word Conversion
 * 
 * Free tier: 500 documents per month per account (refreshes monthly!)
 * With 5 accounts: 2,500 PDF to Word conversions per month!
 * 
 * Uses the same multi-key rotation system as iLovePDF
 */

// ==================== API KEY CONFIGURATION ====================

interface AdobeApiKey {
    clientId: string;
    clientSecret: string;
    name: string;
    isActive: boolean;
}

// Load all API keys from environment
const loadAdobeApiKeys = (): AdobeApiKey[] => {
    const keys: AdobeApiKey[] = [];

    for (let i = 1; i <= 5; i++) {
        const clientId = import.meta.env[`VITE_ADOBE_CLIENT_ID_${i}`] || '';
        const clientSecret = import.meta.env[`VITE_ADOBE_CLIENT_SECRET_${i}`] || '';

        if (clientId && clientSecret) {
            keys.push({
                clientId,
                clientSecret,
                name: `Adobe Account ${i}`,
                isActive: true,
            });
        }
    }

    return keys;
};

// API Keys pool
let adobeKeyPool: AdobeApiKey[] = loadAdobeApiKeys();
let currentAdobeKeyIndex = 0;

// Track failed keys (quota exceeded) - reset monthly
const failedAdobeKeys = new Map<string, number>(); // clientId -> timestamp when failed
const FAILED_KEY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// ==================== KEY ROTATION LOGIC ====================

/**
 * Get the next available Adobe API key
 */
const getNextAvailableAdobeKey = (): AdobeApiKey | null => {
    if (adobeKeyPool.length === 0) {
        console.error('No Adobe PDF Services API keys configured');
        return null;
    }

    const now = Date.now();

    // Clean up old failed keys
    failedAdobeKeys.forEach((failedTime, key) => {
        if (now - failedTime > FAILED_KEY_TIMEOUT) {
            failedAdobeKeys.delete(key);
        }
    });

    // Try to find an available key
    for (let attempts = 0; attempts < adobeKeyPool.length; attempts++) {
        const keyIndex = (currentAdobeKeyIndex + attempts) % adobeKeyPool.length;
        const key = adobeKeyPool[keyIndex];

        if (!failedAdobeKeys.has(key.clientId)) {
            currentAdobeKeyIndex = keyIndex;
            return key;
        }
    }

    console.error('All Adobe API keys exhausted for this period');
    return null;
};

/**
 * Mark a key as failed (quota exceeded)
 */
const markAdobeKeyAsFailed = (clientId: string): void => {
    failedAdobeKeys.set(clientId, Date.now());
    console.warn(`Adobe API key exhausted: ${clientId.substring(0, 10)}...`);
    currentAdobeKeyIndex = (currentAdobeKeyIndex + 1) % adobeKeyPool.length;
};

/**
 * Get current Adobe API status
 */
export const getAdobeApiStatus = (): {
    totalKeys: number;
    activeKeys: number;
    currentKey: string;
    exhaustedKeys: number;
} => {
    const activeCount = adobeKeyPool.filter(k => !failedAdobeKeys.has(k.clientId)).length;
    const currentKey = adobeKeyPool[currentAdobeKeyIndex];

    return {
        totalKeys: adobeKeyPool.length,
        activeKeys: activeCount,
        currentKey: currentKey?.name || 'None',
        exhaustedKeys: failedAdobeKeys.size,
    };
};

// ==================== ADOBE API HELPERS ====================

const ADOBE_AUTH_URL = 'https://pdf-services.adobe.io/token';
const ADOBE_API_URL = 'https://pdf-services.adobe.io';

interface AdobeTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface AdobeAssetResponse {
    assetID: string;
    uploadUri: string;
}

/**
 * Get OAuth access token from Adobe
 */
const getAdobeAccessToken = async (clientId: string, clientSecret: string): Promise<string> => {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await fetch(ADOBE_AUTH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Adobe auth failed:', errorText);
        throw new Error(`Adobe authentication failed: ${response.status}`);
    }

    const data: AdobeTokenResponse = await response.json();
    return data.access_token;
};

/**
 * Create an upload asset (pre-signed URL)
 */
const createAsset = async (accessToken: string, clientId: string, mediaType: string): Promise<AdobeAssetResponse> => {
    const response = await fetch(`${ADOBE_API_URL}/assets`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-api-key': clientId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mediaType: mediaType,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create asset: ${response.status} - ${errorText}`);
    }

    return await response.json();
};

/**
 * Upload file to Adobe's pre-signed URL
 */
const uploadToAsset = async (uploadUri: string, file: File): Promise<void> => {
    const response = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type || 'application/pdf',
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.status}`);
    }
};

/**
 * Start PDF to DOCX export job
 */
const startExportJob = async (accessToken: string, clientId: string, assetId: string): Promise<string> => {
    const response = await fetch(`${ADOBE_API_URL}/operation/exportpdf`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-api-key': clientId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assetID: assetId,
            targetFormat: 'docx',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        // Check for quota errors
        if (response.status === 429 || errorText.includes('quota') || errorText.includes('limit')) {
            throw new Error(`quota_exceeded: ${response.status}`);
        }

        throw new Error(`Failed to start export job: ${response.status} - ${errorText}`);
    }

    // Get the job location from header
    const location = response.headers.get('x-request-id') || response.headers.get('location');

    // For polling, we need the operation location
    const locationHeader = response.headers.get('location');
    if (locationHeader) {
        return locationHeader;
    }

    // If no location, try to get from response body
    const data = await response.json().catch(() => ({}));
    return data.jobId || location || '';
};

/**
 * Poll job status until complete
 */
const pollJobStatus = async (
    accessToken: string,
    clientId: string,
    jobLocation: string
): Promise<string> => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const response = await fetch(jobLocation, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': clientId,
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('quota_exceeded');
            }
            continue; // Retry
        }

        const data = await response.json();

        if (data.status === 'done' || data.status === 'succeeded') {
            // Return the download URI
            return data.asset?.downloadUri || data.downloadUri || data.content?.downloadUri;
        } else if (data.status === 'failed') {
            throw new Error(`Job failed: ${data.error?.message || 'Unknown error'}`);
        }

        console.log(`Adobe job status: ${data.status} (attempt ${attempt + 1})`);
    }

    throw new Error('Job timed out');
};

/**
 * Download the converted file
 */
const downloadResult = async (downloadUri: string): Promise<Blob> => {
    const response = await fetch(downloadUri);

    if (!response.ok) {
        throw new Error(`Failed to download result: ${response.status}`);
    }

    return await response.blob();
};

// ==================== MAIN CONVERSION FUNCTION ====================

/**
 * Convert PDF to Word using Adobe PDF Services
 * With automatic multi-key rotation
 */
const convertPdfToDocxWithAdobe = async (file: File): Promise<Blob> => {
    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = adobeKeyPool.length;

    while (attempts < maxAttempts) {
        const apiKey = getNextAvailableAdobeKey();

        if (!apiKey) {
            throw new Error(
                'All Adobe PDF Services API keys are exhausted. Please wait until quota resets (monthly) or add more API keys.'
            );
        }

        try {
            console.log(`Using ${apiKey.name} for PDF to Word conversion`);

            // Step 1: Get access token
            const accessToken = await getAdobeAccessToken(apiKey.clientId, apiKey.clientSecret);
            console.log('Adobe: Got access token');

            // Step 2: Create asset and get upload URL
            const asset = await createAsset(accessToken, apiKey.clientId, 'application/pdf');
            console.log('Adobe: Created asset', asset.assetID);

            // Step 3: Upload the PDF
            await uploadToAsset(asset.uploadUri, file);
            console.log('Adobe: Uploaded file');

            // Step 4: Start export job
            const jobLocation = await startExportJob(accessToken, apiKey.clientId, asset.assetID);
            console.log('Adobe: Started conversion job');

            // Step 5: Poll for completion
            const downloadUri = await pollJobStatus(accessToken, apiKey.clientId, jobLocation);
            console.log('Adobe: Job completed');

            // Step 6: Download result
            const result = await downloadResult(downloadUri);
            console.log('Adobe: Downloaded result');

            return result;

        } catch (error) {
            lastError = error as Error;
            const errorMessage = (error as Error).message.toLowerCase();

            // Check if this is a quota/limit error
            if (
                errorMessage.includes('quota') ||
                errorMessage.includes('limit') ||
                errorMessage.includes('exceeded') ||
                errorMessage.includes('429')
            ) {
                console.warn(`API key quota reached for ${apiKey.name}, rotating to next key...`);
                markAdobeKeyAsFailed(apiKey.clientId);
                attempts++;
            } else {
                // Non-quota error, don't rotate
                throw error;
            }
        }
    }

    throw lastError || new Error('All Adobe API keys exhausted');
};

// ==================== PUBLIC API ====================

/**
 * Convert PDF to Word (DOCX) using Adobe PDF Services
 * Best quality conversion available!
 */
export const convertPdfToDocxAdobe = async (file: File): Promise<Blob> => {
    return convertPdfToDocxWithAdobe(file);
};

/**
 * Check if Adobe PDF Services is configured (at least one API key)
 */
export const isAdobeConfigured = (): boolean => {
    return adobeKeyPool.length > 0;
};

/**
 * Get the number of configured Adobe API keys
 */
export const getAdobeKeyCount = (): number => {
    return adobeKeyPool.length;
};

/**
 * Get remaining active keys (not exhausted)
 */
export const getAdobeActiveKeyCount = (): number => {
    return adobeKeyPool.filter(k => !failedAdobeKeys.has(k.clientId)).length;
};

/**
 * Reset all failed Adobe keys
 */
export const resetFailedAdobeKeys = (): void => {
    failedAdobeKeys.clear();
    currentAdobeKeyIndex = 0;
    console.log('All Adobe API keys reset');
};

/**
 * Reload Adobe API keys from environment
 */
export const reloadAdobeApiKeys = (): void => {
    adobeKeyPool = loadAdobeApiKeys();
    failedAdobeKeys.clear();
    currentAdobeKeyIndex = 0;
    console.log(`Loaded ${adobeKeyPool.length} Adobe API keys`);
};
