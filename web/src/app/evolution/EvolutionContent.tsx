"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DecadeAggregation, LegacySculptor } from "@/lib/types";
import {
  loadGeographyByDecade,
  loadFocusSculptors,
  loadMaterialsByDecade,
  loadMovementsByDecade,
} from "@/lib/data";
import { GeographyChart } from "@/components/charts/GeographyChart";
import { MaterialsChart } from "@/components/charts/MaterialsChart";
import { MovementsChart } from "@/components/charts/MovementsChart";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MIN_BIRTH_YEAR = 1800;

/**
 * EvolutionContent — client component for the Evolution page.
 * Uses useSearchParams() so decade selections are URL-shareable.
 * Must be wrapped in <Suspense> in the parent page (Next.js static export requirement).
 */
export function EvolutionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [geographyData, setGeographyData] = useState<DecadeAggregation[]>([]);
  const [movementsData, setMovementsData] = useState<DecadeAggregation[]>([]);
  const [materialsData, setMaterialsData] = useState<DecadeAggregation[]>([]);
  const [focusSculptors, setFocusSculptors] = useState<LegacySculptor[]>([]);
  const [loading, setLoading] = useState(true);

  // Decade state lives in URL: ?decade=1920
  const activeDecade = searchParams.get("decade")
    ? Number(searchParams.get("decade"))
    : null;

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
        const [geoData, mvData, matData, focusData] = await Promise.all([
          loadGeographyByDecade(),
          loadMovementsByDecade(),
          loadMaterialsByDecade().catch(() => []),
          loadFocusSculptors(),
        ]);
        setGeographyData(geoData);
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
        <p className="text-muted-foreground">Loading…</p>
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
          {MIN_BIRTH_YEAR} to present. Click any area to filter.
        </p>
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
          <h2 className="text-base font-semibold mb-1 text-text-primary">
            Country of Birth
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Top countries per decade — click to filter
          </p>
          <GeographyChart
            data={geographyData}
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
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {activeDecade ? `${activeDecade}s Focus Sculptors` : "Focus Sculptors"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredSculptors.length} of {focusSculptors.length}
          </span>
        </div>

        {filteredSculptors.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No focus sculptors born in the {activeDecade}s.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSculptors.map((sculptor) => (
              <div
                key={sculptor.qid}
                className="rounded-md border p-4 hover:bg-accent/50 transition-colors"
              >
                <h3 className="font-medium text-sm">{sculptor.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sculptor.birthYear}
                  {sculptor.deathYear ? ` – ${sculptor.deathYear}` : " – present"}
                </p>
                {sculptor.movement && (
                  <p className="text-xs text-muted-foreground">{sculptor.movement}</p>
                )}
                {sculptor.citizenship && (
                  <p className="text-xs text-muted-foreground">{sculptor.citizenship}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
