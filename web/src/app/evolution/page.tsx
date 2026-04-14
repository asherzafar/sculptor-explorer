"use client";

import { useEffect, useState } from "react";
import type {
  DecadeAggregation,
  LegacySculptor,
} from "@/lib/types";
import {
  loadGeographyByDecade,
  loadFocusSculptors,
  loadMaterialsByDecade,
  loadMovementsByDecade,
} from "@/lib/data";
import { GeographyChart } from "@/components/charts/GeographyChart";
import { MaterialsChart } from "@/components/charts/MaterialsChart";
import { MovementsChart } from "@/components/charts/MovementsChart";
import { useChartState } from "@/lib/chart-state";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MIN_BIRTH_YEAR = 1800;

export default function EvolutionPage() {
  const [geographyData, setGeographyData] = useState<DecadeAggregation[]>([]);
  const [movementsData, setMovementsData] = useState<DecadeAggregation[]>([]);
  const [materialsData, setMaterialsData] = useState<DecadeAggregation[]>([]);
  const [focusSculptors, setFocusSculptors] = useState<LegacySculptor[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeDecade, setActiveDecade, clearSelection } = useChartState();

  useEffect(() => {
    async function loadData() {
      try {
        const [geoData, movementsData, materialsData, focusData] =
          await Promise.all([
            loadGeographyByDecade(),
            loadMovementsByDecade(),
            loadMaterialsByDecade().catch(() => []),
            loadFocusSculptors(),
          ]);
        setGeographyData(geoData);
        setMovementsData(movementsData);
        setMaterialsData(materialsData);
        setFocusSculptors(focusData);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter sculptors by active decade
  const filteredSculptors = activeDecade
    ? focusSculptors.filter(
        (s) =>
          s.birthDecade &&
          s.birthDecade >= activeDecade &&
          s.birthDecade < activeDecade + 10
      )
    : focusSculptors;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Evolution of Sculpture</h1>
        <p className="text-muted-foreground">
          How sculpture evolved over time — geography, movements, and materials
          from {MIN_BIRTH_YEAR} to present.
        </p>
      </div>

      {/* Decade Selection Controls */}
      {activeDecade && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border bg-accent/30 p-4">
          <span className="font-medium">
            Selected: {activeDecade}s
          </span>
          <span className="text-sm text-muted-foreground">
            ({filteredSculptors.length} sculptors)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Three Synchronized Tracks */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Geography Track */}
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Geography</h2>
          <GeographyChart
            data={geographyData}
            activeDecade={activeDecade}
            onDecadeClick={setActiveDecade}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Click a decade to filter all charts
          </p>
        </section>

        {/* Movements Track */}
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Movements</h2>
          <MovementsChart
            data={movementsData}
            activeDecade={activeDecade}
            onDecadeClick={setActiveDecade}
            showEvents={true}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Historical events marked with dashed lines
          </p>
        </section>

        {/* Materials Track */}
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Materials</h2>
          <MaterialsChart
            data={materialsData}
            activeDecade={activeDecade}
            onDecadeClick={setActiveDecade}
          />
          <p className="text-xs text-muted-foreground mt-2">
            From museum collections (Met + AIC)
          </p>
        </section>
      </div>

      {/* Focus Sculptors - Filtered by selected decade */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {activeDecade ? `${activeDecade}s Sculptors` : "Focus Sculptors"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredSculptors.length} of {focusSculptors.length}
          </span>
        </div>

        {filteredSculptors.length === 0 ? (
          <p className="text-muted-foreground">
            No sculptors from the focus list were born in this decade.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSculptors.map((sculptor) => (
              <div
                key={sculptor.qid}
                className="rounded-md border p-4 hover:bg-accent/50 transition-colors"
              >
                <h3 className="font-medium">{sculptor.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {sculptor.birthYear}
                  {sculptor.deathYear
                    ? ` – ${sculptor.deathYear}`
                    : " – present"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sculptor.movement}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sculptor.citizenship}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
