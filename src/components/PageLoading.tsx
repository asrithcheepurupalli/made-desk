export function PageLoading() {
  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      <div className="brutal-card bg-white p-8 animate-pulse">
        <div className="h-3 w-40 bg-[#e4ddd0] mb-4" />
        <div className="h-7 w-72 bg-[#e4ddd0] mb-6" />
        <div className="h-3 w-full bg-[#ede8df] mb-2" />
        <div className="h-3 w-2/3 bg-[#ede8df]" />
      </div>
    </div>
  );
}

export function NotFoundInStore({ what, href, label }: { what: string; href: string; label: string }) {
  return (
    <div className="p-8 max-w-xl w-full mx-auto">
      <div className="brutal-card bg-white p-8 text-center">
        <p className="label text-[#7c7770] mb-2">Not found</p>
        <h1 className="font-display font-semibold italic text-2xl text-[#16130f] mb-2">
          This {what} is not in this browser<span className="not-italic text-[#c8102e]">.</span>
        </h1>
        <p className="font-sans text-xs text-[#7c7770] mb-5">
          It may have been deleted, or it was created on another device. Data lives in the browser it was made in.
        </p>
        <a href={href} className="inline-block bg-[#16130f] text-[#f6f3ee] font-mono text-xs uppercase px-4 py-2 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors">
          {label}
        </a>
      </div>
    </div>
  );
}
