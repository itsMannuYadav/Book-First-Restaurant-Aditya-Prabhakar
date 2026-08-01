interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-[family-name:var(--font-serif-display)] text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
        Coming in the next feature slice — scaffolding is ready.
      </div>
    </div>
  );
}
