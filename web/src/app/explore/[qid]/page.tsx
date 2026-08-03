import fs from "fs";
import path from "path";
import { SculptorDetail } from "./SculptorDetail";

let movementPageByName: Map<string, string> | null = null;

function movementPageSlugFor(qid: string): string | null {
  try {
    if (!movementPageByName) {
      const indexPath = path.join(
        process.cwd(),
        "public",
        "data",
        "movements_index.json",
      );
      const index = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as Array<{
        name: string;
        slug: string;
      }>;
      movementPageByName = new Map(
        index.map((movement) => [movement.name, movement.slug]),
      );
    }
    const shardPath = path.join(
      process.cwd(),
      "public",
      "data",
      "sculptors",
      `${qid}.json`,
    );
    const sculptor = JSON.parse(fs.readFileSync(shardPath, "utf-8")) as {
      movement?: string | null;
    };
    return sculptor.movement
      ? (movementPageByName.get(sculptor.movement) ?? null)
      : null;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const filePath = path.join(process.cwd(), "public", "data", "sculptors.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const sculptors = JSON.parse(raw) as { qid: string }[];
    return sculptors.map((s) => ({ qid: s.qid }));
  } catch {
    return [];
  }
}

export default async function SculptorDetailPage({
  params,
}: {
  params: Promise<{ qid: string }>;
}) {
  const { qid } = await params;
  return (
    <SculptorDetail
      qid={qid}
      movementPageSlug={movementPageSlugFor(qid)}
    />
  );
}
