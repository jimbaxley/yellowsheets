import puppeteer from "@cloudflare/puppeteer";

export default {
  // Runs daily at 8AM EST (13:00 UTC) via cron trigger
  async scheduled(event, env, ctx) {
    const webhookUrl =
      "https://coda.io/apis/v1/docs/OySK5JOQh-/hooks/automation/grid-auto-92m6frzljw";
    const webhookHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CODA_API_TOKEN}`,
    };

    const browser = await puppeteer.launch(env.BROWSER);
    try {
      const page = await browser.newPage();
      await page.goto("https://teamupnc.org/yellow", {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
      const pdf = await page.pdf({
        landscape: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        scale: 0.6,
        pageRanges: "1",
        printBackground: true,
      });
      await env.BUCKET.put("YELLOWSHEET.PDF", pdf, {
        httpMetadata: { contentType: "application/pdf" },
      });
      const timestamp = new Date().toISOString();
      console.log("YELLOWSHEET.PDF saved to R2 at", timestamp);

      await fetch(webhookUrl, {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify({ status: `PDF generated successfully at ${timestamp}` }),
      });
    } catch (err) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify({ status: `PDF generation failed - ${err.message}` }),
      });
      throw err;
    } finally {
      await browser.close();
    }
  },

  // Serves the PDF when the worker URL is visited
  async fetch(request, env, ctx) {
    // Allow manual trigger via /?generate (useful for testing)
    const url = new URL(request.url);
    if (url.searchParams.has("generate")) {
      await this.scheduled(null, env, ctx);
      return new Response("PDF generated successfully.", { status: 200 });
    }

    const object = await env.BUCKET.get("YELLOWSHEET.PDF");
    if (!object) {
      return new Response(
        "PDF not yet generated. Visit /?generate to create it now, or wait for the 8AM scheduled run.",
        { status: 404 }
      );
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="YELLOWSHEET.PDF"');
    return new Response(object.body, { headers });
  },
};
