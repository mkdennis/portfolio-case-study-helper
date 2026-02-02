# PRD: Case Study Companion

**Version**: 1.0  
**Last Updated**: February 2025  
**Status**: Active Development  
**Repository**: [github.com/mkdennis/portfolio-case-study-helper](https://github.com/mkdennis/portfolio-case-study-helper)

> **Note**: This document provides a concise overview. For comprehensive details, see [PRD-README.md](PRD-README.md).

---

## Executive Summary

**Case Study Companion** transforms portfolio case study creation from a dreaded last-minute chore into an emergent artifact of ongoing work. Built for experienced product designers, it captures decisions, milestones, and assets during project execution through lightweight journaling, then uses AI to generate polished portfolio case studies and interview presentations on demand.

**Core Innovation**: Designers journal their work in 5-minute daily entries during the project. The app synthesizes these entries into portfolio-ready outputs using Claude AI—eliminating the "blank page problem" when updating portfolios.

**Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, GitHub as file-based database, Claude API

---

## Product Vision & Goals

### Vision
Make portfolio maintenance a natural byproduct of doing great design work—not a separate, painful task done months later.

### Goals
- **Capture context in real-time**: Log decisions, rationale, and assets while fresh
- **Zero blank-page anxiety**: AI generates first drafts from journal entries
- **Maintain designer voice**: AI assists, doesn't ghost-write
- **Generate on-demand**: Create case studies or presentation decks when needed

---

## Target Users

### Primary: Lead/Senior Product Designer
- **Experience**: 5+ years in product design
- **Context**: Working on complex, multi-month projects
- **Pain**: Great work goes undocumented; portfolio updates are panic-inducing
- **Need**: Lightweight capture during busy projects, efficient transformation to polished narratives

### Explicit Non-Users
- Junior designers seeking templates or how-to guides
- Designers happy with existing documentation workflows
- Those wanting AI to write everything for them

---

## Current Features (What's Built)

### 1. Project Management
- **Create Projects**: Initialize new case study projects with metadata
- **Project List View**: Dashboard showing all active and archived projects
- **Project Structure**: File-based organization using GitHub as database
  - Each project stored in `/projects/{project-id}/` directory
  - Markdown-based entries and metadata

### 2. Journal Entry System
- **Daily Entries**: Quick 5-minute logs during project work
- **Entry Types**:
  - **Milestones**: Major project events (kickoff, launch, reviews)
  - **Decisions**: Design decisions with rationale
  - **Insights**: Learnings, surprises, pivots
  - **Assets**: Screenshots, prototypes, deliverables
- **Markdown Editor**: Simple, distraction-free writing interface
- **Auto-timestamping**: Chronological organization of entries

### 3. Asset Management
- **File Upload**: Images, PDFs, Figma links, Loom videos
- **Organization**: Assets linked to specific entries
- **Metadata**: Captions, context notes for each asset

### 4. GitHub Integration
- **File Storage**: All data stored in GitHub repository
- **Version Control**: Full history of edits and changes
- **Privacy**: Private repos for sensitive work
- **Portability**: Plain markdown files, no vendor lock-in

### 5. UI Components (shadcn/ui)
- Form inputs (text, textarea, select, checkbox)
- Buttons and navigation
- Cards and layout containers
- Modal dialogs
- Toast notifications

---

## Planned Features / Roadmap

### Phase 1: Core AI Generation (High Priority)

#### 1. AI Case Study Generator
- **Input**: All journal entries for a project
- **Process**: Claude API synthesizes entries into case study structure
- **Output**: Markdown draft with sections:
  - Project Overview
  - Problem Statement
  - Process & Approach
  - Key Decisions & Rationale
  - Outcomes & Impact
- **Editing**: Full markdown editor for refinement

#### 2. Export Formats
- **Markdown**: Direct download for portfolio sites
- **PDF**: Print-ready format
- **HTML**: Copy-paste for website embedding
- **Presentation Mode**: Slide deck format for interviews

#### 3. Section Templates
- Pre-configured case study structures:
  - "Problem-Solution-Impact" (short form)
  - "Comprehensive Deep Dive" (long form)
  - "Interview Highlight Reel" (talking points)
- Customizable section ordering

#### 4. Smart Prompts
- Context-aware AI prompts based on entry content
- Suggested questions during journaling:
  - "What alternatives did you consider?"
  - "What was the impact on users?"
  - "What would you do differently?"

### Phase 2: Enhanced Journaling (Medium Priority)

#### 5. Quick Capture
- Browser extension for one-click journaling from Figma/web
- Mobile app for voice-to-text entries
- Email-to-journal (forward thoughts directly)

#### 6. Entry Templates
- Quick-start templates for common entry types:
  - User research summary
  - Design critique notes
  - Stakeholder feedback
  - A/B test results

#### 7. Tagging System
- Tag entries with themes: #accessibility, #research, #iteration
- Filter and search by tags
- AI auto-suggests tags based on content

#### 8. Visual Timeline
- Chronological view of project milestones
- Gantt-style chart showing project phases
- Click to jump to relevant entries

### Phase 3: Collaboration & Sharing (Future)

#### 9. Team Projects
- Invite collaborators (PMs, researchers, engineers)
- Multi-author entries with attribution
- Role-based permissions

#### 10. Feedback Integration
- Share draft case studies for feedback
- Comment threads on specific sections
- Version comparison

#### 11. Portfolio Hosting
- Built-in public portfolio pages
- Custom domain support
- Analytics on case study views

#### 12. Public Gallery
- Opt-in showcase of great case studies (anonymized if needed)
- Community learning and inspiration

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: GitHub as file-based database (markdown + JSON)
- **API Routes**: Next.js API routes for CRUD operations
- **Authentication**: GitHub OAuth
- **File Operations**: Octokit (GitHub API client)

### AI Integration
- **Provider**: Anthropic Claude API
- **Use Cases**:
  - Generate case study drafts from entries
  - Suggest section improvements
  - Extract key insights from long entries
  - Generate presentation talking points

### Data Model

**Project Structure**:
```
/projects/
  /{project-id}/
    metadata.json         # Project info (title, dates, client)
    entries/
      2024-01-15.md      # Daily journal entries
      2024-01-16.md
      ...
    assets/
      hero-image.png
      prototype-v1.fig
      ...
    drafts/
      case-study-v1.md   # AI-generated drafts
      presentation.md
```

**metadata.json**:
```json
{
  "id": "uuid",
  "title": "Product Redesign",
  "client": "Company Name",
  "role": "Lead Product Designer",
  "dateStart": "2024-01-01",
  "dateEnd": "2024-06-30",
  "status": "active",
  "tags": ["redesign", "mobile", "saas"]
}
```

### File Operations Flow
1. User creates/edits entry in UI
2. Next.js API route receives request
3. Octokit commits changes to GitHub repo
4. GitHub webhook (future) triggers processing
5. UI updates via React state

---

## Success Metrics

### Primary Metrics
1. **Entry Consistency**: Users log ≥3 entries per week during active projects
2. **Time to Draft**: Generate complete case study draft in <2 minutes
3. **Draft Acceptance Rate**: 70%+ of AI-generated content used with minor edits
4. **Portfolio Completion**: 50% more completed case studies vs. traditional methods

### User Satisfaction
5. **NPS Score**: Target 50+ (portfolio tools typically score 20-30)
6. **Weekly Active Users**: 80% of users with active projects log entries weekly
7. **Case Study Completion**: 90% of started projects result in published case study

### Business Impact
8. **Interview Preparation**: Users report 50% less time preparing for interviews
9. **Career Outcomes**: Track job offers among active users
10. **Referral Rate**: 40% of users invite colleagues

---

## Design Principles

1. **Capture > Perfection**: Lower the bar for initial journaling—it doesn't need to be polished
2. **Emergent, Not Prescriptive**: Case studies emerge from authentic work logs, not templates
3. **Designer Voice**: AI enhances, doesn't replace; maintains authentic voice
4. **No Lock-In**: Plain markdown files, portable data, exportable always
5. **Respectful of Time**: 5-minute entries, not 30-minute documentation sessions
6. **Context Over Volume**: Capture the "why" and "how," not exhaustive details

---

## User Flows

### Flow 1: Starting a New Project
1. User clicks "New Project"
2. Fills basic metadata (title, role, dates)
3. Optional: Upload initial assets (brief, sketches)
4. Project created, redirected to empty journal
5. Prompted to write first entry: "What are you trying to solve?"

### Flow 2: Logging During Project
1. User opens project dashboard
2. Clicks "Add Entry"
3. Chooses entry type (milestone/decision/insight)
4. Writes 2-3 paragraphs in markdown editor
5. Optionally attaches asset (screenshot, prototype link)
6. Saves → entry timestamped and stored
7. Returns to project timeline view

### Flow 3: Generating Case Study
1. User clicks "Generate Case Study" from project page
2. Reviews checklist: "Do you have enough entries?" (suggests ≥10 minimum)
3. Chooses template: Comprehensive, Short Form, Interview Deck
4. Clicks "Generate" → AI processing (20-30 seconds)
5. Draft appears in editor with sections pre-filled
6. User reads through, edits for voice and accuracy
7. Adds any missing details manually
8. Exports to Markdown/PDF/HTML
9. Publishes to portfolio site

---

## Competitive Landscape

| Tool | Focus | Differentiator |
|------|-------|----------------|
| **Notion** | General docs | Not design-specific, no AI synthesis |
| **Google Docs** | Writing | No structure, manual organization |
| **Cargo/Webflow** | Portfolio hosting | No capture/journaling features |
| **Figma** | Design files | Not for narrative case studies |
| **Gamma** | AI presentations | Generic, not design portfolio focused |

**Our Advantage**: Only tool purpose-built for design portfolio journaling → AI case study generation.

---

## Open Questions

1. **How do we handle NDA'd work?** (Anonymization features? Public vs private projects?)
2. **Should we support team projects or stay single-player?**
3. **What's the right AI tone?** (Professional? Conversational? User-configurable?)
4. **Pricing model?** (Free for personal use? Paid for teams? Usage-based AI costs?)
5. **Integration with portfolio platforms?** (One-click publish to Cargo, Webflow, etc.?)

---

## Development Status

**Current State**: Early development, project management and basic journaling implemented

**What's Working**:
- Next.js app scaffold with App Router
- Basic project CRUD operations
- Markdown editor for entries
- File structure in GitHub

**Next Steps**:
1. Complete GitHub integration (Octokit setup)
2. Implement Claude API for case study generation
3. Build export functionality
4. User authentication (GitHub OAuth)
5. Polish UI components and styling

---

## Getting Started

See [README.md](README.md) for development setup instructions.

For full product details, see [PRD-README.md](PRD-README.md).

---

*Last Updated: February 2025*
