import type { Work } from "@/lib/types";

/**
 * WorksGallery — public-domain museum images on the sculptor detail page.
 *
 * Design intent:
 * - Strict PD only. The pipeline filters before export
 *   (`build_works_index()` in pipeline/export_json.py); the UI trusts
 *   that filter and renders no extra rights chrome. If we ever loosen
 *   the gate at the data layer we'll need rights metadata here too.
 * - Cards link out to each museum's canonical object page rather than
 *   opening a lightbox. Sending visitors to the Met / AIC for the
 *   full record is the honest destination — they have richer metadata
 *   (provenance, exhibitions, related works) than we'd ever surface
 *   here, and the link respects that they own the work.
 * - Image is `<img>`, not `next/image`. Static export plus hot-linked
 *   CDN URLs means next/image's optimizer can't help; using <img>
 *   keeps the build simple and the bytes go straight to the museum CDN.
 * - `loading="lazy"` so a sculptor with six works doesn't blow the
 *   initial paint budget. The grid still triggers above-the-fold loads
 *   for the first 1–2 cards on most viewports.
 * - Captions truncate via `line-clamp-2` on title and `truncate` on
 *   medium. Long medium strings are common (e.g. "Bronze, with green
 *   patina, on a marble plinth designed by the artist") and would
 *   otherwise blow card heights inconsistent.
 *
 * Returns null when there are no works — caller doesn't need to
 * conditionally render the section.
 */
export interface WorksGalleryProps {
  works: Work[] | undefined;
  /** Sculptor name, used for image alt text. */
  sculptorName: string;
}

const SOURCE_LABEL: Record<Work["source"], string> = {
  met: "The Met",
  aic: "Art Institute of Chicago",
};

export function WorksGallery({ works, sculptorName }: WorksGalleryProps) {
  if (!works || works.length === 0) return null;

  return (
    <section className="mt-12 max-w-5xl">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Works
        </h2>
        <p className="text-xs text-text-tertiary">
          {works.length} public-domain {works.length === 1 ? "work" : "works"}{" "}
          from museum collections
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => {
          const card = (
            <article className="group flex flex-col h-full overflow-hidden rounded-md border border-border-subtle bg-bg-secondary transition-colors hover:border-accent-primary/40">
              {/* Image — fixed aspect so the grid stays even when one
                  work is a tall figure and another is a relief. The
                  `bg-bg-primary` gives transparent PNGs (rare on Met,
                  more common on AIC) a clean background. */}
              <div className="relative aspect-[4/5] overflow-hidden bg-bg-primary">
                <img
                  src={work.thumbnailUrl}
                  alt={`${work.title} by ${sculptorName}`}
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              {/* Caption */}
              <div className="flex flex-1 flex-col gap-1 p-3">
                <h3
                  className="font-display text-sm font-semibold leading-snug text-text-primary line-clamp-2"
                  title={work.title}
                >
                  {work.title}
                </h3>
                {work.date && (
                  <p className="text-xs text-text-secondary">{work.date}</p>
                )}
                {work.medium && (
                  <p
                    className="text-xs text-text-tertiary truncate"
                    title={work.medium}
                  >
                    {work.medium}
                  </p>
                )}
                <p className="mt-auto pt-2 text-[11px] uppercase tracking-wider text-text-tertiary">
                  {SOURCE_LABEL[work.source]}
                </p>
              </div>
            </article>
          );
          return (
            <li key={`${work.source}-${work.objectId}`}>
              {work.museumUrl ? (
                <a
                  href={work.museumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-text-tertiary">
        Public-domain images courtesy of The Metropolitan Museum of Art and the
        Art Institute of Chicago. Click any work to view its full record at the
        source institution.
      </p>
    </section>
  );
}
