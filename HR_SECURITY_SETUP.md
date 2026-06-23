# Dash K Express HR Security Setup

The HR console now uses Netlify Functions for server-side session checks.

## Required Netlify Environment Variables

Set these in Netlify:

- `HR_ACCESS_CODE`
  - The private code used to unlock the HR console.
  - Use a long value that is not reused anywhere else.
- `HR_SESSION_SECRET`
  - A long random secret used to sign the HR session cookie.
  - Use at least 32 random characters.

## Netlify Steps

1. Open the Dash K Express site in Netlify.
2. Go to Site configuration.
3. Open Environment variables.
4. Add `HR_ACCESS_CODE`.
5. Add `HR_SESSION_SECRET`.
6. Trigger a redeploy.
7. Open `https://www.dashkexpress.com/hr.html`.
8. Enter the HR access code.

## What Is Protected

- HR login is checked by `/api/hr-login`.
- HR session is stored in a signed HttpOnly cookie.
- Applicant summary submission is protected by `/api/hr-applicant`.
- Logout clears the session through `/api/hr-logout`.

## Important Limits

This protects the HR workflow and server endpoints. Do not store real SSNs, bank details, driver licenses, identity documents, or background check reports in the static site. Use a secure provider for documents, tax forms, background checks, and payouts.
