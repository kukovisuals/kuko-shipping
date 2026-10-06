import { LOOKS, type Look } from "@/ui/theme";

const LABEL: Record<Look, string> = { dark: "Dark", light: "Light" };

/** Dark / Light switch for the whole page: same map and panels, different colours. */
export function LookToggle({ look, onLook }: { look: Look; onLook: (look: Look) => void }) {
  return (
    <div role="radiogroup" aria-label="Map look" className="ui-label flex shrink-0 rounded-lg border border-line p-0.5">
      {LOOKS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={look === l}
          onClick={() => onLook(l)}
          className={`rounded-md px-2 py-0.5 ${look === l ? "bg-accent text-surface" : "hover:text-ink"}`}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
