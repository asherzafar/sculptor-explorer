"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DecadeAggregation, LegacySculptor } from "@/lib/types";
import { MousePointerClick, X } from "lucide-react";
import {
  loadGeographyByDecade,
  loadGeographyByBirthCountry,
  loadFocusSculptors,
  loadMaterialsByDecade,
  loadMovementsByDecade,
} from "@/lib/data";
import { GeographyChart } from "@/components/charts/GeographyChart";
import { MaterialsChart } from "@/components/charts/MaterialsChart";
import { MovementsChart } from "@/components/charts/MovementsChart";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { formatDisplayValue, formatGender } from "@/lib/utils";

const MIN_BIRTH_YEAR = 1800;

/**
 * Geography source — either legal/attributed citizenship (Wikidata P27,
 * primary value) or place of birth → country (P19 → P17). Birth country
 * exposes the migration delta that citizenship flattens (e.g. Brâncuși
 * reads as "United States" by citizenship, "Romania" by birth country).
 */
type GeoSource = "citz" | "birth";

const GEO_SOURCE_LABEL: Record<GeoSource, string> = {
  citz: "Citizenship",
  birth: "Country of birth",
};

const GEO_SOURCE_SUBTITLE: Record<GeoSource, string> = {
  citz:
    "Legal / attributed nationality (Wikidata P27). Emigrés appear under their adopted country.",
  birth:
    "Where sculptors were born (Wikidata P19 → P17). Shows the migration canon before naturalization.",
};

/**
 * EvolutionContent — client component for the Evolution page.
 * Uses useSearchParams() so decade selections are URL-shareable.
 * Must be wrapped in <Suspense> in the parent page (Next.js static export requirement).
 */
