"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Sculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";

export default function ExplorePage() {
  const [sculptors, setSculptors] = useState<Sculptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = sculptors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Explore Sculptors</h1>
      <p className="text-muted-foreground mb-6">
        Search and filter notable sculptors from the collection.
      </p>

      <input
        type="text"
        placeholder="Search sculptors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-6 px-3 py-2 rounded-md border bg-background"
      />

      <p className="text-sm text-muted-foreground mb-4">
        Showing {filtered.length} of {sculptors.length} sculptors
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 50).map((sculptor) => (
          <Link
            key={sculptor.qid}
            href={`/explore/${sculptor.qid}`}
            className="rounded-md border p-4 hover:bg-accent/50 transition-colors"
          >
            <h3 className="font-medium">{sculptor.name}</h3>
            <p className="text-sm text-muted-foreground">
              {sculptor.birthYear}
              {sculptor.deathYear ? ` – ${sculptor.deathYear}` : " – present"}
            </p>
            <p className="text-sm text-muted-foreground">{sculptor.movement}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
