import type {
  ProjectMetadata,
  TimelineItem,
  JournalEntry,
  AssetMetadata,
  CaseStudySection,
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

function getJournalContent(entry: JournalEntry): string {
  return (
    entry.content.text ||
    entry.content.decision ||
    entry.content.milestone ||
    entry.content.change ||
    entry.content.feedback ||
    ""
  );
}

function generateNarrativeSection(
  sectionName: string,
  items: TimelineItem[],
  sectionIntro: string
): string {
  if (items.length === 0) return "";

  const journalEntries = items.filter((item) => item.type === "journal");
  const assets = items.filter((item) => item.type === "asset");

  const parts: string[] = [];
  parts.push(`<section class="section">`);
  parts.push(`<h2>${escapeHtml(sectionName)}</h2>`);
  parts.push(`<p>${escapeHtml(sectionIntro)}</p>`);

  // Weave journal content into narrative paragraphs
  for (const item of journalEntries) {
    const entry = item.data as JournalEntry;
    const content = getJournalContent(entry);
    if (content) {
      parts.push(`<p>${escapeHtml(content)}</p>`);

      if (entry.content.why) {
        parts.push(`<p>${escapeHtml(entry.content.why)}</p>`);
      }

      if (entry.content.tradeoff) {
        parts.push(
          `<blockquote>${escapeHtml(entry.content.tradeoff)}</blockquote>`
        );
      }
    }
  }

  // Add images with captions
  for (const item of assets) {
    const asset = item.data as AssetMetadata & { url: string };
    parts.push(`
      <figure>
        <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.altText || asset.filename)}" />
        <figcaption>${escapeHtml(asset.altText || asset.filename)}</figcaption>
      </figure>
    `);
  }

  parts.push(`</section>`);
  return parts.join("\n");
}

export function generateCaseStudyHTML(
  project: ProjectMetadata,
  sectionItems: Map<CaseStudySection, TimelineItem[]>
): string {
  const htmlSections: string[] = [];

  // Gather all items for context
  const allItems = Array.from(sectionItems.values()).flat();
  const researchItems = sectionItems.get("research") || [];
  const processItems = sectionItems.get("process") || [];
  const iterationItems = sectionItems.get("iterations") || [];
  const resultsItems = sectionItems.get("final-results") || [];
  const allNotesItems = sectionItems.get("all") || [];

  // Calculate project duration
  const startDate = new Date(project.timeframe.start);
  const endDate = project.timeframe.end
    ? new Date(project.timeframe.end)
    : new Date();
  const durationWeeks = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  const endDateStr = project.timeframe.end
    ? format(new Date(project.timeframe.end), "MMMM yyyy")
    : "Present";

  // Title and Introduction
  htmlSections.push(`
    <header class="hero">
      <h1>${escapeHtml(project.name)}</h1>
      <p class="meta">${escapeHtml(project.role)} &bull; ${format(startDate, "MMMM yyyy")} &ndash; ${endDateStr}</p>
    </header>
  `);

  // Overview / Executive Summary
  htmlSections.push(`
    <section class="section">
      <h2>Overview</h2>
      <p>${escapeHtml(project.problemSpace)}</p>
      <p>Over the course of ${durationWeeks} weeks, I led the design effort to address this challenge, working through research, iteration, and validation to deliver a solution that improved the user experience.</p>
    </section>
  `);

  // Constraints (if any)
  const hasConstraints =
    project.constraints.team ||
    project.constraints.timeline ||
    project.constraints.scope ||
    project.constraints.technical;

  if (hasConstraints) {
    const constraintParts: string[] = [];
    if (project.constraints.team) {
      constraintParts.push(project.constraints.team);
    }
    if (project.constraints.timeline) {
      constraintParts.push(project.constraints.timeline);
    }
    if (project.constraints.scope) {
      constraintParts.push(project.constraints.scope);
    }
    if (project.constraints.technical) {
      constraintParts.push(project.constraints.technical);
    }

    htmlSections.push(`
      <section class="section">
        <h2>Constraints & Context</h2>
        <p>This project came with several important constraints that shaped our approach:</p>
        <ul>
          ${constraintParts.map((c) => `<li>${escapeHtml(c)}</li>`).join("\n          ")}
        </ul>
      </section>
    `);
  }

  // Research section
  if (researchItems.length > 0) {
    htmlSections.push(
      generateNarrativeSection(
        "Research & Discovery",
        researchItems,
        "Understanding the problem space was critical before jumping into solutions. Here's what we learned:"
      )
    );
  }

  // Process section
  if (processItems.length > 0) {
    htmlSections.push(
      generateNarrativeSection(
        "Design Process",
        processItems,
        "With a clearer understanding of the problem, I began exploring potential solutions:"
      )
    );
  }

  // Iterations section
  if (iterationItems.length > 0) {
    htmlSections.push(
      generateNarrativeSection(
        "Iterations & Refinement",
        iterationItems,
        "Design is never linear. Through testing and feedback, we refined our approach:"
      )
    );
  }

  // All notes section (uncategorized)
  if (allNotesItems.length > 0) {
    htmlSections.push(
      generateNarrativeSection(
        "Additional Notes",
        allNotesItems,
        "Other important moments from the project:"
      )
    );
  }

  // Results section
  if (resultsItems.length > 0) {
    htmlSections.push(
      generateNarrativeSection(
        "Results & Impact",
        resultsItems,
        "The final solution delivered measurable improvements:"
      )
    );
  }

  // Reflection / Conclusion
  if (allItems.length > 0) {
    htmlSections.push(`
      <section class="section">
        <h2>Reflection</h2>
        <p>This project reinforced the importance of understanding user needs before committing to solutions. The iterative approach allowed us to validate assumptions early and course-correct when needed.</p>
        <p>Key takeaways from this project include the value of cross-functional collaboration, the importance of testing with real users, and the need to balance ideal solutions with practical constraints.</p>
      </section>
    `);
  }

  return htmlSections.join("\n");
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
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      max-width: 720px;
      margin: 0 auto;
      padding: 3rem 2rem;
      color: #2c2c2c;
      background: #fff;
    }
    .hero {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e0e0e0;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    h2 {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 1.25rem;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: #1a1a1a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    p {
      margin: 1.25rem 0;
      font-size: 1.125rem;
    }
    .meta {
      font-family: system-ui, -apple-system, sans-serif;
      color: #666;
      font-size: 1rem;
      margin-bottom: 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 2rem 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    blockquote {
      border-left: 3px solid #333;
      padding-left: 1.5rem;
      margin: 2rem 0;
      color: #444;
      font-style: italic;
      font-size: 1.125rem;
    }
    .section {
      margin-bottom: 2.5rem;
    }
    figure {
      margin: 2rem 0;
    }
    figcaption {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.75rem;
      text-align: center;
    }
    ul {
      padding-left: 1.5rem;
      font-size: 1.125rem;
    }
    li {
      margin: 0.75rem 0;
    }
    @media (max-width: 600px) {
      body {
        padding: 2rem 1rem;
      }
      h1 {
        font-size: 2rem;
      }
      p, li {
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}
