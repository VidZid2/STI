// Profile Service - Local Database using localStorage
// This service handles saving and loading user profile data

export interface UserProfile {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    studentId: string;
    course: string;
    yearLevel: string;
    section: string;
    phone: string;
    birthday: string;
    address: string;
}

export interface UserImages {
    coverImage: string | null;
    profileImage: string | null;
}

export interface UserSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    courseReminders: boolean;
    assignmentAlerts: boolean;
    gradeUpdates: boolean;
    showOnlineStatus: boolean;
}

export interface UserAppearance {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: number;
}

const STORAGE_KEYS = {
    PROFILE: 'user_profile',
    IMAGES: 'user_images',
    SETTINGS: 'user_settings',
    APPEARANCE: 'user_appearance',
};

const DEFAULT_PROFILE: UserProfile = {
    firstName: 'Josiah',
    middleName: 'P',
    lastName: 'De Asis',
    email: 'josiah.deasis@sti.edu.ph',
    studentId: '02000123456',
    course: 'BS Information Technology',
    yearLevel: '3rd Year',
    section: 'BSIT-3A',
    phone: '+63 912 345 6789',
    birthday: '2003-05-15',
    address: 'Manila, Philippines',
};

const DEFAULT_SETTINGS: UserSettings = {
    emailNotifications: true,
    pushNotifications: true,
    courseReminders: true,
    assignmentAlerts: true,
    gradeUpdates: true,
    showOnlineStatus: true,
};

const DEFAULT_APPEARANCE: UserAppearance = {
    theme: 'light',
    accentColor: 'blue',
    fontSize: 14,
};

// Profile Functions
export const getProfile = (): UserProfile => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
    return DEFAULT_PROFILE;
};

export const saveProfile = async (profile: UserProfile): Promise<{ success: boolean; message: string }> => {
    try {
        // Simulate network delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        return { success: true, message: 'Profile saved successfully!' };
    } catch (error) {
        console.error('Error saving profile:', error);
        return { success: false, message: 'Failed to save profile. Please try again.' };
    }
};

// Images Functions
export const getImages = (): UserImages => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.IMAGES);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
    return { coverImage: null, profileImage: null };
};

export const saveImages = async (images: UserImages): Promise<{ success: boolean; message: string }> => {
    try {
        localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        return { success: true, message: 'Images saved successfully!' };
    } catch (error) {
        console.error('Error saving images:', error);
        return { success: false, message: 'Failed to save images. Please try again.' };
    }
};

export const saveCoverImage = async (coverImage: string | null): Promise<{ success: boolean }> => {
    try {
        const images = getImages();
        images.coverImage = coverImage;
        const jsonData = JSON.stringify(images);
        localStorage.setItem(STORAGE_KEYS.IMAGES, jsonData);
        console.log('Cover image saved successfully, size:', jsonData.length, 'bytes');
        return { success: true };
    } catch (error) {
        console.error('Error saving cover image:', error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Image may be too large.');
        }
        return { success: false };
    }
};

export const saveProfileImage = async (profileImage: string | null): Promise<{ success: boolean }> => {
    try {
        const images = getImages();
        images.profileImage = profileImage;
        const jsonData = JSON.stringify(images);
        localStorage.setItem(STORAGE_KEYS.IMAGES, jsonData);
        console.log('Profile image saved successfully, size:', jsonData.length, 'bytes');
        return { success: true };
    } catch (error) {
        console.error('Error saving profile image:', error);
        // Check if it's a quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Image may be too large.');
        }
        return { success: false };
    }
};

// Settings Functions
export const getSettings = (): UserSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: UserSettings): Promise<{ success: boolean; message: string }> => {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return { success: true, message: 'Settings saved successfully!' };
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, message: 'Failed to save settings. Please try again.' };
    }
};

// Appearance Functions
export const getAppearance = (): UserAppearance => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.APPEARANCE);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading appearance:', error);
    }
    return DEFAULT_APPEARANCE;
};

export const saveAppearance = async (appearance: UserAppearance): Promise<{ success: boolean; message: string }> => {
    try {
        localStorage.setItem(STORAGE_KEYS.APPEARANCE, JSON.stringify(appearance));
        return { success: true, message: 'Appearance saved successfully!' };
    } catch (error) {
        console.error('Error saving appearance:', error);
        return { success: false, message: 'Failed to save appearance. Please try again.' };
    }
};

// Clear all user data
export const clearAllUserData = (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};
