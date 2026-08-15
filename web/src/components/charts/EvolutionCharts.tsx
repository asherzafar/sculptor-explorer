"use client";

import { GeographyChart } from "@/components/charts/GeographyChart";
import { MaterialsChart } from "@/components/charts/MaterialsChart";
import { MovementsChart } from "@/components/charts/MovementsChart";
import type {
  EvolutionSeriesProjection,
  GeoSource,
} from "@/app/evolution/evolution-state";

const GEO_SOURCE_LABEL: Record<GeoSource, string> = {
  citz: "Citizenship",
  birth: "Country of birth",
};

const GEO_SOURCE_SUBTITLE: Record<GeoSource, string> = {
  citz:
    "One normalized display citizenship from Wikidata P27. This is not place of residence, cultural identity, or a migration path.",
  birth:
    "Recorded place-of-birth country (Wikidata P19 → P17). This is not citizenship, cultural identity, or later residence.",
};

export function EvolutionArtistCharts({
  geoSource,
  geography,
  movements,
  activeDecade,
  onDecadeClick,
}: {
  geoSource: GeoSource;
  geography: EvolutionSeriesProjection;
  movements: EvolutionSeriesProjection;
  activeDecade: number | null;
  onDecadeClick: (decade: number) => void;
}) {
  return (
    <div data-testid="evolution-wide-view" className="space-y-12">
      <section aria-labelledby="evolution-geography-chart-heading">
        <h2
          id="evolution-geography-chart-heading"
          className="font-display text-xl text-text-primary"
        >
          {GEO_SOURCE_LABEL[geoSource]} by sculptor birth decade
        </h2>
        <p className="mt-1 mb-3 max-w-4xl text-sm text-text-secondary">
          {GEO_SOURCE_SUBTITLE[geoSource]}
        </p>
        <GeographyChart
          projection={geography}
          activeDecade={activeDecade}
          onDecadeClick={onDecadeClick}
        />
      </section>

      <section aria-labelledby="evolution-movement-chart-heading">
        <h2
          id="evolution-movement-chart-heading"
          className="font-display text-xl text-text-primary"
        >
          Recorded movement labels by sculptor birth decade
        </h2>
        <p className="mt-1 mb-3 max-w-4xl text-sm text-text-secondary">
          Wikidata P135 labels are sparse source classifications, not verified
          membership, influence, or stylistic similarity.
        </p>
        <MovementsChart
          projection={movements}
          activeDecade={activeDecade}
          onDecadeClick={onDecadeClick}
        />
      </section>
    </div>
  );
}

export function EvolutionMaterialChart({
  materials,
}: {
  materials: EvolutionSeriesProjection;
}) {
  return <MaterialsChart projection={materials} />;
}
