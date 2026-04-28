"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import type { LegacySculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

// Diacritic-insensitive text normalization for search
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

const columns: ColumnDef<LegacySculptor>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const s = row.original;
      // Show the native form as a second line only when it's meaningfully
      // distinct from the romanization (different script or different
      // spelling). Wikidata's en-language P1559 entries that just echo the
      // display name would be noise.
      const showNative =
        !!s.nativeName &&
        !!s.nativeLang &&
        s.nativeLang !== "en" &&
        s.nativeName !== s.name;
      return (
        <Link
          href={`/explore/${s.qid}`}
          className="block group cursor-pointer"
        >
          <span className="text-accent-primary group-hover:underline">
            {s.name}
          </span>
          {showNative && (
            <span
              lang={s.nativeLang ?? undefined}
              className="block text-xs text-text-tertiary mt-0.5"
            >
              {s.nativeName}
            </span>
          )}
        </Link>
      );
    },
  },
  {
    accessorKey: "birthYear",
    header: "Born",
    cell: ({ row }) => row.getValue("birthYear") ?? "—",
  },
  {
    accessorKey: "deathYear",
    header: "Died",
    cell: ({ row }) => row.getValue("deathYear") ?? "—",
  },
  {
    accessorKey: "movement",
    header: "Movement",
    cell: ({ row }) => {
      const movement = row.getValue("movement") as string;
      return formatDisplayValue(movement, { isMovement: true });
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string;
      return formatGender(gender);
    },
  },
  {
    accessorKey: "citizenship",
    header: "Citizenship",
    cell: ({ row }) => {
      const citizenship = row.getValue("citizenship") as string;
      return citizenship || "—";
    },
  },
  {
    accessorKey: "birthDecade",
    header: "Decade",
    cell: ({ row }) => {
      const decade = row.getValue("birthDecade") as number | null;
      return decade ? `${decade}s` : "—";
    },
  },
];

function SortHeader({
  column,
  children,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: () => void };
  children: React.ReactNode;
}) {
  const sort = column.getIsSorted();
  return (
    <button
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide text-text-tertiary hover:text-text-primary transition-colors"
    >
      {children}
      {sort === "asc" && <ArrowUp className="h-3 w-3" />}
      {sort === "desc" && <ArrowDown className="h-3 w-3" />}
      {sort === false && <ArrowUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [sculptors, setSculptors] = useState<LegacySculptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "birthYear", desc: false }, // Default: chronological (oldest first)
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadSculptors();
        setSculptors(data);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Diacritic-insensitive global filter, also matching native names so a
  // reader can paste "ブランクーシ" or "Бранкузи" and find the right row.
  // Note: normalizeText() only strips combining marks; for non-Latin
  // scripts it's effectively a no-op, which is what we want — exact-form
  // substring match is the right behaviour for those queries.
  const filteredData = useMemo(() => {
    if (!globalFilter) return sculptors;
    const normalizedQuery = normalizeText(globalFilter);
    return sculptors.filter((s) => {
      if (normalizeText(s.name).includes(normalizedQuery)) return true;
      if (s.nativeName && normalizeText(s.nativeName).includes(normalizedQuery)) {
        return true;
      }
      return false;
    });
  }, [sculptors, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading sculptors" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Explore Sculptors"
        subtitle={`Search and filter ${sculptors.length.toLocaleString()} sculptors from the collection.`}
      />

      {/* Global search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name (diacritics optional)…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-md border border-border-subtle bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
        />
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Showing {filteredData.length.toLocaleString()} of{" "}
        {sculptors.length.toLocaleString()} sculptors
      </p>

      {/* Data table — zebra striping per design system */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <SortHeader column={header.column}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </SortHeader>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const sculptor = row.original;
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/explore/${sculptor.qid}`)}
                  className={`cursor-pointer hover:bg-accent-muted transition-colors ${
                    index % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Empty result state — only fires after data has loaded but the
            current search filter excludes everyone. We render *outside*
            the <table> rather than as an empty row so the message has
            room to breathe and so a screen reader doesn't have to walk
            the table structure to reach it. */}
        {filteredData.length === 0 && (
          <EmptyState
            className="mt-2"
            title="No sculptors match your search"
            description={
              globalFilter
                ? `Nothing matches “${globalFilter}”. The search covers names and native-language names — try a partial match, drop diacritics, or clear the search.`
                : "All filters combined excluded every sculptor. Try clearing them."
            }
            action={
              <button
                onClick={() => setGlobalFilter("")}
                className="text-sm text-accent-primary hover:underline"
              >
                Clear search
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
