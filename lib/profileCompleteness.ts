/**
 * Profile completeness utilities for user actions.
 * Defines minimum profile requirements for applying to opportunities and posting in feed.
 */

interface ProfileData {
  name?: string | null;
  baseProfile?: {
    phone?: string | null;
    city?: string | null;
    bio?: string | null;
  } | null;
  volunteerProfile?: {
    isAvailable?: boolean;
    availabilityDays?: string[];
    experience?: string | null;
    skills?: { id?: number; skill: string }[];
    preferences?: { id?: number; type: string; value: string }[];
  } | null;
}

/**
 * Check if user has filled minimum personal info required to POST in feed.
 * Required: name, phone, city, bio
 */
export function canPostToFeed(profile: ProfileData): boolean {
  return !!(
    profile?.name?.trim() &&
    profile?.baseProfile?.phone?.trim() &&
    profile?.baseProfile?.city?.trim() &&
    profile?.baseProfile?.bio?.trim()
  );
}

/**
 * Check if user has filled minimum volunteer info required to APPLY to opportunities.
 * Required: name, phone, city, bio, availabilityDays (at least 1), skills (at least 1)
 */
export function canApplyToOpportunity(profile: ProfileData): boolean {
  return !!(
    profile?.name?.trim() &&
    profile?.baseProfile?.phone?.trim() &&
    profile?.baseProfile?.city?.trim() &&
    profile?.baseProfile?.bio?.trim() &&
    profile?.volunteerProfile?.availabilityDays &&
    profile.volunteerProfile.availabilityDays.length > 0 &&
    profile?.volunteerProfile?.skills &&
    profile.volunteerProfile.skills.length > 0
  );
}

/**
 * Get a list of missing fields for display to the user.
 */
export function getMissingFields(profile: ProfileData, forAction: 'post' | 'apply'): string[] {
  const missing: string[] = [];

  if (!profile?.name?.trim()) missing.push('Full name');
  if (!profile?.baseProfile?.phone?.trim()) missing.push('Phone number');
  if (!profile?.baseProfile?.city?.trim()) missing.push('City');
  if (!profile?.baseProfile?.bio?.trim()) missing.push('Bio');

  if (forAction === 'apply') {
    if (!profile?.volunteerProfile?.availabilityDays || profile.volunteerProfile.availabilityDays.length === 0) {
      missing.push('Availability days (at least 1)');
    }
    if (!profile?.volunteerProfile?.skills || profile.volunteerProfile.skills.length === 0) {
      missing.push('Skills (at least 1)');
    }
  }

  return missing;
}
