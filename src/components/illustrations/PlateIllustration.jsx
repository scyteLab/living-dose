/**
 * A plate seen from above: rice, stew, greens and fish.
 * Decorative stand-in until real food photography is ready.
 */
export default function PlateIllustration({ size = 132, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      {/* plate */}
      <circle cx="80" cy="80" r="74" fill="#ffffff" stroke="#e6e1d6" strokeWidth="2" />
      <circle cx="80" cy="80" r="58" fill="#f6f2e9" />

      {/* ofada rice */}
      <path d="M40 82c-4-20 12-38 32-38 16 0 26 10 26 22 0 18-16 32-34 32-12 0-22-6-24-16z" fill="#efe4c8" />
      <g fill="#d9c79f">
        <ellipse cx="54" cy="70" rx="3" ry="1.6" transform="rotate(-30 54 70)" />
        <ellipse cx="66" cy="60" rx="3" ry="1.6" transform="rotate(20 66 60)" />
        <ellipse cx="62" cy="84" rx="3" ry="1.6" transform="rotate(-10 62 84)" />
        <ellipse cx="78" cy="74" rx="3" ry="1.6" transform="rotate(40 78 74)" />
        <ellipse cx="50" cy="90" rx="3" ry="1.6" transform="rotate(15 50 90)" />
        <ellipse cx="74" cy="92" rx="3" ry="1.6" transform="rotate(-35 74 92)" />
      </g>

      {/* vegetable stew */}
      <path d="M88 52c14-4 30 6 30 22 0 12-10 18-22 16-12-2-18-12-16-22 1-8 3-14 8-16z" fill="#d8572a" />
      <circle cx="98" cy="66" r="4" fill="#f08a4b" />
      <circle cx="108" cy="76" r="3" fill="#f08a4b" />
      <circle cx="94" cy="80" r="3.5" fill="#6f9a37" />

      {/* greens */}
      <path d="M76 110c2-12 16-18 28-12-2 12-16 18-28 12z" fill="#7caf42" />
      <path d="M92 118c6-10 20-10 26-2-6 10-20 10-26 2z" fill="#5f9130" />
      <path d="M66 114c-2-8 6-14 14-12 0 8-8 14-14 12z" fill="#94c25d" />

      {/* grilled fish */}
      <path d="M104 96c8-8 22-8 26 0-4 8-18 8-26 0z" fill="#b8753e" />
      <path d="M130 96l8-5v10z" fill="#b8753e" />
      <path d="M110 94l4 4M116 93l4 5M122 94l3 4" stroke="#8a5025" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
