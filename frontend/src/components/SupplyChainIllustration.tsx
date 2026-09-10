export default function SupplyChainIllustration() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', maxWidth: 420 }}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        {/* Warehouse */}
        <path d="M70 260 L70 380 L210 380 L210 260" />
        <path d="M60 270 L140 210 L220 270" />
        <path d="M100 380 L100 320 L140 320 L140 380" />
        <path d="M160 340 L195 340 L195 365 L160 365 Z" />

        {/* Route dots + path to truck */}
        <path d="M210 320 C 250 300, 270 340, 310 320" strokeDasharray="2 8" />

        {/* Truck */}
        <path d="M330 340 L330 300 L390 300 L410 320 L410 340 Z" />
        <path d="M390 300 L390 320 L410 320" />
        <circle cx="350" cy="345" r="10" />
        <circle cx="398" cy="345" r="10" />

        {/* Boxes near warehouse */}
        <rect x="230" y="350" width="28" height="28" rx="2" />
        <path d="M230 364 L258 364 M244 350 L244 378" opacity="0.6" />

        {/* Package node with route lines, upper area */}
        <circle cx="330" cy="120" r="7" />
        <circle cx="230" cy="90" r="5" />
        <circle cx="410" cy="150" r="5" />
        <circle cx="150" cy="140" r="5" />
        <path d="M330 120 L230 90 M330 120 L410 150 M330 120 L150 140" strokeDasharray="2 7" opacity="0.7" />

        {/* Chart/trend accent */}
        <path d="M300 460 L320 420 L345 440 L375 390 L400 405" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
