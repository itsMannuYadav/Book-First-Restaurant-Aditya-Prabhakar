"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /restaurants/{id} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    match /categories/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /menuItems/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

interface PublicMenuErrorProps {
  message: string;
}

export function PublicMenuError({ message }: PublicMenuErrorProps) {
  const [copied, setCopied] = useState(false);
  const isPermission = message.toLowerCase().includes("permission");

  async function copyRules() {
    await navigator.clipboard.writeText(RULES_SNIPPET);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 py-10 text-center">
      <div className="max-w-lg space-y-3">
        <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
          Menu unavailable
        </h1>
        <p className="text-sm leading-relaxed text-[#6b6458]">{message}</p>
      </div>

      {isPermission ? (
        <div className="w-full max-w-xl rounded-3xl border border-[#14110e]/10 bg-[#f6f1e8] p-5 text-left shadow-sm">
          <p className="text-sm font-semibold text-[#14110e]">
            Fix in 1 minute (project: my-book-menu-first)
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#5c554a]">
            <li>
              Open Firebase Console → <strong>Firestore Database → Rules</strong>
            </li>
            <li>Delete the old rules and paste the snippet below</li>
            <li>
              Click <strong>Publish</strong>, wait ~30 seconds, refresh this page
            </li>
          </ol>

          <pre className="mt-4 max-h-56 overflow-auto rounded-2xl bg-[#14110e] p-4 text-left text-[11px] leading-relaxed text-[#f4efe6]">
            {RULES_SNIPPET}
          </pre>

          <button
            type="button"
            onClick={() => void copyRules()}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
          >
            {copied ? "Copied!" : "Copy rules"}
          </button>
        </div>
      ) : null}

      <Link
        href={ROUTES.home}
        className="text-sm font-medium text-[#14110e] underline-offset-4 hover:underline"
      >
        Back to BookFirst
      </Link>
    </div>
  );
}
