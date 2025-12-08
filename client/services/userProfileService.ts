export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  goal: string;
  feeling: string;
  interests: string[];
}

// In-memory storage for now, mirroring chatStorage pattern
const PROFILE_KEY = 'nova_user_profile';

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const deleteUserProfile = (): void => {
  localStorage.removeItem(PROFILE_KEY);
};
