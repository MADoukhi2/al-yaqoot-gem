/**
 * Al Yaqoot brand logo — served from /logo.png (public/logo.png).
 * To swap the logo, just replace the file in /public — no code change needed.
 *
 * Usage:
 *   import { YaqootLogo } from "@/components/YaqootLogo";
 *   <YaqootLogo size={40} />
 */
export function YaqootLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="Al Yaqoot"
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
