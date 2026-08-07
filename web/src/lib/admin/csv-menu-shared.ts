import { z } from "zod";

export const CSV_MENU_HEADERS = [
  "category",
  "name",
  "description",
  "price",
  "tags",
  "badge",
  "isAvailable",
  "sortOrder",
] as const;

export const CSV_MENU_TEMPLATE = `${CSV_MENU_HEADERS.join(",")}
Starters,Tomato Soup,Creamy roast tomato,180,veg,Chef pick,true,0
Mains,Butter Chicken,Classic makhani,420,non-veg,,true,1
Mains,Paneer Tikka Masala,Smoky paneer gravy,380,veg;gf,,true,2
`;

const csvRowSchema = z.object({
  category: z.string().min(1, "category is required"),
  name: z.string().min(1, "name is required"),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "price must be 0 or more"),
  tags: z.string().optional().default(""),
  badge: z.string().optional().default(""),
  isAvailable: z.string().optional().default("true"),
  sortOrder: z.string().optional().default(""),
});

export type CsvMenuRow = z.infer<typeof csvRowSchema> & {
  rowNumber: number;
  tagList: string[];
  available: boolean;
  sort?: number;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function escapeCsv(value: string | number | boolean): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function parseMenuCsv(text: string): {
  rows: CsvMenuRow[];
  errors: Array<{ rowNumber: number; message: string }>;
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, message: "CSV is empty." }] };
  }

  const headerCells = parseCsvLine(lines[0]!).map((h) =>
    h.trim().toLowerCase(),
  );
  const index = Object.fromEntries(
    CSV_MENU_HEADERS.map((key) => [key, headerCells.indexOf(key.toLowerCase())]),
  ) as Record<(typeof CSV_MENU_HEADERS)[number], number>;

  if (index.category < 0 || index.name < 0 || index.price < 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message:
            "CSV header must include at least: category,name,price (see template).",
        },
      ],
    };
  }

  const rows: CsvMenuRow[] = [];
  const errors: Array<{ rowNumber: number; message: string }> = [];

  for (let i = 1; i < lines.length; i += 1) {
    const rowNumber = i + 1;
    const cells = parseCsvLine(lines[i]!);
    const raw = {
      category: cells[index.category] ?? "",
      name: cells[index.name] ?? "",
      description: index.description >= 0 ? (cells[index.description] ?? "") : "",
      price: index.price >= 0 ? (cells[index.price] ?? "") : "",
      tags: index.tags >= 0 ? (cells[index.tags] ?? "") : "",
      badge: index.badge >= 0 ? (cells[index.badge] ?? "") : "",
      isAvailable:
        index.isAvailable >= 0 ? (cells[index.isAvailable] ?? "true") : "true",
      sortOrder: index.sortOrder >= 0 ? (cells[index.sortOrder] ?? "") : "",
    };

    const parsed = csvRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        rowNumber,
        message: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    const availableRaw = parsed.data.isAvailable.trim().toLowerCase();
    const available =
      availableRaw === "" ||
      availableRaw === "true" ||
      availableRaw === "1" ||
      availableRaw === "yes" ||
      availableRaw === "y";

    const tagList = parsed.data.tags
      .split(/[|;,]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const sort =
      parsed.data.sortOrder.trim() === ""
        ? undefined
        : Number(parsed.data.sortOrder);
    if (sort !== undefined && !Number.isFinite(sort)) {
      errors.push({ rowNumber, message: "sortOrder must be a number" });
      continue;
    }

    rows.push({
      ...parsed.data,
      rowNumber,
      tagList,
      available,
      sort,
    });
  }

  return { rows, errors };
}

export function buildMenuCsv(
  categories: Array<{ id: string; name: string }>,
  items: Array<{
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    tags: string[];
    badge?: string;
    isAvailable: boolean;
    sortOrder: number;
  }>,
): string {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const lines = [CSV_MENU_HEADERS.join(",")];
  for (const item of items) {
    lines.push(
      [
        escapeCsv(nameById.get(item.categoryId) ?? ""),
        escapeCsv(item.name),
        escapeCsv(item.description ?? ""),
        escapeCsv(item.price),
        escapeCsv(item.tags.join(";")),
        escapeCsv(item.badge ?? ""),
        escapeCsv(item.isAvailable),
        escapeCsv(item.sortOrder),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
