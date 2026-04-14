"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LegacySculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";

export function SculptorDetail({ qid }: { qid: string }) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/explore" className="text-sm text-text-secondary hover:underline">
        ← Back to explore
      </Link>

      <h1 className="font-display text-3xl font-bold text-text-primary mt-6 mb-2">{sculptor.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Born</h2>
          <p className="text-lg">{sculptor.birthYear || "Unknown"}</p>
        </div>

        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Died</h2>
          <p className="text-lg">
            {sculptor.alive ? "Living" : sculptor.deathYear || "Unknown"}
          </p>
        </div>

        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Movement</h2>
          <p className="text-lg">{formatDisplayValue(sculptor.movement, { isMovement: true })}</p>
        </div>

        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Citizenship</h2>
          <p className="text-lg">{formatDisplayValue(sculptor.citizenship, { isName: true })}</p>
        </div>

        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Gender</h2>
          <p className="text-lg">{formatGender(sculptor.gender)}</p>
        </div>

        <div className="rounded-md bg-bg-secondary p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Connections</h2>
          <p className="text-lg">
            {sculptor.totalDegree} total ({sculptor.inDegree} in, {sculptor.outDegree} out)
          </p>
        </div>
      </div>
    </div>
  );
}
