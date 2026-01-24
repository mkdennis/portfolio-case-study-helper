import type {
  ProjectMetadata,
  TimelineItem,
  JournalEntry,
  AssetMetadata,
} from "@/types";
import { format } from "date-fns";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function renderJournalEntry(entry: JournalEntry): string {
  const parts: string[] = [];

  parts.push(`<div class="entry">`);
  parts.push(
    `<h3>${format(new Date(entry.date), "MMMM d, yyyy")}</h3>`
  );

  if (entry.content.text) {
    parts.push(`<p>${escapeHtml(entry.content.text)}</p>`);
  }

  if (entry.content.decision) {
    parts.push(
      `<blockquote><strong>Decision:</strong> ${escapeHtml(entry.content.decision)}</blockquote>`
    );
  }

  if (entry.content.why) {
    parts.push(`<p><em>Why:</em> ${escapeHtml(entry.content.why)}</p>`);
  }

  if (entry.content.milestone) {
    parts.push(
      `<p><strong>Milestone:</strong> ${escapeHtml(entry.content.milestone)}</p>`
    );
  }

  if (entry.content.tradeoff) {
    parts.push(
      `<p><strong>Tradeoff:</strong> ${escapeHtml(entry.content.tradeoff)}</p>`
    );
  }

  if (entry.tags.length > 0) {
    parts.push(
      `<div class="tags">${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    );
  }

  parts.push(`</div>`);

  return parts.join("\n");
}

function renderAsset(asset: AssetMetadata & { url: string }): string {
  return `
    <figure>
      <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.altText || asset.filename)}" />
      <figcaption>${escapeHtml(asset.altText || asset.filename)} <span class="tag">${escapeHtml(asset.role)}</span></figcaption>
    </figure>
  `;
}

export function generateCaseStudyHTML(
  project: ProjectMetadata,
  items: TimelineItem[]
): string {
  const sections: string[] = [];

  // Title section
  const endDate = project.timeframe.end
    ? format(new Date(project.timeframe.end), "MMMM yyyy")
    : "Present";

  sections.push(`
    <header class="section">
      <h1>${escapeHtml(project.name)}</h1>
      <p class="meta">${escapeHtml(project.role)} | ${format(new Date(project.timeframe.start), "MMMM yyyy")} - ${endDate}</p>
    </header>
  `);

  // Problem statement
  sections.push(`
    <section class="section">
      <h2>The Challenge</h2>
      <p>${escapeHtml(project.problemSpace)}</p>
    </section>
  `);

  // Constraints (if any)
  const hasConstraints =
    project.constraints.team ||
    project.constraints.timeline ||
    project.constraints.scope ||
    project.constraints.technical;

  if (hasConstraints) {
    const constraintItems: string[] = [];
    if (project.constraints.team) {
      constraintItems.push(
        `<li><strong>Team:</strong> ${escapeHtml(project.constraints.team)}</li>`
      );
    }
    if (project.constraints.timeline) {
      constraintItems.push(
        `<li><strong>Timeline:</strong> ${escapeHtml(project.constraints.timeline)}</li>`
      );
    }
    if (project.constraints.scope) {
      constraintItems.push(
        `<li><strong>Scope:</strong> ${escapeHtml(project.constraints.scope)}</li>`
      );
    }
    if (project.constraints.technical) {
      constraintItems.push(
        `<li><strong>Technical:</strong> ${escapeHtml(project.constraints.technical)}</li>`
      );
    }

    sections.push(`
      <section class="section">
        <h2>Constraints</h2>
        <ul>
          ${constraintItems.join("\n          ")}
        </ul>
      </section>
    `);
  }

  // Process section from selected items
  if (items.length > 0) {
    sections.push(`<section class="section"><h2>The Process</h2>`);

    for (const item of items) {
      if (item.type === "journal") {
        sections.push(renderJournalEntry(item.data));
      } else {
        sections.push(renderAsset(item.data));
      }
    }

    sections.push(`</section>`);
  }

  return sections.join("\n");
}

export function generateFullHTMLDocument(
  htmlContent: string,
  projectName: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)} - Case Study</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #1a1a1a;
      background: #fff;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    h2 {
      font-size: 1.75rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #333;
      font-weight: 600;
    }
    h3 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    p {
      margin: 0.75rem 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1rem 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .meta {
      color: #666;
      font-size: 1rem;
      margin-bottom: 2rem;
    }
    .tag {
      display: inline-block;
      background: #f0f0f0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.5rem;
      font-size: 0.75rem;
      color: #555;
    }
    .tags {
      margin-top: 0.75rem;
    }
    blockquote {
      border-left: 3px solid #e0e0e0;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #555;
      font-style: italic;
    }
    blockquote strong {
      font-style: normal;
    }
    .section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #eee;
    }
    .section:last-child {
      border-bottom: none;
    }
    .entry {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #fafafa;
      border-radius: 8px;
    }
    .entry h3 {
      margin-top: 0;
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
    }
    figure {
      margin: 1.5rem 0;
    }
    figcaption {
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.5rem;
    }
    ul {
      padding-left: 1.5rem;
    }
    li {
      margin: 0.5rem 0;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}
