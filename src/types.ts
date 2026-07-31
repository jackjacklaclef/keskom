/**
 * User — profil utilisateur côté front.
 * Toujours sans mot de passe. Swappable avec un profil Supabase.
 */
export type AppUser = {
  id: string;
  name: string;
  email: string;
  activeFamilyId: string | null;
  consentGeneral?: boolean;
  consentSensitive?: boolean;
  consentDate?: string;
  preferences?: any[];
  allergies?: any[];
  dislikes?: any[];
  diets?: string[];
  rules?: any[];
};

export type AuthResult = { user: AppUser | null; error: string | null };

export type AuthChangeCallback = (user: AppUser | null) => void;
