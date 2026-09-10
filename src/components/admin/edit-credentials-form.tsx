"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  updateUserEmailAsAdmin,
  setUserPasswordAsAdmin,
  type ActionState,
} from "@/lib/actions/admin";

function EmailForm({ targetUserId, currentEmail }: { targetUserId: string; currentEmail: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [email, setEmail] = React.useState(currentEmail);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const updateForThisUser = updateUserEmailAsAdmin.bind(null, targetUserId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateForThisUser,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2"
      onSubmit={(e) => {
        if (!confirmOpen) e.preventDefault();
      }}
    >
      <Label htmlFor="admin-email">Login email</Label>
      <div className="flex gap-2">
        <Input
          id="admin-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !email || email === currentEmail}
          onClick={() => setConfirmOpen(true)}
        >
          {isPending && <Loader2 className="animate-spin" />}
          Update email
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change this user's login email?"
        description={`This immediately changes what email they sign in with, marked as confirmed — no verification link is sent. New email: ${email}`}
        confirmLabel="Change email"
        isPending={isPending}
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setConfirmOpen(false);
        }}
      />
    </form>
  );
}

function PasswordForm({ targetUserId }: { targetUserId: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [password, setPassword] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const setForThisUser = setUserPasswordAsAdmin.bind(null, targetUserId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(setForThisUser, {});

  // Clear the field the moment a successful submission's state lands —
  // adjusted during render (not an effect) so it can't race the toast below.
  const [prevState, setPrevState] = React.useState(state);
  if (prevState !== state) {
    setPrevState(state);
    if (state.success) setPassword("");
  }

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2"
      onSubmit={(e) => {
        if (!confirmOpen) e.preventDefault();
      }}
    >
      <Label htmlFor="admin-password">Set new password</Label>
      <div className="flex gap-2">
        <Input
          id="admin-password"
          name="password"
          type="password"
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || password.length < 8}
          onClick={() => setConfirmOpen(true)}
        >
          {isPending && <Loader2 className="animate-spin" />}
          Set password
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Set a new password for this user?"
        description="They will need to use this new password on their next sign-in. Make sure you share it with them through a secure channel."
        confirmLabel="Set password"
        isPending={isPending}
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setConfirmOpen(false);
        }}
      />
    </form>
  );
}

export function EditCredentialsForm({
  targetUserId,
  currentEmail,
}: {
  targetUserId: string;
  currentEmail: string;
}) {
  return (
    <Card className="border-warning/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4" /> Login credentials
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Changes here take effect immediately, without notifying the user first — use with care.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <EmailForm targetUserId={targetUserId} currentEmail={currentEmail} />
        <PasswordForm targetUserId={targetUserId} />
      </CardContent>
    </Card>
  );
}
