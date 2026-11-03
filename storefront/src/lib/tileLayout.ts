// Układ kafelków na siatce 12 kolumn. Ostatni rząd nigdy nie zostaje jedną wąską kratką.

export type TileStyle = "rowne" | "pierwsze" | "szerokie";

const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
  12: "lg:col-span-12",
};

function evenSpans(count: number, cols: 3 | 4): number[] {
  const base = 12 / cols;
  const spans = Array<number>(count).fill(base);
  const rem = count % cols;
  if (rem === 1 && count > 1) {
    const tail = Math.min(count, cols + 1);
    const top = Math.ceil(tail / 2);
    const bot = tail - top;
    for (let i = count - tail; i < count - bot; i++) spans[i] = 12 / top;
    for (let i = count - bot; i < count; i++) spans[i] = 12 / bot;
  } else if (rem > 0) {
    const span = 12 / rem;
    for (let i = count - rem; i < count; i++) spans[i] = span;
  }
  return spans;
}

export function tileClasses(count: number, style: TileStyle, columns: 3 | 4): string[] {
  if (count <= 0) return [];
  if (style === "szerokie") {
    return Array.from({ length: count }, (_, i) =>
      count % 2 === 1 && i === count - 1
        ? "col-span-2 min-h-[200px] lg:col-span-12 lg:min-h-[250px]"
        : "col-span-2 min-h-[180px] sm:col-span-1 lg:col-span-6 lg:min-h-[230px]",
    );
  }
  if (style === "pierwsze" && count > 3) {
    const big = 3;
    const rest = evenSpans(count - big, 4);
    return [
      ...Array.from({ length: big }, () => "col-span-2 min-h-[180px] sm:col-span-2 lg:col-span-4 lg:min-h-[250px]"),
      ...rest.map((span) => `min-h-[160px] sm:min-h-[180px] ${SPAN[span] ?? "lg:col-span-3"} lg:min-h-[200px]`),
    ];
  }
  const spans = evenSpans(count, columns);
  return spans.map((span) => `min-h-[170px] sm:min-h-[190px] ${SPAN[span] ?? "lg:col-span-3"} lg:min-h-[210px]`);
}
