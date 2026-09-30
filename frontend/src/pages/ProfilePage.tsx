import UserProfile from "@/components/profile/UserProfile";

/**
 * /profile routes to the profile screen. The old file here was the broken
 * Supabase CV-profile (missing types, undefined `profile` from useAuth, no
 * toast import) — the backend-backed component lives in components/profile.
 */
export { UserProfile };
export default UserProfile;
