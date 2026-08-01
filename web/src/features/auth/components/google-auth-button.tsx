"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleAuthButtonProps {
  pending?: boolean;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
}

export function GoogleAuthButton({
  pending = false,
  disabled = false,
  label = "Continue with Google",
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-10 w-full gap-2 text-sm",
      )}
    >
      <GoogleGlyph />
      {pending ? "Connecting…" : label}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.8S6.8 21.3 12 21.3c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.6l3.2 2.4C7.9 7.7 9.8 6.4 12 6.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 8.3 2.2 5.1 4.3 3.9 7.6z"
      />
      <path
        fill="#4A90E2"
        d="M12 21.3c2.6 0 4.8-.9 6.4-2.3l-3-2.5c-.8.6-1.9 1-3.4 1-3.1 0-5.7-2-6.6-4.8l-3.2 2.5C4 19 7.7 21.3 12 21.3z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 12.8c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7L2.2 6.9C1.6 8.2 1.3 9.7 1.3 11.1s.3 2.9.9 4.2l3.2-2.5z"
      />
    </svg>
  );
}
