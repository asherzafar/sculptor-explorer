"use client";

import { useEffect, useState } from "react";
import type { LegacyEdge, LegacySculptor, ExternalMentor } from "@/lib/types";
import { loadEdges, loadSculptors, loadExternalMentors } from "@/lib/data";
import { LineageGraph } from "@/components/charts/LineageGraph";

export default function LineagePage() {
  const [edges, setEdges] = useState<LegacyEdge[]>([]);
  const [sculptors, setSculptors] = useState<LegacySculptor[]>([]);
  const [mentors, setMentors] = useState<ExternalMentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [edgeData, sculptorData, mentorData] = await Promise.all([
          loadEdges(),
          loadSculptors(),
          loadExternalMentors(),
        ]);
        setEdges(edgeData);
        setSculptors(sculptorData);
        setMentors(mentorData);
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
        <p className="text-text-secondary">Loading lineage network...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Lineage
        </h1>
        <p className="text-text-secondary">
          Influence and student-teacher relationships between sculptors, sourced
          from Wikidata. Click a sculptor to see their details; click a mentor
          to open their Wikidata page.
        </p>
      </div>

      <LineageGraph
        sculptors={sculptors}
        edges={edges}
        externalMentors={mentors}
        height={680}
      />

      <div className="mt-6 max-w-2xl text-sm text-text-secondary space-y-2">
        <p>
          <strong className="text-text-primary">What you&apos;re seeing:</strong>{" "}
          circles are sculptors; diamonds are external mentors — painters,
          composers, architects, and other teachers who trained sculptors but
          aren&apos;t classified as sculptors themselves in Wikidata. Node size
          reflects how many connections each person has. Dashed outlines mark
          sculptors without a recorded art movement.
        </p>
        <p className="text-text-tertiary">
          Connections come from Wikidata&apos;s <code>influencedBy</code> and{" "}
          <code>studentOf</code> properties. The graph remains sparse — what
          you see reflects gaps in Wikidata as much as art-historical reality.
        </p>
      </div>
    </div>
  );
}
