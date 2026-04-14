import fs from "fs";
import path from "path";
import { SculptorDetail } from "./SculptorDetail";

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
  return <SculptorDetail qid={qid} />;
}
