import { useState } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { hasLlmKey, saveLlmKey } from "@/features/imports/llm";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { GhostButton, PageHeader, PrimaryButton, Surface } from "@/shared/ui/chrome";

export function SettingsPage() {
  const { email, displayName, ledgers, ledger, switchLedger } = useSession();
  const { theme, themes, setTheme } = useTheme();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(hasLlmKey());

  return (
    <div className="space-y-6">
      <PageHeader kicker="Account" title="Settings" description="Theme, ledger, and optional LLM key for this browser." />

      <Surface className="text-sm">
        <h2 className="text-sm font-semibold">Profile</h2>
        <p className="mt-3 text-base font-medium text-ll-text">{displayName}</p>
        <p className="mt-1 text-ll-muted">{email}</p>
        <p className="mt-2 text-xs text-ll-muted">Signed in with Google via Supabase.</p>
      </Surface>

      <Surface>
        <h2 className="text-sm font-semibold">Theme</h2>
        <p className="mt-1 text-xs text-ll-muted">
          Builtin light/dark now. Remote packs from the backend can appear in this list later.
        </p>
        <select
          value={theme.id}
          onChange={(e) => void setTheme(e.target.value)}
          className="mt-4 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.source === "remote" ? " (remote)" : ""}
            </option>
          ))}
        </select>
      </Surface>

      {ledgers.length > 1 ? (
        <Surface>
          <h2 className="text-sm font-semibold">Active ledger</h2>
          <select
            value={ledger.id}
            onChange={(e) => void switchLedger(e.target.value)}
            className="mt-3 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.kind})
              </option>
            ))}
          </select>
        </Surface>
      ) : null}

      <Surface>
        <h2 className="text-sm font-semibold">LLM (BYOK)</h2>
        <p className="mt-1 text-xs text-ll-muted">
          Stored only in this browser. Used for statement fallback extract, month review, and category icons.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={saved ? "Key saved — paste to replace" : "sk-…"}
          className="mt-4 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
        />
        <div className="mt-3 flex gap-2">
          <PrimaryButton
            onClick={() => {
              saveLlmKey(key);
              setSaved(hasLlmKey());
              setKey("");
            }}
          >
            Save key
          </PrimaryButton>
          <GhostButton
            onClick={() => {
              saveLlmKey("");
              setSaved(false);
            }}
          >
            Clear
          </GhostButton>
        </div>
      </Surface>
    </div>
  );
}
