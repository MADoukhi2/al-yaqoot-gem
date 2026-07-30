/**
 * Al Yaqoot brand logo — navy faceted gemstone with gold accents.
 * Import this instead of copying the SVG inline.
 *
 * Usage:
 *   import { YaqootLogo } from "@/components/YaqootLogo";
 *   <YaqootLogo size={40} />
 */
export function YaqootLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Al Yaqoot"
    >
      {/* Outer hexagonal gem shape */}
      <polygon
        points="20,2 36,12 36,28 20,38 4,28 4,12"
        fill="#0f1e3d"
        stroke="#c9a84c"
        strokeWidth="1.5"
      />
      {/* Top facet */}
      <polygon points="20,2 36,12 20,16 4,12" fill="#1a3060" />
      {/* Left facet */}
      <polygon points="4,12 20,16 4,28" fill="#162a55" />
      {/* Right facet */}
      <polygon points="36,12 20,16 36,28" fill="#0d1e45" />
      {/* Bottom facet */}
      <polygon points="4,28 20,16 36,28 20,38" fill="#1a3060" />
      {/* Centre gold diamond sparkle */}
      <polygon points="20,16 23,20 20,24 17,20" fill="#c9a84c" opacity="0.9" />
      {/* Top glint */}
      <line x1="20" y1="2" x2="20" y2="7" stroke="#e8c96e" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}
