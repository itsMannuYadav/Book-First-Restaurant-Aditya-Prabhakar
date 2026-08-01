interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium tracking-wide text-[#8a8173] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-3xl font-bold tracking-tight text-[#14110e] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[#7a7164]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
