import type { Metadata } from "next";

import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { getAvatarPresetCategories } from "@/lib/avatars/presets";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { signOut } from "@/services/auth-actions";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requirePageUser();
  const profile = await getUserProfile(user);
  const presetCategories = getAvatarPresetCategories();

  const provider =
    user.app_metadata?.provider === "google"
      ? "Google"
      : user.app_metadata?.provider === "apple"
        ? "Apple"
        : user.app_metadata?.provider === "email"
          ? "Email"
          : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account settings and personal details.
        </p>
      </header>

      <ProfileAvatarEditor
        userId={user.id}
        avatarUrl={profile.avatarUrl}
        displayName={profile.fullName}
        email={profile.email}
        presetCategories={presetCategories}
      />

      <ProfileForm profile={profile} />

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Account</p>
        <p className="mt-1 text-sm font-medium">{profile.email}</p>
        {provider && (
          <p className="mt-2 text-xs text-muted-foreground">Signed in via {provider}</p>
        )}
      </section>

      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-12 w-full text-base">
          Sign out
        </Button>
      </form>
    </main>
  );
}
