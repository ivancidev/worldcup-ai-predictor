import Image from "next/image";

interface FlagImageProps {
  src: string;
  alt?: string;
  className?: string;
  title?: string;
  /** Pixel width served from flagcdn.com (used as intrinsic width). Defaults to 40. */
  cdnSize?: number;
}

/**
 * Thin wrapper around Next.js <Image> for flag icons fetched from flagcdn.com.
 * The host is already allow-listed in next.config.ts under `images.remotePatterns`.
 *
 * Why not plain <img>?
 *   - Next.js Image converts PNGs to WebP/AVIF automatically.
 *   - Prevents CLS by reserving space before the image loads.
 *   - Images are lazy-loaded by default.
 *
 * Usage:
 *   <FlagImage src={getFlagUrl(team.flagCode, 20)} alt={team.name} className="w-6 h-4 object-cover rounded-sm" />
 */
export function FlagImage({ src, alt = "", className, title, cdnSize = 40 }: FlagImageProps) {
  // flagcdn.com serves flags at a 4:3 aspect ratio (width × 0.75 = height).
  const intrinsicHeight = Math.round(cdnSize * 0.75);

  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={cdnSize}
      height={intrinsicHeight}
      className={className}
      // These are small decorative images — unoptimized avoids a round-trip
      // through the Next.js image optimiser for tiny PNGs that are already
      // served in a suitable size by flagcdn.com.
      unoptimized
    />
  );
}
