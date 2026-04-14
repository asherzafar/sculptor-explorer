"use client";

import { useEffect, useState } from "react";
import type { LegacyEdge, LegacySculptor } from "@/lib/types";
import { loadEdges, loadSculptors } from "@/lib/data";

export default function LineagePage() {
  const [edges, setEdges] = useState<LegacyEdge[]>([]);
  const [sculptors, setSculptors] = useState<LegacySculptor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [edgeData, sculptorData] = await Promise.all([
          loadEdges(),
          loadSculptors(),
        ]);
        setEdges(edgeData);
        setSculptors(sculptorData);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const sculptorMap = new Map(sculptors.map((s) => [s.qid, s]));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Lineage</h1>
      <p className="text-muted-foreground mb-6">
        Influence and student-teacher relationships between sculptors.
      </p>

      {edges.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary p-8 text-center">
          <p className="text-muted-foreground">
            Network visualization coming in Phase 3.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {sculptors.length} sculptors loaded, waiting for relationship data.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {edges.length} relationships found across {sculptors.length} sculptors.
          </p>
          <div className="rounded-lg bg-bg-secondary">
            <div className="p-4 border-b border-border-subtle">
              <h2 className="font-semibold">Recent Relationships</h2>
            </div>
            <div className="divide-y divide-border-subtle">
              {edges.slice(0, 20).map((edge, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <span className="font-medium">
                    {edge.fromName}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {edge.relationType.replace(/_/g, " ")} →
                  </span>
                  <span className="font-medium">{edge.toName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
