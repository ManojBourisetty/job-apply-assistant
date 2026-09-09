import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteRecruiterButton } from "@/components/recruiters/delete-recruiter-button";
import { statusLabel } from "@/lib/format";

export default async function RecruitersPage() {
  const supabase = await createClient();
  const { data: recruiters } = await supabase
    .from("recruiters")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Recruiter Contacts"
        description="Track recruiters you've connected with across your search."
        actions={
          <Button asChild>
            <Link href="/recruiters/new">
              <Plus /> Add recruiter
            </Link>
          </Button>
        }
      />

      {recruiters && recruiters.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last contact</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruiters.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/recruiters/${r.id}/edit`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
                  </TableCell>
                  <TableCell>{r.company_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusLabel(r.status)}</Badge>
                  </TableCell>
                  <TableCell>{r.last_contact_date || "—"}</TableCell>
                  <TableCell>
                    <DeleteRecruiterButton recruiterId={r.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No recruiter contacts yet"
          description="Add recruiters as you connect with them to keep track of your relationship."
          action={
            <Button asChild size="sm">
              <Link href="/recruiters/new">Add a recruiter</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
