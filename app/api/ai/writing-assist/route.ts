import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { WorkingDocumentSection, AISuggestion } from "@/types";
import { WORKING_DOCUMENT_SECTION_LABELS, WORKING_DOCUMENT_SECTION_PROMPTS } from "@/types";

interface WritingAssistRequest {
  section: WorkingDocumentSection;
  currentContent: string;
  relatedEntries: Array<{
    date: string;
    tags: string[];
    content: string;
  }>;
  relatedAssets: Array<{
    filename: string;
    altText: string;
    role: string;
  }>;
  projectName: string;
  problemSpace: string;
}

const CASE_STUDY_EXAMPLES = `
Here are excerpts from well-written design case studies for reference:

1. Problem Statement example:
"Users were abandoning the checkout flow at a rate of 67%. Through user research, we discovered that the primary friction point was the complex address entry form, which required users to fill out 12 separate fields across multiple screens."

2. Research & Discovery example:
"We conducted 15 user interviews with small business owners and shadowed 5 participants during their daily workflows. Key insights emerged around time constraints—most users had less than 5 minutes to complete the task. We also analyzed 3 months of support tickets, revealing that 40% of issues stemmed from confusion about pricing tiers."

3. Design Process example:
"I started with rapid sketching sessions, exploring 20+ concepts before narrowing down to 3 directions. These were tested with 8 participants using paper prototypes. The winning concept balanced simplicity with the flexibility that power users needed."

4. Results & Impact example:
"After launching to 10% of users in an A/B test, we saw a 23% increase in task completion rate and a 35% reduction in support tickets related to this flow. User satisfaction scores improved from 3.2 to 4.1 out of 5."
`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock suggestions if no API key is configured
      return NextResponse.json(getMockSuggestions(await request.json()));
    }

    const body = (await request.json()) as WritingAssistRequest;
    const {
      section,
      currentContent,
      relatedEntries,
      relatedAssets,
      projectName,
      problemSpace,
    } = body;

    const sectionLabel = WORKING_DOCUMENT_SECTION_LABELS[section];
    const sectionPrompt = WORKING_DOCUMENT_SECTION_PROMPTS[section];

    // Build context from related entries
    const entriesContext = relatedEntries.length > 0
      ? relatedEntries.map((e) => `[${e.date}] ${e.tags.join(", ")}: ${e.content}`).join("\n\n")
      : "No journal entries yet.";

    const assetsContext = relatedAssets.length > 0
      ? relatedAssets.map((a) => `- ${a.filename}: ${a.altText || "No description"} (${a.role})`).join("\n")
      : "No assets yet.";

    const prompt = `You are helping a designer write the "${sectionLabel}" section of their portfolio case study for a project called "${projectName}".

Project context: ${problemSpace}

The designer's guiding question for this section is: "${sectionPrompt}"

Here is what they've written so far:
${currentContent || "(Nothing written yet)"}

Here are their related journal entries and notes:
${entriesContext}

Related images/assets:
${assetsContext}

${CASE_STUDY_EXAMPLES}

Based on the journal entries and the quality standards shown in the examples above, please provide:

1. 2-3 thought-provoking questions that would help the designer think more deeply about this section. These should be specific to their project and notes, not generic.

2. 2-3 concrete suggestions for content they could add, based on information from their journal entries. Each suggestion should:
   - Be 1-2 sentences that could be directly added to their case study
   - Reference specific details from their notes
   - Match the professional tone of the example case studies
   - Include the journal entry date as a source reference

Respond in this exact JSON format:
{
  "questions": ["question 1", "question 2", "question 3"],
  "suggestions": [
    {"content": "suggested text", "source": "2024-01-15 journal entry"},
    {"content": "suggested text", "source": "2024-01-16 journal entry"}
  ]
}`;

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      questions: string[];
      suggestions: Array<{ content: string; source: string }>;
    };

    // Format suggestions with IDs
    const suggestions: AISuggestion[] = parsed.suggestions.map((s, i) => ({
      id: `suggestion-${Date.now()}-${i}`,
      type: "reference" as const,
      content: s.content,
      source: s.source,
    }));

    return NextResponse.json({
      questions: parsed.questions,
      suggestions,
    });
  } catch (error) {
    console.error("Error in AI writing assist:", error);

    // Return mock suggestions on error
    try {
      const body = await request.json();
      return NextResponse.json(getMockSuggestions(body));
    } catch {
      return NextResponse.json(
        { error: "Failed to generate suggestions" },
        { status: 500 }
      );
    }
  }
}

// Fallback mock suggestions when API is not available
function getMockSuggestions(body: WritingAssistRequest) {
  const { section, relatedEntries, currentContent } = body;
  const sectionLabel = WORKING_DOCUMENT_SECTION_LABELS[section];

  const questions: string[] = [];
  const suggestions: AISuggestion[] = [];

  // Generate questions based on section
  switch (section) {
    case "overview":
      questions.push(
        "What makes this project unique compared to similar products in the market?",
        "Who is the primary user persona you're designing for?",
        "What was your role and level of ownership on this project?"
      );
      break;
    case "problem":
      questions.push(
        "What specific metrics or user feedback indicated this was a problem worth solving?",
        "How was this problem impacting the business or user experience?",
        "What were the constraints or limitations you had to work within?"
      );
      break;
    case "research":
      questions.push(
        "What research methods did you use and why?",
        "What was the most surprising insight from your research?",
        "How did you validate your assumptions?"
      );
      break;
    case "process":
      questions.push(
        "What design principles guided your decisions?",
        "How did you collaborate with other team members?",
        "What tools or methods helped you explore different solutions?"
      );
      break;
    case "iterations":
      questions.push(
        "What feedback led to the biggest changes in your design?",
        "How did you decide which iteration to move forward with?",
        "What did you learn from testing each iteration?"
      );
      break;
    case "results":
      questions.push(
        "What metrics did you use to measure success?",
        "How did the results compare to your initial goals?",
        "What qualitative feedback did you receive from users?"
      );
      break;
    case "reflection":
      questions.push(
        "What would you do differently if you started this project today?",
        "What skills did you develop through this project?",
        "How has this project influenced your design approach?"
      );
      break;
  }

  // Generate suggestions from related entries
  if (relatedEntries.length > 0) {
    relatedEntries.slice(0, 2).forEach((entry, i) => {
      if (entry.content) {
        // Extract a sentence from the entry content
        const sentences = entry.content.split(/[.!?]+/).filter(Boolean);
        if (sentences.length > 0) {
          suggestions.push({
            id: `suggestion-${Date.now()}-${i}`,
            type: "reference",
            content: sentences[0].trim() + ".",
            source: `${entry.date} journal entry`,
          });
        }
      }
    });
  }

  // Add a generic suggestion if no entries
  if (suggestions.length === 0 && !currentContent) {
    suggestions.push({
      id: `suggestion-${Date.now()}-generic`,
      type: "suggestion",
      content: `Start by describing the context and background for the ${sectionLabel.toLowerCase()} section.`,
    });
  }

  return { questions, suggestions };
}