export function EvolutionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [geoByCitz, setGeoByCitz] = useState<DecadeAggregation[]>([]);
  const [geoByBirth, setGeoByBirth] = useState<DecadeAggregation[]>([]);
  const [movementsData, setMovementsData] = useState<DecadeAggregation[]>([]);
  const [materialsData, setMaterialsData] = useState<DecadeAggregation[]>([]);
  const [focusSculptors, setFocusSculptors] = useState<LegacySculptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(true);

  // Decade state lives in URL: ?decade=1920
  const activeDecade = searchParams.get("decade")
    ? Number(searchParams.get("decade"))
    : null;

  // Geography source lives in URL: ?geo=birth (default: citz). Using URL
  // state keeps the toggle shareable — e.g. a link to the birth-country
  // view of the 1920s reproduces the exact reader experience.
  const geoSource: GeoSource = searchParams.get("geo") === "birth" ? "birth" : "citz";

  const setGeoSource = useCallback(
    (source: GeoSource) => {
      const params = new URLSearchParams(searchParams.toString());
      if (source === "citz") {
        params.delete("geo"); // default state — keep URL clean
      } else {
        params.set("geo", source);
      }
      const qs = params.toString();
      router.replace(`/evolution${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setActiveDecade = useCallback(
    (decade: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (activeDecade === decade) {
        params.delete("decade");
      } else {
        params.set("decade", String(decade));
      }
      router.replace(`/evolution?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, activeDecade]
  );

  const clearDecade = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("decade");
    router.replace(`/evolution?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const [geoCitzData, geoBirthData, mvData, matData, focusData] =
          await Promise.all([
            loadGeographyByDecade(),
            loadGeographyByBirthCountry(),
            loadMovementsByDecade(),
            loadMaterialsByDecade().catch(() => []),
            loadFocusSculptors(),
          ]);
        setGeoByCitz(geoCitzData);
        setGeoByBirth(geoBirthData);
        setMovementsData(mvData);
        setMaterialsData(matData);
        setFocusSculptors(focusData);
      } catch (err) {
        console.error("Failed to load evolution data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSculptors = activeDecade
    ? focusSculptors.filter(
        (s) =>
          s.birthDecade != null &&
          s.birthDecade >= activeDecade &&
          s.birthDecade < activeDecade + 10
      )
    : focusSculptors;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading evolution charts" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Evolution of Sculpture
        </h1>
        <p className="text-muted-foreground">
          How sculpture evolved over time — geography and movements from{" "}
          {MIN_BIRTH_YEAR} to present.
        </p>

        {/* Interaction hint - dismissible */}
        {showHint && (
          <div className="mt-4 flex items-center gap-2 text-sm text-accent-primary bg-accent-muted rounded-md px-3 py-2 w-fit">
            <MousePointerClick className="h-4 w-4" />
            <span>Click any decade area to filter sculptors</span>
            <button
              onClick={() => setShowHint(false)}
              className="ml-2 p-1 hover:bg-accent-primary/20 rounded"
              aria-label="Dismiss hint"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Active decade banner */}
      {activeDecade && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border bg-accent/30 p-4">
          <span className="font-medium">Filtered: {activeDecade}s</span>
          <span className="text-sm text-muted-foreground">
            {filteredSculptors.length} focus sculptor
            {filteredSculptors.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDecade}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid gap-8 lg:grid-cols-2 mb-10">
        <section>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-base font-semibold text-text-primary">
              {GEO_SOURCE_LABEL[geoSource]}
            </h2>
            {/* Source toggle — pill group, URL-backed via ?geo= */}
            <div
              role="tablist"
              aria-label="Geography source"
              className="inline-flex rounded-full bg-bg-secondary p-0.5 text-[11px] font-medium"
            >
              {(["citz", "birth"] as const).map((opt) => {
                const active = geoSource === opt;
                return (
                  <button
                    key={opt}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setGeoSource(opt)}
                    className={
                      active
                        ? "px-2.5 py-1 rounded-full bg-accent-primary text-white"
                        : "px-2.5 py-1 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                    }
                  >
                    {opt === "citz" ? "Citizenship" : "Birth"}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {GEO_SOURCE_SUBTITLE[geoSource]}
          </p>
          <GeographyChart
            data={geoSource === "birth" ? geoByBirth : geoByCitz}
            activeDecade={activeDecade}
            onDecadeClick={setActiveDecade}
          />
        </section>

        <section>
          <h2 className="text-base font-semibold mb-1 text-text-primary">
            Art Movements
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Top movements per decade — click to filter
          </p>
          <MovementsChart
            data={movementsData}
            activeDecade={activeDecade}
            onDecadeClick={setActiveDecade}
            showEvents={true}
          />
        </section>

        {materialsData.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-1 text-text-primary">
              Materials
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              From museum collections (Met + AIC)
            </p>
            <MaterialsChart
              data={materialsData}
              activeDecade={activeDecade}
              onDecadeClick={setActiveDecade}
            />
          </section>
        )}
      </div>

      {/* Focus sculptors — filtered by active decade */}
      <section className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {activeDecade ? `${activeDecade}s Focus Sculptors` : "Focus Sculptors"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredSculptors.length} of {focusSculptors.length}
          </span>
        </div>

        {filteredSculptors.length === 0 ? (
          <EmptyState
            title={`No focus sculptors born in the ${activeDecade}s`}
            description="The curated focus list is selective by design — gaps in some decades are real, not bugs. Clear the decade filter to see the full focus set, or open the lineage / explore pages for the unfiltered cache."
            action={
              <Button variant="ghost" size="sm" onClick={clearDecade}>
                Clear decade filter
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSculptors.map((sculptor) => (
              <Link
                key={sculptor.qid}
                href={`/explore/${sculptor.qid}`}
                className="block rounded-md bg-bg-secondary p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
              >
                <h3 className="font-medium text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  {sculptor.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {sculptor.birthYear}
                  {sculptor.deathYear ? ` – ${sculptor.deathYear}` : " – present"}
                </p>
                {sculptor.movement && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-sm bg-accent-muted text-accent-primary">
                    {formatDisplayValue(sculptor.movement, { isMovement: true })}
                  </span>
                )}
                {sculptor.citizenship && (
                  <p className="text-xs text-text-tertiary mt-1">
                    {formatDisplayValue(sculptor.citizenship, { isName: true })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
