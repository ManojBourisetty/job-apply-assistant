import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("job_profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium">{user?.email}</p>
        </CardContent>
      </Card>

      <ProfileForm profile={profile} />
    </div>
  );
}
