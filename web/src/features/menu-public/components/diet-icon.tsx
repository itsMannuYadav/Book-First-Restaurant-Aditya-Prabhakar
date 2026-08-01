import { cn } from "@/lib/utils";

interface DietIconProps {
  type: "veg" | "non-veg";
  className?: string;
}

export function DietIcon({ type, className }: DietIconProps) {
  const isVeg = type === "veg";

  return (
    <span
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] p-0.5",
        isVeg ? "border-[var(--menu-veg)]" : "border-[var(--menu-nonveg)]",
        className,
      )}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      {isVeg ? (
        <span className="size-1.5 rounded-full bg-[var(--menu-veg)]" />
      ) : (
        <span
          className="size-0 border-x-4 border-b-[6px] border-x-transparent border-b-[var(--menu-nonveg)]"
          aria-hidden
        />
      )}
    </span>
  );
}
