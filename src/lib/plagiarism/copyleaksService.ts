/**
 * Copyleaks Plagiarism Detection Service
 * 5 accounts × 10 scans = 50 scans/month
 * 
 * Setup:
 * 1. Create accounts at https://copyleaks.com/
 * 2. Get API credentials from dashboard
 * 3. Add to .env.local:
 *    VITE_COPYLEAKS_EMAIL_1=your-email-1@example.com
 *    VITE_COPYLEAKS_KEY_1=your-api-key-1
 *    VITE_COPYLEAKS_EMAIL_2=your-email-2@example.com
 *    VITE_COPYLEAKS_KEY_2=your-api-key-2
 *    ... up to 5
 */

interface CopyleaksCredentials {
    email: string;
    key: string;
}

interface CopyleaksResult {
    success: boolean;
    scanId?: string;
    percentPlagiarized?: number;
    totalWords?: number;
    identicalWords?: number;
    similarWords?: number;
    sources?: {
        url: string;
        title: string;
        matchedWords: number;
        percentage: number;
    }[];
    error?: string;
}

// API credentials rotation
const credentials: CopyleaksCredentials[] = [];

// Load credentials from environment
for (let i = 1; i <= 5; i++) {
    const email = import.meta.env[`VITE_COPYLEAKS_EMAIL_${i}`];
    const key = import.meta.env[`VITE_COPYLEAKS_KEY_${i}`];
    if (email && key) {
        credentials.push({ email, key });
    }
}

let currentCredentialIndex = 0;
let accessToken: string | null = null;
let tokenExpiry: number = 0;


/**
 * Check if Copyleaks is configured
 */
export const isCopyleaksConfigured = (): boolean => {
    return credentials.length > 0;
};

/**
 * Get current API status
 */
export const getCopyleaksStatus = () => {
    return {
        configured: isCopyleaksConfigured(),
        accountCount: credentials.length,
        totalScansPerMonth: credentials.length * 10,
    };
};

/**
 * Rotate to next credential
 */
const rotateCredential = () => {
    currentCredentialIndex = (currentCredentialIndex + 1) % credentials.length;
    accessToken = null; // Force new token with new credential
    tokenExpiry = 0;
};

/**
 * Get access token from Copyleaks
 */
const getAccessToken = async (): Promise<string> => {
    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    if (credentials.length === 0) {
        throw new Error('No Copyleaks credentials configured');
    }

    const cred = credentials[currentCredentialIndex];
    
    try {
        const response = await fetch('https://id.copyleaks.com/v3/account/login/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: cred.email,
                key: cred.key,
            }),
        });

        if (!response.ok) {
            // Try next credential if this one fails
            if (credentials.length > 1) {
                rotateCredential();
                return getAccessToken();
            }
            throw new Error('Failed to authenticate with Copyleaks');
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Token expires in ~48 hours, we'll refresh after 24
        tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        
        return accessToken!;
    } catch (error) {
        // Try next credential on error
        if (credentials.length > 1) {
            rotateCredential();
            return getAccessToken();
        }
        throw error;
    }
};


/**
 * Submit text for plagiarism scanning
 */
export const scanForPlagiarism = async (text: string): Promise<CopyleaksResult> => {
    if (!isCopyleaksConfigured()) {
        return {
            success: false,
            error: 'Copyleaks API not configured. Add credentials to .env.local',
        };
    }

    try {
        const token = await getAccessToken();
        const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Submit scan
        const submitResponse = await fetch(
            `https://api.copyleaks.com/v3/education/submit/file/${scanId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    base64: btoa(unescape(encodeURIComponent(text))),
                    filename: 'document.txt',
                    properties: {
                        webhooks: {
                            status: `${window.location.origin}/api/copyleaks/webhook/{STATUS}/${scanId}`,
                        },
                        sandbox: false,
                        expiration: 480, // Results expire after 8 hours
                        sensitivityLevel: 3,
                        cheatDetection: true,
                        aiGeneratedText: {
                            detect: true,
                        },
                    },
                }),
            }
        );

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json().catch(() => ({}));
            
            // If quota exceeded, try next credential
            if (submitResponse.status === 402 || submitResponse.status === 429) {
                if (credentials.length > 1) {
                    rotateCredential();
                    return scanForPlagiarism(text);
                }
                return {
                    success: false,
                    error: 'Monthly scan quota exceeded. Please try again next month.',
                };
            }
            
            return {
                success: false,
                error: errorData.message || 'Failed to submit scan',
            };
        }

        // Poll for results (Copyleaks processes asynchronously)
        // In production, you'd use webhooks, but for simplicity we'll poll
        const result = await pollForResults(token, scanId);
        return result;

    } catch (error) {
        console.error('Copyleaks scan error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};


/**
 * Poll for scan results
 */
const pollForResults = async (token: string, scanId: string, maxAttempts = 30): Promise<CopyleaksResult> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Wait before checking (starts at 2s, increases)
        await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 500)));

        try {
            const statusResponse = await fetch(
                `https://api.copyleaks.com/v3/education/${scanId}/status`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!statusResponse.ok) continue;

            const status = await statusResponse.json();

            if (status.status === 'Completed') {
                // Get the full results
                const resultsResponse = await fetch(
                    `https://api.copyleaks.com/v3/education/${scanId}/result`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (resultsResponse.ok) {
                    const results = await resultsResponse.json();
                    return parseResults(results, scanId);
                }
            } else if (status.status === 'Error') {
                return {
                    success: false,
                    error: 'Scan failed. Please try again.',
                };
            }
            // Continue polling if still processing
        } catch {
            // Continue polling on error
        }
    }

    return {
        success: false,
        error: 'Scan timed out. Please try again.',
    };
};

/**
 * Parse Copyleaks results into our format
 */
const parseResults = (data: any, scanId: string): CopyleaksResult => {
    try {
        const stats = data.scannedDocument?.statistics || {};
        const results = data.results?.internet || [];

        const sources = results.slice(0, 10).map((result: any) => ({
            url: result.url || '',
            title: result.title || 'Unknown Source',
            matchedWords: result.matchedWords || 0,
            percentage: Math.round((result.matchedWords / (stats.totalWords || 1)) * 100),
        }));

        const identicalWords = stats.identicalWords || 0;
        const similarWords = stats.relatedMeaningWords || 0;
        const totalWords = stats.totalWords || 1;
        const percentPlagiarized = Math.round(((identicalWords + similarWords) / totalWords) * 100);

        return {
            success: true,
            scanId,
            percentPlagiarized,
            totalWords,
            identicalWords,
            similarWords,
            sources,
        };
    } catch {
        return {
            success: true,
            scanId,
            percentPlagiarized: 0,
            totalWords: 0,
            sources: [],
        };
    }
};

export type { CopyleaksResult };
