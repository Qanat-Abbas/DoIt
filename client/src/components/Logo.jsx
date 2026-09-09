/**
 * DoIt! mark — a speech bubble (the ramble) resolving into a checkmark
 * (the done task). Reads at a glance: talk → it's handled.
 */
export default function Logo({ size = 36, withWordmark = true, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="doit-logo-grad" x1="4" y1="2" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <path
          d="M20 3C10.6 3 3 9.8 3 18.2c0 4.4 2.1 8.4 5.5 11.1-.3 2.1-1.2 4-2.6 5.6a.9.9 0 0 0 .8 1.5c3-.4 5.6-1.6 7.7-3.2 1.8.6 3.7.9 5.6.9 9.4 0 17-6.8 17-15.2S29.4 3 20 3Z"
          fill="url(#doit-logo-grad)"
        />
        <path
          d="M13.2 19.4l4.2 4.2 9.4-9.4"
          stroke="white"
          strokeWidth="3.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-white">
          DoIt<span className="text-violet-400">!</span>
        </span>
      )}
    </div>
  );
}
