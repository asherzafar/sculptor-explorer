"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Sculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";

export default function SculptorDetailPage() {
  const params = useParams();
  const qid = params.qid as string;
  const [sculptor, setSculptor] = useState<Sculptor | null>(null);
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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!sculptor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Sculptor not found</h1>
        <Link href="/explore" className="text-primary hover:underline">
          ← Back to explore
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/explore" className="text-sm text-muted-foreground hover:underline">
        ← Back to explore
      </Link>

      <h1 className="text-3xl font-bold mt-6 mb-2">{sculptor.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Born</h2>
          <p className="text-lg">{sculptor.birthYear || "Unknown"}</p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Died</h2>
          <p className="text-lg">
            {sculptor.alive ? "Living" : sculptor.deathYear || "Unknown"}
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Movement</h2>
          <p className="text-lg">{sculptor.movement}</p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Citizenship</h2>
          <p className="text-lg">{sculptor.citizenship}</p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Gender</h2>
          <p className="text-lg">{sculptor.gender}</p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Connections</h2>
          <p className="text-lg">
            {sculptor.totalDegree} total ({sculptor.inDegree} in, {sculptor.outDegree} out)
          </p>
        </div>
      </div>
    </div>
  );
}
