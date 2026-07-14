import type { SVGProps } from "react";

/**
 * Inline SVG brand mark (a stylised up-trend). Kept as a typed React
 * component so it needs no SVG loader configuration and can be tree-shaken.
 */
export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 17l5-5 4 4 9-9" />
      <path d="M21 7v6h-6" />
    </svg>
  );
}
