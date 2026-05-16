import Link from "next/link";
import type { NotableSculptor } from "@/lib/types";
import { formatDisplayValue } from "@/lib/utils";

interface Props {
  sculptor: NotableSculptor;
  /** When true, hide the movement pill (already implied by context, e.g.
   *  on a /movement/[slug] page where every card is the same movement). */
  hideMovement?: boolean;
}

/**
 * NotableSculptorCard — used by /decade/[year] and /movement/[slug].
 *
 * Reuses the visual language Evolution's focus-sculptor grid established
 * (bg-bg-secondary tile, hover→accent-muted, name → accent-primary on
 * hover) so the three pages feel like one design system, not three.
 */
export function NotableSculptorCard({ sculptor, hideMovement = false }: Props) {
  return (
    <Link
      href={`/explore/${sculptor.qid}`}
      className="block rounded-md bg-bg-secondary p-4 hover:bg-accent-muted transition-colors cursor-pointer group"
    >
      <h3 className="font-medium text-sm text-text-primary group-hover:text-accent-primary transition-colors leading-tight">
        {sculptor.name}
      </h3>
      <p className="text-xs text-text-secondary mt-0.5 tabular-nums">
        {sculptor.birthYear ?? "?"}
        {sculptor.deathYear ? ` – ${sculptor.deathYear}` : sculptor.birthYear ? " – present" : ""}
      </p>
      {!hideMovement && sculptor.movement && (
        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-sm bg-accent-muted text-accent-primary">
          {formatDisplayValue(sculptor.movement, { isMovement: true })}
        </span>
      )}
      {sculptor.citizenship && (
        <p className="text-xs text-text-tertiary mt-1">
          {formatDisplayValue(sculptor.citizenship, { isName: true })}
        </p>
      )}
      {sculptor.totalDegree > 0 && (
        <p className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary mt-2">
          {sculptor.totalDegree} lineage connection
          {sculptor.totalDegree === 1 ? "" : "s"}
        </p>
      )}
    </Link>
  );
}
