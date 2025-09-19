export const siteConfig = {
  name: "Driver",
  url: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: "",
  description: "Vehicle fleet management system",
  links: {
    github: "https://github.com/Rixouu",
  },
}

export const authConfig = {
  providers: ['google'],
  callbacks: {
    redirectTo: `${siteConfig.url}/auth/callback`,
  },
} 