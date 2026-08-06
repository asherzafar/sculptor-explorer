"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react";
import type { SculptorIndexEntry } from "@/lib/types";
import { loadMovementIndex, loadSculptorsIndex } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { DataScopeNote } from "@/components/DataScopeNote";
import { dataSnapshot } from "@/lib/snapshot";
import {
  EXPLORE_PAGE_SIZE,
  applyExploreState,
  clampExplorePage,
  createExploreHref,
  exploreFilterOptions,
  exploreSortOptions,
  parseExploreSearchParams,
  toggleExploreSort,
  type ExploreSort,
  type ExploreUrlState,
} from "./explore-state";

const focusClass =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent-hover";

type SortField =
  | "name"
  | "birth"
  | "death"
  | "movement"
  | "gender"
  | "citizenship"
  | "decade";

const columnSortPrefixes: Record<SortField, string> = {
  name: "name",
  birth: "birth",
  death: "death",
  movement: "movement",
  gender: "gender",
  citizenship: "citizenship",
  decade: "decade",
};

function hasDistinctNativeName(sculptor: SculptorIndexEntry): boolean {
  return Boolean(
    sculptor.nativeName &&
      sculptor.nativeLang &&
      sculptor.nativeLang !== "en" &&
      sculptor.nativeName !== sculptor.name,
  );
}

function lifespan(sculptor: SculptorIndexEntry): string {
  const birth = sculptor.birthYear ?? "—";
  const death = sculptor.deathYear ?? "present";
  return `${birth}–${death}`;
}

function SculptorLink({ sculptor }: { sculptor: SculptorIndexEntry }) {
  const showNative = hasDistinctNativeName(sculptor);
  return (
    <Link
      href={`/explore/${sculptor.qid}`}
      onClick={(event) => event.stopPropagation()}
      className={`group inline-flex min-h-11 flex-col justify-center text-accent-hover ${focusClass}`}
    >
      <span className="group-hover:underline">{sculptor.name}</span>
      {showNative ? (
        <span
          lang={sculptor.nativeLang ?? undefined}
          className="mt-0.5 block text-xs text-text-secondary"
        >
          {sculptor.nativeName}
        </span>
      ) : null}
    </Link>
  );
}

function MovementValue({
  sculptor,
  movementPages,
}: {
  sculptor: SculptorIndexEntry;
  movementPages: ReadonlyMap<string, string>;
}) {
  const movement = sculptor.movement;
  if (!movement || movement === "No movement listed") {
    return <>{formatDisplayValue(movement, { isMovement: true })}</>;
  }

  const pageSlug = movementPages.get(movement);
  if (!pageSlug) {
    return <>{formatDisplayValue(movement, { isMovement: true })}</>;
  }

  return (
    <Link
      href={`/movement/${pageSlug}`}
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex min-h-6 items-center text-accent-hover hover:underline ${focusClass}`}
    >
      {formatDisplayValue(movement, { isMovement: true })}
    </Link>
  );
}

function SortHeader({
  field,
  label,
  currentSort,
  onSort,
}: {
  field: SortField;
  label: string;
  currentSort: ExploreSort;
  onSort: (sort: ExploreSort) => void;
}) {
  const prefix = columnSortPrefixes[field];
  const isAscending = currentSort === `${prefix}-asc`;
  const isDescending = currentSort === `${prefix}-desc`;
  const sortDescription = isAscending
    ? "ascending"
    : isDescending
      ? "descending"
      : "not sorted";

  return (
    <button
      type="button"
      onClick={() => onSort(toggleExploreSort(currentSort, field))}
      aria-label={`Sort by ${label}; currently ${sortDescription}`}
      className={`flex min-h-11 items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary ${focusClass}`}
    >
      {label}
      {isAscending ? <ArrowUp aria-hidden="true" className="h-4 w-4" /> : null}
      {isDescending ? <ArrowDown aria-hidden="true" className="h-4 w-4" /> : null}
      {!isAscending && !isDescending ? (
        <ArrowUpDown aria-hidden="true" className="h-4 w-4 opacity-60" />
      ) : null}
    </button>
  );
}

function ariaSort(
  field: SortField,
  currentSort: ExploreSort,
): "ascending" | "descending" | "none" {
  const prefix = columnSortPrefixes[field];
  if (currentSort === `${prefix}-asc`) return "ascending";
  if (currentSort === `${prefix}-desc`) return "descending";
  return "none";
}

function Pagination({
  state,
  currentPage,
  totalPages,
  position,
}: {
  state: ExploreUrlState;
  currentPage: number;
  totalPages: number;
  position: "top" | "bottom";
}) {
  const linkClass = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-subtle bg-bg-primary px-3 text-sm font-medium text-accent-hover transition-colors hover:bg-bg-secondary ${focusClass}`;
  const disabledClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-subtle px-3 text-sm text-text-secondary";
  const pageHref = (page: number) => createExploreHref({ ...state, page });

  return (
    <nav
      aria-label={`Result pages (${position})`}
      className="flex flex-wrap items-center gap-2"
    >
      {currentPage > 1 ? (
        <Link href={pageHref(1)} scroll={false} prefetch={false} className={linkClass}>
          First
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          First
        </span>
      )}
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          scroll={false}
          prefetch={false}
          className={linkClass}
          rel="prev"
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Previous
        </span>
      )}
      <span className="px-1 text-sm text-text-secondary" aria-current="page">
        Page <strong className="text-text-primary">{currentPage}</strong> of{" "}
        {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          scroll={false}
          prefetch={false}
          className={linkClass}
          rel="next"
        >
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Next
        </span>
      )}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(totalPages)}
          scroll={false}
          prefetch={false}
          className={linkClass}
        >
          Last
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Last
        </span>
      )}
    </nav>
  );
}

