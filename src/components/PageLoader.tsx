export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#080809]">
      <div className="flex flex-col items-center gap-5">
        {/* Rotating gold ring around the perfume-drop emblem */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border border-[#E5C158]/15" />
          <div className="absolute inset-0 rounded-full border-t border-[#E5C158] animate-spin [animation-duration:1.1s]" />
          <svg
            className="absolute inset-0 m-auto w-6 h-6 opacity-90"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pageLoaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF3D1" />
                <stop offset="50%" stopColor="#E5C158" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path
              d="M12 2C7.5 7.5 4 11.5 4 16a8 8 0 0 0 16 0c0-4.5-3.5-8.5-8-14Z"
              stroke="url(#pageLoaderGold)"
              strokeWidth="1.7"
              fill="none"
            />
          </svg>
        </div>

        <span className="font-brand text-sm tracking-[0.4em] gold-gradient-text font-semibold">
          AURA
        </span>
      </div>
    </div>
  );
}
