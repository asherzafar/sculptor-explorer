"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { LegacySculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";

/** Single data-completeness dot with tooltip. */
function CompletenessDot({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${present ? "present" : "missing"}`}
      className={`inline-block w-1.5 h-1.5 rounded-full ${
        present
          ? "bg-text-tertiary"
          : "border border-text-tertiary bg-transparent"
      }`}
      aria-label={`${label}: ${present ? "present" : "missing"}`}
    />
  );
}

export function SculptorDetail({ qid }: { qid: string }) {
  const router = useRouter();
  const [sculptor, setSculptor] = useState<LegacySculptor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sculptors = await loadSculptors();
        const found = sculptors.find((s) => s.qid === qid);
        setSculptor(found || null);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [qid]);

  // Back navigation: use router.back() when there's history (preserves explore state).
  // Falls back to /explore if user deep-linked (no history).
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/explore");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!sculptor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Sculptor not found</h1>
        <Link href="/explore" className="text-accent-primary hover:underline">
          ← Back to explore
        </Link>
      </div>
    );
  }

  const lifespanLine =
    sculptor.birthYear && sculptor.deathYear
      ? `${sculptor.birthYear} – ${sculptor.deathYear}`
      : sculptor.birthYear && sculptor.alive
        ? `${sculptor.birthYear} – present`
        : sculptor.birthYear
          ? `${sculptor.birthYear}`
          : "Unknown";

  const movementLabel = formatDisplayValue(sculptor.movement, { isMovement: true });
  const hasMovement = !!sculptor.movement && movementLabel !== "—";
  const hasCitizenship = !!sculptor.citizenship;
  const hasEdges = sculptor.totalDegree > 0;
  const hasGender = !!sculptor.gender;

  const citizenshipLabel = hasCitizenship
    ? formatDisplayValue(sculptor.citizenship, { isName: true })
    : null;
  const genderLabel = hasGender ? formatGender(sculptor.gender) : null;
  const metaParts = [citizenshipLabel, genderLabel].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to explore
      </button>

      <div className="mt-8 max-w-2xl group relative">
        {/* Wikidata link — top-right, only visible on hover */}
        <a
          href={`https://www.wikidata.org/wiki/${sculptor.qid}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Wikidata"
          className="absolute top-1 right-0 inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Wikidata
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Name (Fraunces display) */}
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          {sculptor.name}
        </h1>

        {/* Lifespan line */}
        <p className="text-sm text-text-secondary mb-4">{lifespanLine}</p>

        {/* Movement pill — only if present */}
        {hasMovement && (
          <span className="inline-block rounded-full bg-accent-muted text-accent-primary text-xs font-medium px-3 py-1 mb-4">
            {movementLabel}
          </span>
        )}

        {/* Citizenship · gender inline */}
        {metaParts.length > 0 && (
          <p className="text-sm text-text-secondary mb-3">
            {metaParts.join(" · ")}
          </p>
        )}

        {/* Connections — only if > 0 */}
        {hasEdges && (
          <p className="text-sm text-text-secondary mb-4">
            {sculptor.totalDegree} connection{sculptor.totalDegree === 1 ? "" : "s"}
            {" "}
            <span className="text-text-tertiary">
              ({sculptor.inDegree} in, {sculptor.outDegree} out)
            </span>
          </p>
        )}

        {/* Data completeness dots */}
        <div className="flex items-center gap-1.5 mt-6" aria-label="Data completeness">
          <CompletenessDot present={hasMovement} label="Movement" />
          <CompletenessDot present={hasCitizenship} label="Citizenship" />
          <CompletenessDot present={hasEdges} label="Connections" />
          <span className="ml-2 text-xs text-text-tertiary">Data completeness</span>
        </div>
      </div>
    </div>
  );
}