export function ExploreContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const parsed = useMemo(
    () => parseExploreSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const [sculptors, setSculptors] = useState<SculptorIndexEntry[]>([]);
  const [movementPages, setMovementPages] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [urlNotice, setUrlNotice] = useState<string | null>(() =>
    parsed.hadInvalidParameters
      ? "Some shared-link options were invalid and were reset to Explore defaults."
      : null,
  );

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [data, movementIndex] = await Promise.all([
          loadSculptorsIndex(),
          loadMovementIndex().catch(() => []),
        ]);
        if (!active) return;
        setSculptors(data);
        setMovementPages(
          new Map(movementIndex.map((movement) => [movement.name, movement.slug])),
        );
      } catch (error) {
        console.error("Failed to load Explore data:", error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredSculptors = useMemo(
    () => applyExploreState(sculptors, parsed.state),
    [sculptors, parsed.state],
  );
  const currentPage = clampExplorePage(
    parsed.state.page,
    filteredSculptors.length,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSculptors.length / EXPLORE_PAGE_SIZE),
  );
  const effectiveState = useMemo(
    () => ({ ...parsed.state, page: currentPage }),
    [parsed.state, currentPage],
  );
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * EXPLORE_PAGE_SIZE;
    return filteredSculptors.slice(start, start + EXPLORE_PAGE_SIZE);
  }, [currentPage, filteredSculptors]);

  useEffect(() => {
    const canonicalHref = createExploreHref(effectiveState);
    const currentHref = `${pathname}${searchString ? `?${searchString}` : ""}`;
    const pageWasOutOfRange = parsed.state.page !== currentPage;

    if (parsed.hadInvalidParameters) {
      setUrlNotice(
        "Some shared-link options were invalid and were reset to Explore defaults.",
      );
    } else if (pageWasOutOfRange && !loading) {
      setUrlNotice(
        `That result page was outside the available range, so page ${currentPage} is shown.`,
      );
    }

    if (
      canonicalHref !== currentHref &&
      (!pageWasOutOfRange || !loading)
    ) {
      window.history.replaceState(null, "", canonicalHref);
    }
  }, [
    currentPage,
    effectiveState,
    loading,
    parsed.hadInvalidParameters,
    parsed.state.page,
    pathname,
    searchString,
  ]);

  function updateState(
    nextState: ExploreUrlState,
    historyMode: "push" | "replace" = "push",
  ) {
    setUrlNotice(null);
    const href = createExploreHref(nextState);
    if (historyMode === "replace") {
      window.history.replaceState(null, "", href);
    } else {
      window.history.pushState(null, "", href);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading sculptors" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Explore Sculptors"
          subtitle="Find and browse the published sculpture roster."
        />
        <EmptyState
          title="The Explore catalogue could not be loaded"
          description="Reload the page to retry. No partial result is being presented as complete."
        />
      </div>
    );
  }

  const firstResult = filteredSculptors.length
    ? (currentPage - 1) * EXPLORE_PAGE_SIZE + 1
    : 0;
  const lastResult = Math.min(
    currentPage * EXPLORE_PAGE_SIZE,
    filteredSculptors.length,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        className="mb-6"
        title="Explore Sculptors"
        subtitle={`Find a sculptor or browse ${sculptors.length.toLocaleString()} published records.`}
      />

      <section aria-label="Find and order sculptors" className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,2fr)_minmax(13rem,1fr)_minmax(13rem,1fr)]">
          <label className="block text-sm font-medium text-text-primary">
            Search names
            <span className="relative mt-1.5 block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="search"
                name="q"
                autoComplete="off"
                placeholder="Search by name (diacritics optional)…"
                value={parsed.state.query}
                onChange={(event) =>
                  updateState(
                    {
                      ...parsed.state,
                      query: event.target.value,
                      page: 1,
                    },
                    "replace",
                  )
                }
                className={`min-h-11 w-full rounded-md border border-border-axis bg-bg-primary py-2 pl-9 pr-11 text-sm text-text-primary placeholder:text-text-secondary ${focusClass}`}
              />
              {parsed.state.query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() =>
                    updateState({ ...parsed.state, query: "", page: 1 })
                  }
                  className={`absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-accent-hover hover:text-text-primary ${focusClass}`}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : null}
            </span>
          </label>

          <label className="block text-sm font-medium text-text-primary">
            Sort results
            <select
              name="sort"
              value={parsed.state.sort}
              onChange={(event) =>
                updateState({
                  ...parsed.state,
                  sort: event.target.value as ExploreSort,
                  page: 1,
                })
              }
              className={`mt-1.5 min-h-11 w-full rounded-md border border-border-axis bg-bg-primary px-3 text-sm text-text-primary ${focusClass}`}
            >
              {exploreSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-text-primary">
            Movement record
            <select
              name="filter"
              value={parsed.state.filter}
              onChange={(event) =>
                updateState({
                  ...parsed.state,
                  filter: event.target.value as ExploreUrlState["filter"],
                  page: 1,
                })
              }
              className={`mt-1.5 min-h-11 w-full rounded-md border border-border-axis bg-bg-primary px-3 text-sm text-text-primary ${focusClass}`}
            >
              {exploreFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {urlNotice ? (
        <div
          role="status"
          data-testid="url-notice"
          className="mb-5 rounded-md border border-border-axis bg-bg-secondary px-4 py-3 text-sm text-text-primary"
        >
          {urlNotice}
        </div>
      ) : null}

      <DataScopeNote
        className="mb-5"
        source={`Wikidata artist records selected by inclusion methodology ${dataSnapshot.methodologyVersion}; explicit overrides and exclusions are disclosed on Transparency.`}
        scope={`${sculptors.length.toLocaleString()} published sculptors from ${dataSnapshot.eligibleCandidates.toLocaleString()} analytically eligible candidates after evidence-backed exclusions.`}
        limits={`Fields are source assertions, not editorial identity judgments. Missing values render as —; movement is present for ${dataSnapshot.fieldCoverage.movement_display.present.toLocaleString()} of ${dataSnapshot.fieldCoverage.total.toLocaleString()} published records.`}
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p
          className="text-sm text-text-secondary"
          aria-live="polite"
          data-testid="results-summary"
        >
          Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()} of{" "}
          {filteredSculptors.length.toLocaleString()} matching sculptors
          {filteredSculptors.length !== sculptors.length
            ? ` (${sculptors.length.toLocaleString()} total)`
            : ""}
        </p>
        {filteredSculptors.length ? (
          <Pagination
            state={effectiveState}
            currentPage={currentPage}
            totalPages={totalPages}
            position="top"
          />
        ) : null}
      </div>

      {filteredSculptors.length === 0 ? (
        <EmptyState
          className="mt-2"
          title="No sculptors match these filters"
          description={
            parsed.state.query
              ? `Nothing matches “${parsed.state.query}”. Search covers display and native-language names; try a partial match or clear one of the controls.`
              : "The selected movement-record filter has no matches. Clear it to restore the roster."
          }
          action={
            <button
              type="button"
              onClick={() =>
                updateState({
                  query: "",
                  sort: "birth-asc",
                  filter: "all",
                  page: 1,
                })
              }
              className={`inline-flex min-h-11 items-center px-3 text-sm font-medium text-accent-hover hover:underline ${focusClass}`}
            >
              Clear Explore filters
            </button>
          }
        />
      ) : (
        <>
          <div
            className="hidden overflow-x-auto md:block"
            data-testid="desktop-result-table"
          >
            <table className="min-w-[58rem] w-full text-sm">
              <caption className="sr-only">
                Sculptor catalogue, page {currentPage} of {totalPages}. Use the
                column buttons to change sorting.
              </caption>
              <thead className="bg-bg-secondary">
                <tr>
                  {(
                    [
                      ["name", "Name"],
                      ["birth", "Born"],
                      ["death", "Died"],
                      ["movement", "Movement"],
                      ["gender", "Gender"],
                      ["citizenship", "Citizenship"],
                      ["decade", "Decade"],
                    ] as const
                  ).map(([field, label]) => (
                    <th
                      key={field}
                      scope="col"
                      aria-sort={ariaSort(field, parsed.state.sort)}
                      className="px-4 py-1 text-left font-medium"
                    >
                      <SortHeader
                        field={field}
                        label={label}
                        currentSort={parsed.state.sort}
                        onSort={(sort) =>
                          updateState({ ...parsed.state, sort, page: 1 })
                        }
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((sculptor, index) => (
                  <tr
                    key={sculptor.qid}
                    onClick={() => router.push(`/explore/${sculptor.qid}`)}
                    className={`cursor-pointer transition-colors hover:bg-accent-muted ${
                      index % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <SculptorLink sculptor={sculptor} />
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {sculptor.birthYear ?? "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {sculptor.deathYear ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <MovementValue
                        sculptor={sculptor}
                        movementPages={movementPages}
                      />
                    </td>
                    <td className="px-4 py-2">{formatGender(sculptor.gender)}</td>
                    <td className="px-4 py-2">
                      {sculptor.citizenship || "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {sculptor.birthDecade ? `${sculptor.birthDecade}s` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol
            className="grid gap-3 md:hidden"
            data-testid="mobile-result-list"
            start={(currentPage - 1) * EXPLORE_PAGE_SIZE + 1}
          >
            {pageRows.map((sculptor, index) => (
              <li key={sculptor.qid}>
                <article
                  className={`rounded-md px-4 py-3 ${
                    index % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"
                  }`}
                >
                  <SculptorLink sculptor={sculptor} />
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-text-secondary">Lifespan</dt>
                    <dd className="tabular-nums text-text-primary">
                      {lifespan(sculptor)}
                    </dd>
                    <dt className="text-text-secondary">Movement</dt>
                    <dd className="text-text-primary">
                      <MovementValue
                        sculptor={sculptor}
                        movementPages={movementPages}
                      />
                    </dd>
                    <dt className="text-text-secondary">Recorded gender</dt>
                    <dd className="text-text-primary">
                      {formatGender(sculptor.gender)}
                    </dd>
                    <dt className="text-text-secondary">Citizenship</dt>
                    <dd className="text-text-primary">
                      {sculptor.citizenship || "—"}
                    </dd>
                    <dt className="text-text-secondary">Birth decade</dt>
                    <dd className="tabular-nums text-text-primary">
                      {sculptor.birthDecade ? `${sculptor.birthDecade}s` : "—"}
                    </dd>
                  </dl>
                </article>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex justify-end">
            <Pagination
              state={effectiveState}
              currentPage={currentPage}
              totalPages={totalPages}
              position="bottom"
            />
          </div>
        </>
      )}
    </div>
  );
}
