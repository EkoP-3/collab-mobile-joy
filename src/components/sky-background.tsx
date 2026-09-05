function Cloud({ className }: { className?: string }) {
  return (
    <div className={`relative h-24 w-56 ${className ?? ""}`}>
      <div className="absolute top-6 left-0 h-16 w-40 rounded-full bg-white/80 blur-md" />
      <div className="absolute top-0 left-12 h-20 w-24 rounded-full bg-white/90 blur-md" />
      <div className="absolute top-8 left-24 h-14 w-28 rounded-full bg-white/70 blur-md" />
    </div>
  );
}

/** Ana ekranla aynı gökyüzü: renkli ışıklar + süzülen bulutlar. */
export function SkyBackground() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-accent-bright/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-brand/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 size-96 rounded-full bg-sun/40 blur-3xl" />

      <div className="animate-cloud-slow pointer-events-none absolute top-10 -left-16">
        <Cloud className="scale-110 opacity-90" />
      </div>
      <div className="animate-cloud-fast pointer-events-none absolute top-56 -right-20">
        <Cloud className="scale-75 opacity-70" />
      </div>
      <div className="animate-cloud-slow pointer-events-none absolute top-[55%] -left-24">
        <Cloud className="scale-90 opacity-60" />
      </div>
      <div className="animate-cloud-fast pointer-events-none absolute bottom-40 -right-16">
        <Cloud className="scale-125 opacity-75" />
      </div>
    </>
  );
}
