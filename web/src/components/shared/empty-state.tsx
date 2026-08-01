interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[#14110e]/15 bg-white/50 px-6 py-14 text-center">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#14110e]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#7a7164]">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
