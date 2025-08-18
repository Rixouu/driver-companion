# Deployment Guide

This guide provides instructions for deploying the Vehicle Inspection System.

## 1. Prerequisites

Before deploying, ensure you have the following:

- **Node.js**: Specify required version (e.g., >=18.x.x)
- **npm/yarn/pnpm**: Specify preferred package manager and version.
- **Vercel Account**: If deploying to Vercel, an account with appropriate permissions.
- **Supabase Project**: A configured Supabase project with the necessary schema and data.
  - Ensure you have the Supabase Project URL and `anon` key, and `service_role` key if used by the application during build or runtime for specific tasks.
- **Git Repository**: The application code hosted in a Git repository (e.g., GitHub, GitLab, Bitbucket) connected to your Vercel project.
- **Environment Variables**: All necessary environment variables (see section below) must be obtained and ready.

## 2. Environment Variables

The application requires the following environment variables to be set in the deployment environment (e.g., Vercel project settings):

`NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
`NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anon key.
`SUPABASE_SERVICE_ROLE_KEY`: Your Supabase project service role key (if used for admin tasks or specific backend operations).

`SENTRY_DSN`: (If Sentry is used) Your Sentry DSN for error and performance monitoring.
`SENTRY_AUTH_TOKEN`: (If Sentry is used for releases) Your Sentry auth token for uploading sourcemaps.
`SENTRY_ORG`: (If Sentry is used) Your Sentry organization slug.
`SENTRY_PROJECT`: (If Sentry is used) Your Sentry project slug.

`NEXT_PUBLIC_APP_URL`: The public URL of your deployed application (e.g., `https://your-app.vercel.app`). Used for various purposes like absolute URLs in emails, OAuth redirects, etc.

_Add any other environment variables required by the application, for example, API keys for third-party services, database connection strings (if not using Supabase directly for everything), etc._

**Note**: Ensure that `NEXT_PUBLIC_` prefixed variables are safe to be exposed to the client-side. Other variables will only be available server-side.

## 3. Build Process

The Next.js application is typically built automatically by the deployment platform (e.g., Vercel) when changes are pushed to the connected Git repository branch.

The standard build command (usually found in `package.json` scripts) is:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

This command compiles the TypeScript code, bundles assets, and prepares the application for production.

## 4. Deployment Steps

### 4.1. Deploying to Vercel (Recommended)

1.  **Connect Git Repository**: If not already done, connect your Git repository (GitHub, GitLab, Bitbucket) to your Vercel account and import the project.
2.  **Configure Project**: 
    -   Framework Preset: Should be automatically detected as Next.js.
    -   Build & Development Settings: Usually, default settings are fine. Ensure the correct package manager and Root Directory are set.
    -   Environment Variables: Add all the required environment variables listed in Section 2 to your Vercel project settings.
3.  **Trigger Deployment**:
    -   Deployments are typically triggered automatically when you push changes to the configured production branch (e.g., `main` or `master`).
    -   You can also trigger manual deployments from the Vercel dashboard for specific commits or branches.
4.  **Assign Domain**: Once deployed, assign your custom domain (if any) through the Vercel dashboard.

### 4.2. Manual Deployment (General Steps - Adapt as needed)

If deploying to a different platform or managing your own server:

1.  **Build Locally (or on a CI server)**: 
    ```bash
    npm run build
    ```
2.  **Package Artifacts**: The build output will typically be in the `.next` directory, along with `public` and `package.json`, `node_modules` (or a lockfile to install them on the server).
3.  **Transfer Files**: Copy the necessary build artifacts to your server.
4.  **Install Dependencies**: On the server, if you didn't copy `node_modules`, install production dependencies:
    ```bash
    npm install --omit=dev 
    # or yarn install --production
    ```
5.  **Set Environment Variables**: Ensure all required environment variables are set on the server.
6.  **Start Application**: Run the Next.js production server:
    ```bash
    npm run start
    # or yarn start
    ```
    This typically runs `next start`. You might want to use a process manager like PM2 to keep the application running.

## 5. Post-Deployment Checks

After a successful deployment, perform the following checks:

-   Access the application using its public URL.
-   Test core functionalities (e.g., login, viewing inspections, creating data).
-   Check browser console for any errors.
-   Verify that environment variables are correctly loaded (e.g., by checking features that depend on them, but avoid exposing sensitive variables directly).
-   If using Sentry, check if new releases are being tracked and errors are reported correctly.
-   Test on different devices and browsers.

## 6. Rollback Procedures (Vercel Example)

Vercel makes rollbacks straightforward:

1.  Go to your project on the Vercel dashboard.
2.  Navigate to the "Deployments" tab.
3.  Find the previous successful deployment you want to roll back to.
4.  Click the "..." (more options) menu for that deployment and select "Redeploy". Alternatively, you can often promote an older deployment to "Current".

For manual deployments, rollback procedures will depend on your specific setup. It might involve:
-   Reverting to a previous Git commit and redeploying.
-   Keeping backups of previous build artifacts and restoring them.

---

_This document should be kept up-to-date with any changes to the deployment process or required environment variables._ 