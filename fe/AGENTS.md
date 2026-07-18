<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project UI Rules

This project is Team Manager, a football team management service for member management, match schedules, match records, match participation, guest players, and membership fee management.

This frontend project follows the Spec-Driven Development workflow from Paul Everitt's DeepLearning.AI short course:
https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents

Use the local SDD files under `specs/` before implementing changes:

- `specs/constitution.md` defines the frontend development principles.
- `specs/mission.md` defines the product and frontend mission.
- `specs/tech-stack.md` defines the accepted frontend stack and architecture.
- `specs/roadmap.md` defines the planned frontend phases.
- `specs/workflow.md` defines the project workflow: constitution, feature spec, implementation, validation, replanning, legacy support, and workflow improvement.
- `specs/features/_template/` contains the feature-spec document set to copy for new frontend features.

For feature work, create or update the feature spec first, then produce the plan, implementation notes, validation notes, replanning notes when needed, and legacy-support notes for existing behavior changes.

The frontend should help team owners and sub-managers quickly understand what needs attention: upcoming matches, member attendance, match records, and fee status. The default experience should feel like a practical team operations tool, not a marketing page.

This frontend must be built as a responsive application.

- Design and implement every screen for mobile, tablet, and desktop from the start.
- Prefer fluid layouts, flexible grids, and responsive spacing over fixed pixel-heavy layouts.
- Ensure text, buttons, cards, forms, and navigation do not overflow or overlap at narrow widths.
- Use mobile-first styling, then enhance layouts for larger breakpoints.
- Keep common workflows usable on small screens without requiring horizontal scrolling.
- Before finishing UI work, check the page at least at mobile and desktop widths.
- Do not add desktop-only interactions unless there is an accessible mobile alternative.

# Frontend Stack

- Use Next.js App Router.
- Follow the local Next.js version guidance above before changing framework conventions.
- Use Tailwind CSS utility classes for most styling.
- Keep shared API/config code under `src/shared`.
- Keep domain-specific frontend logic under `src/features` or route-local files when small.
- Keep JWT access tokens in memory only and send them through the `Authorization` header. Do not store tokens in `localStorage` or `sessionStorage`.
- Store refresh tokens only in HttpOnly cookies and restore the in-memory access token through the refresh endpoint after a full page reload.
- Use the auth context for UI state only; backend authorization must rely on the validated JWT.

# Visual Direction

- Use one calm, consistent theme color across pages.
- Current theme color is soft indigo: `#4f6f9f`.
- Avoid overly saturated colors for large surfaces.
- Keep forms focused and simple; avoid competing side panels unless they provide clear value.
- Build dense operational screens with clear hierarchy, readable tables/lists, and predictable actions.
