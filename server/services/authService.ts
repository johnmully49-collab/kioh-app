import { UserProfile, UserRole } from "@/server/types";

// Simulated user database (replace with Prisma/Supabase later)
const mockUsers: Map<string, UserProfile & { passwordHash?: string }> = new Map();

export async function registerWithEmail(data: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<UserProfile> {
  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    fullName: data.fullName,
    email: data.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.fullName)}`,
    role: data.role || "participant",
    isEmailVerified: false, // Requires email verification link
    createdAt: new Date(),
  };

  mockUsers.set(data.email, { ...newUser, passwordHash: data.password });
  return newUser;
}

export async function verifyEmailToken(email: string): Promise<boolean> {
  const user = mockUsers.get(email);
  if (user) {
    user.isEmailVerified = true;
    mockUsers.set(email, user);
    return true;
  }
  return false;
}

export async function initiatePasswordReset(email: string): Promise<boolean> {
  // Simulates generating a reset token and sending a reset email
  return true;
}

export async function updateProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile | null> {
  // Find and update user profile
  for (const [email, user] of mockUsers.entries()) {
    if (user.id === userId) {
      const updated = { ...user, ...profileData };
      mockUsers.set(email, updated);
      return updated;
    }
  }
  return null;
}