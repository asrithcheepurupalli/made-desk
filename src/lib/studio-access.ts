import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/env";

export interface StudioUser {
  id: string;
  email: string;
  name?: string | null;
  allowed: boolean;
}

export async function getStudioUser(): Promise<StudioUser | null> {
  if (!hasClerk()) {
    // Zero-config developer mode
    return {
      id: "dev-user-001",
      email: "loksaiasrith123@gmail.com",
      name: "made. founder",
      allowed: true,
    };
  }

  try {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress || "";
    const allowedEmails = (process.env.STUDIO_ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // If no allowlist is configured, any authenticated user can enter (single tenant studio setup)
    const allowed = allowedEmails.length === 0 || allowedEmails.includes(email.toLowerCase());

    return {
      id: user.id,
      email,
      name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null,
      allowed,
    };
  } catch (error) {
    console.error("Studio user check error:", error);
    return null;
  }
}

export async function requireStudioAccess(): Promise<StudioUser> {
  const user = await getStudioUser();
  if (!user || !user.allowed) {
    redirect("/sign-in");
  }
  return user;
}
