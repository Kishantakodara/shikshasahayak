---
name: coderabbit
description: Perform a high-signal code review using CodeRabbit AI standards and MCP inspection
---

# CodeRabbit Code Review

Execute a CodeRabbit code review on the latest changes or pull request.

## Instructions
1. Inspect the staged or uncommitted git changes using `git diff --staged` or `git status`.
2. Analyze the diff for:
   - Logic correctness and edge cases
   - Security issues (OWASP, injection, auth)
   - Performance and unnecessary re-renders
   - Compliance with repository guidelines
3. Provide prioritized, actionable feedback with diff suggestions.
4. Conclude with a classic CodeRabbit summary poem.
