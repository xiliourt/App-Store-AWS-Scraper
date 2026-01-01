## Apple App Store Price Scraper - Lambda Edition
- Uses a lambda function to scrape every app store country prices (top ~10 products available only)
  - Limited by what the website displays - there's no public API for this. 

## Deployment
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxiliourt%2FApp-Store-AWS-Scraper)

Once deployed with Vercel, follow instructions to deploy the Lambda Function and enter the URL.

**NOTE:** I strongly recommend again setting a Lambda environment variable on a public facing URL - enter it manually upon load instead. If behind authentication of some sort, likely not an issue (in theory could be deployed to Cloudflare with ZeroTrust access).

### Requirements
- Requires an AWS account (free tier works with plenty for personal use)
  - Recommended to use a single-use card for setup (the $0 payment will destroy the card, so no billing is enabled)
- Requires a Vercel account (hobby (free) plan works), or use the example link (it's live and works)
