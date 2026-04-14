"use client";

export function MobileGate() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-8 md:hidden">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary mb-4">
          Sculpture in Data
        </h1>
        <p className="text-text-secondary leading-relaxed">
          This site is designed for desktop. Visit on a laptop or larger screen
          for the full experience.
        </p>
      </div>
    </div>
  );
}
