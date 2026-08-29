import { signIn } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-credentials": "Incorrect email or password.",
  "not-authorized": "This account doesn't have admin access.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="eyebrow-accent mb-3">
          Pulpenitem Studio
        </p>
        <h1 className="mb-8 font-display text-3xl text-ink">Admin sign in</h1>

        {params.error && (
          <p className="mb-6 border border-signal/40 bg-signal/5 px-3 py-2 text-sm text-signal">
            {ERROR_MESSAGES[params.error] ?? "Something went wrong. Try again."}
          </p>
        )}

        <form action={signIn} className="space-y-5">
          <input type="hidden" name="next" value={params.next ?? "/admin"} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-8 text-xs text-ink-soft">
          Admin accounts are created in the Supabase dashboard — see the README for setup.
        </p>
      </div>
    </div>
  );
}
