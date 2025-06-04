# Troubleshooting Guide

This guide provides solutions to common problems encountered with the Vehicle Inspection System.

## Table of Contents

1.  [General Troubleshooting Steps](#1-general-troubleshooting-steps)
2.  [Build & Deployment Issues](#2-build--deployment-issues)
3.  [Authentication Problems](#3-authentication-problems)
4.  [Supabase & Database Issues](#4-supabase--database-issues)
5.  [Application Feature Issues](#5-application-feature-issues)
6.  [Performance Problems](#6-performance-problems)
7.  [Gathering Debug Information](#7-gathering-debug-information)

---

## 1. General Troubleshooting Steps

Before diving into specific issues, try these general steps:

-   **Clear Browser Cache and Cookies**: Sometimes, outdated cached data can cause unexpected behavior.
-   **Try a Different Browser/Incognito Mode**: This helps determine if the issue is browser-specific or related to extensions.
-   **Check Internet Connection**: Ensure you have a stable internet connection.
-   **Check Browser Console**: Open your browser's developer tools (usually by pressing F12) and look for errors in the Console tab.
-   **Check Network Tab**: The Network tab in developer tools can show failed API requests or other network-related problems.
-   **Restart the Application/Server**: If running locally, try restarting the Next.js development server.

---

## 2. Build & Deployment Issues

### 2.1. Issue: Build Fails with Type Errors

-   **Symptom**: The `npm run build` command fails, reporting TypeScript errors.
-   **Possible Causes**:
    -   Incorrect types in the code.
    -   Mismatched versions of libraries or type definitions (`@types/...`).
    -   Environment-specific code not correctly handled.
-   **Solution**:
    -   Carefully review the TypeScript error messages. They usually point to the exact file and line number.
    -   Ensure all dependencies (and their types) are correctly installed and up-to-date (`npm install` or `npm update`).
    -   If `tsconfig.json` has `noImplicitAny` or `strictNullChecks` enabled, ensure all code adheres to these rules.
    -   Check for any recent code changes that might have introduced type inconsistencies.

### 2.2. Issue: Deployment Fails on Vercel (or other platform)

-   **Symptom**: Deployment process fails on the hosting platform.
-   **Possible Causes**:
    -   Missing or incorrect environment variables (see `docs/deployment-guide.md`).
    -   Build command failing (see 2.1).
    -   Platform-specific configuration issues.
    -   Out-of-memory errors during the build process.
-   **Solution**:
    -   Check the deployment logs on Vercel (or your platform) for detailed error messages.
    -   Verify all required environment variables are correctly set for the production environment.
    -   Ensure the build command specified in Vercel settings (e.g., `npm run build`) is correct and works locally.
    -   If it's an out-of-memory error, you might need to optimize your build or upgrade your plan on the hosting platform.

---

## 3. Authentication Problems

### 3.1. Issue: Unable to Log In

-   **Symptom**: Users cannot log in; login attempts fail or redirect incorrectly.
-   **Possible Causes**:
    -   Incorrect Supabase URL or Anon Key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    -   Supabase Auth settings misconfigured (e.g., redirect URLs, providers).
    -   Issues with third-party OAuth providers (if used).
    -   Client-side clock skewed significantly.
-   **Solution**:
    -   Verify Supabase URL and Anon Key environment variables are correct in your deployment environment and locally.
    -   Check Supabase dashboard under Auth > URL Configuration for correct Site URL and Redirect URLs (e.g., `http://localhost:3000/**` for local, `YOUR_APP_URL/**` for production).
    -   Check Supabase Auth provider settings if using social logins.
    -   Ensure your system's clock is synchronized.
    -   Check browser console and network tab for specific error messages during login.

### 3.2. Issue: Users are Unexpectedly Logged Out

-   **Symptom**: Users are logged out frequently or session is not persisted.
-   **Possible Causes**:
    -   Issues with Supabase token refresh mechanism.
    -   Cookie handling problems (ensure SameSite, Secure attributes are set correctly for production).
    -   Short session lifetimes configured in Supabase Auth.
-   **Solution**:
    -   Review Supabase session management. The `@supabase/ssr` library handles token refresh for server components and API routes.
    -   Check cookie settings in `lib/supabase/server.ts` or `auth.ts` if using NextAuth.js with Supabase adapter.
    -   Check Supabase Auth settings for session duration.

---

## 4. Supabase & Database Issues

### 4.1. Issue: Data Not Loading / API Requests Failing

-   **Symptom**: Pages show loading spinners indefinitely, or API calls return errors (e.g., 401, 403, 500).
-   **Possible Causes**:
    -   Incorrect Supabase URL or Anon Key.
    -   Row Level Security (RLS) policies in Supabase are blocking access.
    -   Database errors (e.g., query syntax, constraint violations).
    -   Network connectivity issues to Supabase.
    -   Service role key (`SUPABASE_SERVICE_ROLE_KEY`) missing or incorrect for backend operations that require it.
-   **Solution**:
    -   Verify Supabase environment variables.
    -   Check RLS policies on your Supabase tables. Ensure policies allow the intended operations for authenticated (and unauthenticated, if applicable) users.
    -   Test Supabase queries directly in the Supabase SQL Editor or using a local client to isolate database issues.
    -   Check the Network tab in browser dev tools for the exact error response from API calls.
    -   Review server-side logs (Vercel Functions logs) for errors related to Supabase client initialization or queries.

### 4.2. Issue: Realtime Updates Not Working

-   **Symptom**: Changes made by one user are not reflected in real-time for other users.
-   **Possible Causes**:
    -   Supabase Realtime not enabled for the relevant tables.
    -   RLS policies blocking realtime updates.
    -   Client-side code not correctly subscribing to realtime channels or events.
    -   Network issues (WebSockets might be blocked by firewalls/proxies).
-   **Solution**:
    -   In Supabase dashboard, go to Database > Replication and ensure replication is enabled for the tables you want realtime updates from.
    -   Ensure RLS policies for `SELECT` allow subscribed users to see the data.
    -   Review client-side code that sets up realtime subscriptions. Check for errors in the console.
    -   Test WebSocket connectivity.

---

## 5. Application Feature Issues

_(This section should be populated with common issues related to specific features of the Vehicle Inspection app as they are identified.)_ 

### Example: 5.1. Issue: Cannot Upload Inspection Photos

-   **Symptom**: Users see an error when trying to upload photos for an inspection item.
-   **Possible Causes**:
    -   Supabase Storage RLS policies misconfigured for the photo bucket.
    -   File size limits exceeded.
    -   Incorrect file types being uploaded.
-   **Solution**:
    -   Check Supabase Storage bucket policies.
    -   Verify client-side validation for file size and type.
    -   Check server-side logs for errors during the upload process.

---

## 6. Performance Problems

### 6.1. Issue: Application is Slow to Load

-   **Symptom**: Initial page loads are very slow, or navigating between pages is sluggish.
-   **Possible Causes**:
    -   Large bundle sizes (JavaScript, CSS).
    -   Unoptimized images.
    -   Inefficient data fetching (fetching too much data, waterfall requests).
    -   Slow API responses.
    -   Lack of caching.
-   **Solution**:
    -   Use tools like `@next/bundle-analyzer` to inspect bundle sizes and identify large dependencies.
    -   Ensure images are optimized using `next/image` and appropriate formats (e.g., WebP).
    -   Review data fetching patterns. Use React Server Components where possible. For client-side fetching, use libraries like React Query or SWR for caching and optimized fetching.
    -   Optimize database queries and API endpoint logic.
    -   Implement server-side rendering (SSR) or static site generation (SSG) for relevant pages.
    -   Check Vercel Analytics or Sentry Performance for bottlenecks.

---

## 7. Gathering Debug Information

When reporting an issue, providing detailed debug information is crucial.

-   **Screenshots/Videos**: Capture the issue as it happens.
-   **Browser Console Logs**: Copy any errors or relevant logs from the browser's developer console.
-   **Network Requests**: Note any failed network requests in the Network tab, including their status code and response.
-   **Steps to Reproduce**: Clearly list the steps taken to encounter the issue.
-   **Environment Details**: Browser version, OS, device type.
-   **Sentry Error ID**: If an error is captured by Sentry, provide the Sentry event ID.
-   **User Account**: If the issue is user-specific, provide the email or ID of the affected user (if safe to do so).

---

_This guide is a living document. Please update it with new issues and solutions as they are discovered._ 