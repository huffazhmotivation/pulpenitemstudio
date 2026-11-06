"use client";

import { useRef, useState, type FormEvent } from "react";
import { changePassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    setPending(true);
    setResult(null);
    try {
      const res = await changePassword(data);
      setResult(res);
      if (res.ok) formRef.current?.reset();
    } catch {
      setResult({ ok: false, message: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-xl bg-panel p-6 shadow-card">
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
      {result && (
        <p role="status" className={result.ok ? "text-sm text-signal" : "text-sm text-sale"}>
          {result.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
