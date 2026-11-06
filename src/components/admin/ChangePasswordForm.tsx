"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePassword, type ChangePasswordState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Update password"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState<ChangePasswordState, FormData>(changePassword, null);

  return (
    <form action={action} className="space-y-5 rounded-xl bg-panel p-6 shadow-card">
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required />
        <p className="mt-1 text-xs text-ink-soft">At least 10 characters; a long passphrase is best.</p>
      </div>
      <div>
        <Label htmlFor="confirm">Repeat new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-signal" : "text-sm text-sale"}>
          {state.message}
        </p>
      )}
      <Submit />
    </form>
  );
}
