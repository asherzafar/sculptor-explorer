"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DataScopeNote } from "@/components/DataScopeNote";
import { EmptyState } from "@/components/EmptyState";
import { LifespanTimeline } from "@/components/charts/LifespanTimeline";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { loadTimelineSculptors } from "@/lib/data";
import type { TimelineSculptor } from "@/lib/types";
import {
  createTimelineHref,
  parseTimelineSearchParams,
  sortTimelineSculptors,
  timelineSortDescription,
  type TimelineSort,
} from "./timeline-state";

const SORT_OPTIONS: {
  key: TimelineSort;
  label: string;
  title: string;
}[] = [
  {
    key: "alpha",
    label: "Alphabetical",
    title: "Sort A to Z by last name",
  },
  {
    key: "chrono",
    label: "Chronological",
    title: "Sort by birth year",
  },
  {
    key: "lifespan",
    label: "Lifespan",
    title: "Sort known lifespans from longest to shortest",
  },
];

const focusClass =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent-hover";

function lifespanText(sculptor: TimelineSculptor): string {
  return `${sculptor.birthYear}–${sculptor.deathYear ?? "—"}`;
}

function LifespanRecordList({
  sculptors,
  label,
  testId,
}: {
  sculptors: TimelineSculptor[];
  label: string;
  testId: string;
}) {
  return (
    <ol aria-label={label} className="overflow-hidden" data-testid={testId}>
      {sculptors.map((sculptor, index) => (
        <li
          key={sculptor.id}
          className={index % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"}
        >
          <Link
            href={`/explore/${sculptor.id}`}
            className={`group grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-sm px-3 py-2 text-accent-hover transition-colors hover:bg-accent-muted motion-reduce:transition-none ${focusClass}`}
          >
            <span className="min-w-0 font-medium group-hover:underline">
              {sculptor.name}
            </span>
            <span className="text-right text-sm tabular-nums text-text-primary">
              <span aria-hidden="true">{lifespanText(sculptor)}</span>
              <span className="sr-only">
                {sculptor.birthYear} to{" "}
                {sculptor.deathYear ?? "death year not recorded"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function TimelineContent() {
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const parsed = useMemo(
    () => parseTimelineSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const [sculptors, setSculptors] = useState<TimelineSculptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [urlNotice, setUrlNotice] = useState<string | null>(null);

  const sortedSculptors = useMemo(
    () => sortTimelineSculptors(sculptors, parsed.state.sort),
    [sculptors, parsed.state.sort],
  );
  const unknownDeathCount = sculptors.filter(
    (sculptor) => sculptor.deathYear === null,
  ).length;
  const sortDescription = timelineSortDescription(parsed.state.sort);

  useEffect(() => {
    if (!parsed.needsCanonicalization) return;
    window.history.replaceState(null, "", createTimelineHref(parsed.state));
    if (parsed.hadInvalidParameters) {
      setUrlNotice(
        "Unsupported Timeline URL options were reset to the canonical view.",
      );
    }
  }, [parsed]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await loadTimelineSculptors();
        if (active) setSculptors(data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function setSortMode(sort: TimelineSort) {
    if (sort === parsed.state.sort) return;
    setUrlNotice(null);
    window.history.pushState(null, "", createTimelineHref({ sort }));
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading timeline" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Focus Sculptors — Lifespans"
          subtitle="Compare when the project’s focus sculptors lived."
        />
        <EmptyState
          title="The Timeline could not be loaded"
          description="Reload the page to retry. No partial lifespan view is being presented as complete."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        className="mb-5"
        title="Focus Sculptors — Lifespans"
        subtitle={`Compare when the project’s ${sculptors.length} focus sculptors lived; change the order or open a sculptor record.`}
      />

      <fieldset className="mb-5" aria-describedby="timeline-sort-status">
        <legend className="mb-2 text-sm font-medium text-text-primary">
          Order lifespan records
        </legend>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(({ key, label, title }) => (
            <button
              key={key}
              type="button"
              title={title}
              aria-pressed={parsed.state.sort === key}
              onClick={() => setSortMode(key)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${focusClass} ${
                parsed.state.sort === key
                  ? "bg-accent-primary text-white"
                  : "bg-bg-secondary text-text-primary hover:bg-accent-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p
          id="timeline-sort-status"
          className="mt-2 text-xs text-text-secondary"
          aria-live="polite"
          data-testid="timeline-sort-status"
        >
          {sculptors.length} records in {sortDescription}.
        </p>
      </fieldset>

      {urlNotice ? (
        <div
          role="status"
          data-testid="timeline-url-notice"
          className="mb-5 rounded-md border border-border-axis bg-bg-secondary px-4 py-3 text-sm text-text-primary"
        >
          {urlNotice}
        </div>
      ) : null}

      <DataScopeNote
        compactMobile
        className="mb-5"
        source="The curated focus-list CSV supplies dates; matched Wikidata records supply QIDs."
        scope={`${sculptors.length.toLocaleString()} focus sculptors, not the full published roster.`}
        limits={`NSS and American figurative emphasis; ${unknownDeathCount.toLocaleString()} death years are unknown. Open bars extend to the current year only for display; color shows birth decade, not importance or influence.`}
      />

      <section
        className="xl:hidden"
        aria-labelledby="timeline-list-heading"
        data-testid="timeline-reflow-view"
      >
        <div className="mb-3">
          <h2
            id="timeline-list-heading"
            className="font-display text-xl text-text-primary"
          >
            Recorded lifespans
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Names and dates stay together in this reflow view. The visual bar
            overview appears on wider screens.
          </p>
        </div>
        <LifespanRecordList
          sculptors={sortedSculptors}
          label={`Focus sculptors in ${sortDescription}`}
          testId="timeline-mobile-list"
        />
      </section>

      <section
        className="hidden xl:block"
        aria-labelledby="timeline-chart-heading"
        data-testid="timeline-wide-view"
      >
        <h2 id="timeline-chart-heading" className="sr-only">
          Visual lifespan overview
        </h2>
        <LifespanTimeline
          data={sculptors}
          showEvents
          sortMode={parsed.state.sort}
        />

        <details className="mt-8" data-testid="timeline-desktop-records">
          <summary
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm px-2 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
          >
            Browse the same {sculptors.length} lifespan records as a structured
            list
          </summary>
          <div className="mt-3 max-w-3xl">
            <LifespanRecordList
              sculptors={sortedSculptors}
              label={`Structured focus-sculptor list in ${sortDescription}`}
              testId="timeline-desktop-list"
            />
          </div>
        </details>
      </section>
    </div>
  );
}
