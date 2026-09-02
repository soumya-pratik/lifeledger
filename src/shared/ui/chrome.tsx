import type { ButtonHTMLAttributes, FormEventHandler, HTMLAttributes, ReactNode } from "react";

export function Surface({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "form" | "article";
  onSubmit?: FormEventHandler<HTMLFormElement>;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)] ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ll-accent">{kicker}</p>
        ) : null}
        <h1 className={`text-2xl font-semibold tracking-tight ${kicker ? "mt-1" : ""}`}>{title}</h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-ll-muted">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

const btnBase =
  "inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-40";

export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={props.type ?? "button"}
      className={`${btnBase} bg-ll-accent text-ll-accent-fg ${className}`}
      {...props}
    />
  );
}

export function GhostButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={props.type ?? "button"}
      className={`${btnBase} border border-ll-border bg-ll-surface text-ll-text hover:bg-ll-bg ${className}`}
      {...props}
    />
  );
}
