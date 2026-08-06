export default function robots() {
  const baseUrl = "https://resumeanalyzer.muzamal.site";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/signup", "/forgot-password"],
        disallow: ["/dashboard", "/admin", "/api/", "/upload", "/job-match", "/mock-interview", "/history", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
