# yellowsheet

A Cloudflare Worker that screenshots [teamupnc.org/yellow](https://teamupnc.org/yellow) as a PDF each morning and serves it on demand.

## How it works

- **Scheduled**: Runs daily at 8AM EST via a cron trigger
- Uses Cloudflare Browser Rendering (Puppeteer) to capture the page as a landscape PDF
- Stores the PDF in an R2 bucket (`teamupnc`)
- **On request**: Serves the stored PDF; supports `/?generate` to trigger a manual run

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure Cloudflare resources in `wrangler.toml`:
   - R2 bucket: `teamupnc`
   - Browser binding

3. Deploy:
   ```
   npm run deploy
   ```

## Manual trigger

Visit `/?generate` on the worker URL to generate the PDF immediately (useful for testing).
