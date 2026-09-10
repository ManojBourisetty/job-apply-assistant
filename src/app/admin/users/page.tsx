import Link from "next/link";
import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleAdminButton } from "@/components/admin/toggle-admin-button";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("job_profiles")
    .select("id, email, username, full_name, is_admin, created_at, terms_accepted_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every account on the platform. Admins have full read access to all data."
      />

      {users && users.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Signed up</TableHead>
                <TableHead>Terms accepted</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                      {u.full_name || "—"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>{u.username ? `@${u.username}` : "—"}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {u.terms_accepted_at ? (
                      <Badge variant="outline" className="text-xs">
                        {new Date(u.terms_accepted_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not recorded</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_admin ? (
                      <Badge variant="secondary">Admin</Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ToggleAdminButton
                      userId={u.id}
                      isAdmin={u.is_admin}
                      isSelf={u.id === currentUser?.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users yet" description="Signups will appear here." />
      )}
    </div>
  );
}
