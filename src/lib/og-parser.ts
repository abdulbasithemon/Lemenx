/**
 * Parses the "OG Report" column, e.g. "Total order - 2, Delivered - 2, Returned - 0",
 * into three numeric fields. Tolerant of spacing, casing and separator variations.
 */
export function parseOgReport(raw: string | null | undefined): {
  totalOrders: number;
  delivered: number;
  returned: number;
} {
  const result = { totalOrders: 0, delivered: 0, returned: 0 };
  if (!raw) return result;
  const text = String(raw).toLowerCase();

  const grab = (patterns: RegExp[]): number => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return parseInt(m[1], 10) || 0;
    }
    return 0;
  };

  result.totalOrders = grab([/total\s*orders?\s*[-:=]?\s*(\d+)/]);
  result.delivered = grab([/delivered\s*[-:=]?\s*(\d+)/]);
  result.returned = grab([/returned?\s*[-:=]?\s*(\d+)/]);
  return result;
}
