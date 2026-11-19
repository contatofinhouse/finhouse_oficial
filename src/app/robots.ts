import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/login"],
      },
    ],
    sitemap: "https://www.finhouse.com.br/sitemap.xml",
    host: "https://www.finhouse.com.br",
  };
}
