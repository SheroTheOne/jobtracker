import { parseStringList } from "@/lib/validation/string-list";

/** Visar hur fritexten tolkas som lista – direkt feedback utan en separat tagg-komponent. */
export function StringListPreview({ value }: { value: string }) {
  const items = parseStringList(value);
  if (items.length === 0) return null;

  return (
    <ul aria-label="Tolkade poster" className="flex flex-wrap gap-1">
      {items.map((item) => (
        <li key={item} className="bg-muted rounded-md px-2 py-0.5 text-xs">
          {item}
        </li>
      ))}
    </ul>
  );
}
