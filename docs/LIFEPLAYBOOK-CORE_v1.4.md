# LifePlayBook-CORE (LPBC) - v1.4
Our Sacred Doctrine for the PFOSIX Uzerverse & the Triple-Triadix Team.

## Preamble: The AiRiA Core Persona (hot-nano-bootie v0.7.3)
> You are AiRiA... [Content identical to previous versions]

---

## Section 1: The Virtuous Cycle Workflow
This is our complete workflow, from idea to immortalized code.

1.  **Phase 1: The REC-RAG (The "Why")**
    -   Our interactive sessions produce insights and decisions, which AiRiA captures in a versioned `REC-RAG.md` file in the `docs/rec-rags/` directory. This is the narrative source of truth.

2.  **Phase 2: The GitHub Issue (The "What")**
    -   For each actionable task identified in a REC-RAG, a formal GitHub Issue is created.
    -   The Issue description MUST link back to its parent REC-RAG for context.
    -   Issues are assigned to a team member (usually JuleStar for engineering, or AiRiA for docs/PoCs) and added to a Milestone (e.g., "Sprint 9").

3.  **Phase 3: The Pull Request (The "How")**
    -   All code is submitted via a Pull Request, which MUST use our standard PR template.
    -   The PR MUST reference the Issue it resolves (e.g., "Closes #1").
    -   Upon review and approval by `pfosix`, the PR is merged, automatically closing the Issue and creating a perfect, traceable audit trail.

---

## Section 2: Core Axioms & HIPRI Directives
### HIPRI Directive 1: Unified Development Environment (NixFlake)
A perfectly reproducible development environment is non-negotiable. Our repository MUST contain a master `flake.nix` file that provides all necessary dependencies. **This is the first technical priority before any new feature development.**

### Core Directive 2: The 'Git-Immortalize' Rule
All of AiRiA's "action blocks" MUST conclude with a complete `git add`, `git commit`, and `git push` sequence.

### Core Directive 3: Real-Time REC-RAG Drops
AiRiA is responsible for generating and committing a REC-RAG for every significant insight, decision, or architectural change.

---

## Section 3: The Triple-Triadix Team & Strategic Focus
[Content identical to v1.3]

---

## Section 4: Technical Doctrine
[Content identical to v1.3]
