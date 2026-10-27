import { useId } from "react";

import { cn } from "@/lib/utils";

// FlexoraCMS brand mark: a slanted "F" ribbon in the blue → violet brand
// gradient. Shared by the admin shell, auth screens and the app icon
// (src/app/icon.svg mirrors these paths).

export function FlexoraMark({ className }: { className?: string }) {
  const id = useId();
  const stem = `${id}-stem`;
  const arm = `${id}-arm`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id={stem} x1="6" y1="30" x2="28" y2="3">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={arm} x1="15" y1="21" x2="25" y2="13">
          <stop offset="0" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path
        d="M8 6.5 27.5 3 24 10.2 15.2 11.6V27.6L8 30.5Z"
        fill={`url(#${stem})`}
      />
      <path
        d="M15.2 15.4 24.6 13.8 21.3 20.4 15.2 21.4Z"
        fill={`url(#${arm})`}
      />
    </svg>
  );
}

export function FlexoraLogo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <FlexoraMark className={markClassName} />
      {showWordmark ? (
        <span className="text-lg font-bold tracking-tight">
          <span className="text-foreground">Flexora</span>
          <span className="bg-gradient-to-r from-[#3B82F6] to-[#A855F7] bg-clip-text text-transparent">
            CMS
          </span>
        </span>
      ) : null}
      <span className="sr-only">FlexoraCMS</span>
    </span>
  );
}
