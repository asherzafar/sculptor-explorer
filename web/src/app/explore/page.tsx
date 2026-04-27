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
      className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
        Explore Sculptors
      </h1>
      <p className="text-muted-foreground mb-6">
        Search and filter {sculptors.length.toLocaleString()} sculptors from the collection.
      </p>

      {/* Global search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name (diacritics optional)..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
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
                  className={`cursor-pointer hover:bg-accent/30 transition-colors ${
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
      </div>
    </div>
  );
}
