import type { Bill } from "@/types";

/** jsPDF's built-in fonts are Latin-1 only — swap non-ASCII currency symbols (₹). */
function money(currency: string, n: number): string {
  const sym = /^[\x20-\x7E]*$/.test(currency || "") ? currency || "" : "Rs ";
  return `${sym}${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

async function fetchDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Build and download a one-page A4 tax invoice for a bill. */
export async function generateInvoicePdf(bill: Bill): Promise<void> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const right = pageW - M;
  const snap = bill.restaurantSnapshot;
  const currency = bill.currency || "₹";
  const ink: [number, number, number] = [20, 17, 14];
  const muted: [number, number, number] = [90, 85, 74];

  let headerBottom = M + 55;

  // Logo (best-effort embed)
  let textX = M;
  if (snap.logoUrl) {
    const dataUrl = await fetchDataUrl(snap.logoUrl);
    if (dataUrl) {
      try {
        doc.addImage(
          dataUrl,
          dataUrl.includes("image/png") ? "PNG" : "JPEG",
          M,
          M,
          48,
          48,
        );
        textX = M + 60;
        headerBottom = Math.max(headerBottom, M + 48);
      } catch {
        /* fall back to no logo */
      }
    }
  }

  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...ink);
  doc.text(snap.name || "Restaurant", textX, M + 14);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted);
  let ly = M + 30;
  for (const line of [
    snap.address,
    snap.phone,
    snap.gstin ? `GSTIN: ${snap.gstin}` : "",
  ].filter(Boolean)) {
    doc.text(String(line), textX, ly);
    ly += 12;
  }
  headerBottom = Math.max(headerBottom, ly);

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...ink);
  doc.text("TAX INVOICE", right, M + 12, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted);
  doc.text(bill.billLabel || "Draft", right, M + 27, { align: "right" });
  doc.text(
    new Date(bill.finalizedAt || bill.createdAt).toLocaleDateString(),
    right,
    M + 39,
    { align: "right" },
  );
  if (bill.status !== "finalized") {
    doc.text(bill.status.toUpperCase(), right, M + 51, { align: "right" });
  }

  let y = headerBottom + 16;
  doc.setDrawColor(...ink).setLineWidth(1).line(M, y, right, y);
  y += 20;

  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(138, 129, 115);
  doc.text("BILLED TO", M, y);
  y += 14;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...ink);
  doc.text(bill.customerName || "Walk-in customer", M, y);
  y += 12;
  for (const line of [
    bill.customerPhone,
    bill.customerGstin ? `GSTIN: ${bill.customerGstin}` : "",
  ].filter(Boolean)) {
    doc.setFontSize(9).setTextColor(...muted).text(String(line), M, y);
    y += 11;
  }
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Unit", "Amount"]],
    body: bill.lineItems.map((li) => [
      li.name,
      String(li.quantity),
      money(currency, li.unitPrice),
      money(currency, li.amount),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: ink,
      lineColor: [220, 215, 205],
      lineWidth: 0.5,
      cellPadding: 6,
    },
    headStyles: {
      fontStyle: "bold",
      fillColor: [243, 239, 231],
      textColor: ink,
    },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 90 },
    },
    margin: { left: M, right: M },
  });

  const afterTable =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40;
  let ty = afterTable + 20;

  const rows: Array<[string, string]> = [
    ["Subtotal", money(currency, bill.subtotal)],
  ];
  if (bill.discount.amount > 0) {
    rows.push([
      `Discount${bill.discount.type === "percent" ? ` (${bill.discount.value}%)` : ""}`,
      `-${money(currency, bill.discount.amount)}`,
    ]);
  }
  const half = (bill.tax.rate / 2).toFixed(2);
  rows.push([`CGST @ ${half}%`, money(currency, bill.tax.cgstAmount)]);
  rows.push([`SGST @ ${half}%`, money(currency, bill.tax.sgstAmount)]);

  const labelX = right - 190;
  doc.setFontSize(9);
  for (const [label, val] of rows) {
    doc.setFont("helvetica", "normal").setTextColor(...muted).text(label, labelX, ty);
    doc.setTextColor(...ink).text(val, right, ty, { align: "right" });
    ty += 14;
  }
  ty += 6;
  doc.setFillColor(...ink).rect(labelX - 10, ty - 12, right - labelX + 10, 22, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(244, 239, 230);
  doc.text("Total", labelX, ty + 3);
  doc.text(money(currency, bill.total), right - 6, ty + 3, { align: "right" });
  ty += 34;

  if (bill.notes) {
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted);
    const wrapped = doc.splitTextToSize(bill.notes, right - M) as string[];
    doc.text(wrapped, M, ty);
  }

  doc.setFontSize(8).setTextColor(138, 129, 115);
  doc.text("Thank you for your visit.", pageW / 2, pageH - 40, {
    align: "center",
  });

  const file = `${(bill.billLabel || "bill").replace(/[^\w.-]+/g, "-")}.pdf`;
  doc.save(file);
}
