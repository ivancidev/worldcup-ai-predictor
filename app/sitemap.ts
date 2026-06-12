import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/auth`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/groups`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/bracket`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
