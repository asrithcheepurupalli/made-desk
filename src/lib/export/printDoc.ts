/**
 * Client-side branded print & PDF exporter for made. by ac action plans and SOPs.
 */
export function exportActionPlanPDF(params: {
  title: string;
  query: string;
  content: string;
  citedSources?: Array<{ title: string; url: string; type: string }>;
}) {
  const { title, query, content, citedSources = [] } = params;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the PDF document.");
    return;
  }

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Convert markdown to clean printable HTML
  const lines = content.split("\n");
  let bodyHtml = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      bodyHtml += `<h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 6px; letter-spacing: 0.05em; color: #16130f;">${trimmed.replace("### ", "")}</h3>`;
    } else if (trimmed.startsWith("## ")) {
      bodyHtml += `<h2 style="font-size: 16px; font-family: 'Georgia', serif; font-weight: bold; margin-top: 24px; margin-bottom: 8px; color: #16130f; border-bottom: 1px solid #16130f; padding-bottom: 4px;">${trimmed.replace("## ", "")}</h2>`;
    } else if (trimmed.startsWith("# ")) {
      bodyHtml += `<h1 style="font-size: 20px; font-family: 'Georgia', serif; font-weight: bold; margin-top: 28px; margin-bottom: 10px; color: #16130f;">${trimmed.replace("# ", "")}</h1>`;
    } else if (trimmed.match(/^(\d+\.|\*|\-|\›)\s+/)) {
      const itemText = trimmed.replace(/^(\d+\.|\*|\-|\›)\s+/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      bodyHtml += `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 13px; line-height: 1.5;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #16130f; margin-top: 2px; flex-shrink: 0;"></span>
          <span>${itemText}</span>
        </div>`;
    } else if (trimmed.length > 0) {
      const pText = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      bodyHtml += `<p style="font-size: 13px; line-height: 1.6; margin-bottom: 10px; color: #16130f;">${pText}</p>`;
    }
  }

  const sourcesHtml = citedSources.length > 0
    ? `
      <div style="margin-top: 30px; padding-top: 16px; border-top: 2px solid #16130f;">
        <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold; color: #7c7770; margin-bottom: 8px;">CITED STUDIO SOPs & KNOWLEDGE</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${citedSources.map((s) => `<span style="font-family: monospace; font-size: 11px; padding: 3px 8px; border: 1px solid #16130f; background: #f6f3ee;">• ${s.title}</span>`).join("")}
        </div>
      </div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} — made. by ac</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #16130f;
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 3px solid #16130f;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .wordmark {
            font-family: 'Georgia', serif;
            font-style: italic;
            font-weight: 600;
            font-size: 32px;
            letter-spacing: -0.04em;
            color: #16130f;
          }
          .dot {
            font-style: normal;
            color: #c8102e;
          }
          .badge {
            font-family: monospace;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            padding: 3px 8px;
            border: 1px solid #16130f;
            background: #f6f3ee;
          }
          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #ddd5c8;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: monospace;
            font-size: 10px;
            color: #7c7770;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="wordmark">made<span class="dot">.</span></div>
            <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: bold; color: #7c7770; margin-top: 4px;">STUDIO OPERATIONAL ACTION PLAN</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">CONFIDENTIAL / INTERNAL</span>
            <div style="font-family: monospace; font-size: 11px; color: #7c7770; margin-top: 6px;">${formattedDate}</div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h1 style="font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #16130f;">${title}</h1>
          <div style="font-family: monospace; font-size: 11px; color: #7c7770;">Query: "${query}"</div>
        </div>

        <div class="content">
          ${bodyHtml}
        </div>

        ${sourcesHtml}

        <div class="footer">
          <span>made. desk · desk.made-by-ac.com</span>
          <span>Verified Grounded Intelligence · Zero Fluff</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
