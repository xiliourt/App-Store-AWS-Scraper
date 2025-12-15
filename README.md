Scrapes iOS pricing data and converts currency. Scraping is done via a lambda function so it's all one call. Note this uses ~30s @ 3GB of RAM. I recommend not enabling billing.

In theory this could be an app route, but Vercel (and I assume Cloudflare) limit that to 50 URL calls. I'll make a version for that which pages things when I can be bothered, as Vercel caches these calls automatically then.

# Files
- Scraper.zip - The Lambda code, including node modules (ready for direct zip upload).
  - Configure ~3GB of RAM so it has 2CPUs
  - Configure an endpoint in Configuration > Function URL

- Rest of files
  - Vite frontend deployment. 
  - Clone the repo, remove Scraper.zip, and deploy to Vercel / Cloudflare pages / etc
  - Set VITE_LAMBDA_URL environment variable to your Lambda function URL with the trailing / at the end.
 
Enter app id as just the id, ie https://apps.apple.com/us/app/google-gemini/id6477489729 = 6477489729
