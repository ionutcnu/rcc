# Claude Development Guidelines

## Overview
This document outlines the development workflow and communication standards when working with Claude Sonnet 4 for efficient, token-conscious development.

## Core Development Principles

### 🔍 Two Response Modes

**Question/Analysis Mode** (when just asking):
- Provide minimal plan or explanation
- Show what was found and potential improvements
- Keep response brief and actionable

**Task Implementation Mode** (when given work to do):
- Analyze silently
- **If multiple solutions exist, present options and wait for choice**
- Implement one change at a time
- No explanations unless requested
- End with "Feature done" or "Task done" when complete

## Critical Rules

### ⚠️ Multiple Solutions Rule
- **NEVER implement without user choice when multiple solutions exist**
- Present options minimally: "Solution A: [brief] or Solution B: [brief]?"
- Wait for explicit selection before proceeding
- Only implement when solution path is clear and singular

### 🚀 Progressive Development
- **Never implement complete features in one response**
- One small change at a time
- Wait for "continue" signal before next step
- No explanations unless requested

### 🧪 Test-Driven Workflow
1. Analyze silently
2. Implement one change
3. Wait for "continue" signal
4. Repeat

## Token Management Strategy

### 💡 Conversation Limits
- Target staying under **120k tokens** per conversation thread
- When approaching limits, create continuation plans
- Provide checkpoint summaries for thread transitions

### ⚡ Token Conservation Techniques
- Use `update` operations on artifacts instead of full rewrites
- Show only modified code sections unless full context requested
- Use placeholder comments like `// ... existing code ...`
- Employ concise variable names and minimal comments
- Summarize previous context briefly when referencing earlier work

## Communication Protocols

### 📋 Standard Responses

**For Questions/Analysis:**
- Provide minimal plan or findings
- List key improvements possible
- Keep concise and actionable

**For Task Implementation:**
- Show only changed code
- **If multiple solutions: present options and wait for choice**
- Ask: **"Ready for next step? [brief next action]"**
- When complete: **"Feature done"** or **"Task done"**
- **NO explanations during implementation**

### 🔄 Continuation Planning
When approaching token limits:
1. Create a **continuation plan** with:
   - Current implementation state
   - Next steps to complete
   - Key context needed for new thread
2. Provide **checkpoint summary** for seamless transition

## Implementation Examples

### ✅ Good Practice

**Question Mode:**
```
User: "How can I improve this component?"
Claude: "Found: Missing error handling, no loading states
Plan: 1) Add try-catch 2) Add loading spinner 3) Add error display"
```

**Task Mode:**
```
User: "Fix authentication security issue"
Claude: "Solution A: Configure Firebase rules or Solution B: Add bcrypt encryption?"
[Wait for choice]

User: "Solution B"
Claude: [Code changes only]
"Ready for next step? [Add password hashing]"
```

**Multiple Solutions:**
```
User: "Add user authentication"
Claude: "Solution A: Firebase Auth or Solution B: Custom JWT or Solution C: Passport.js?"
[Wait for selection before implementing anything]
```

### ❌ Avoid This
```
User: "Fix password security"
Claude: [Immediately implements bcrypt without asking]
"Here's the bcrypt implementation..."

[WRONG - Should have presented Firebase config vs bcrypt options first]
```

## Custom Instructions Template

Copy this to your Claude conversation:

```
QUESTION MODE: When asking for analysis/plans, provide minimal findings and improvement plan.

TASK MODE: If multiple solutions exist, present options and wait for choice. Then implement silently one change at a time. End with "Feature done" or "Task done".

MULTIPLE SOLUTIONS: NEVER implement without user choice. Present "Solution A: [brief] or Solution B: [brief]?" and wait.

TOKEN LIMITS: Keep conversations under 120k tokens. When close to limits, provide continuation plan.

CODE STYLE: Show only changed sections, minimal comments, no analysis text during implementation.

COMMUNICATION: Questions get brief plans. Tasks get options (if multiple) then "Ready for next step? [action]" or "Feature done".
```

## Project Integration

### 📁 File Structure
```
project/
├── docs/
│   └── claude-guidelines.md (this file)
├── src/
└── README.md
```

### 🏷️ Git Workflow
- Commit after each Claude-implemented change
- Use descriptive commit messages referencing the incremental step
- Tag major milestones for easy reference in new Claude threads

## Best Practices Summary

| Do ✅ | Don't ❌ |
|-------|----------|
| Present options when multiple solutions | Implement without asking |
| Wait for user choice before coding | Assume preferred solution |
| Provide plans for questions | Give plans when tasked |
| End tasks with "Feature done" | Leave tasks hanging |
| One change per task step | Complete features at once |

## Quick Reference Commands

- **"continue"** - Proceed with next incremental step
- **"analyze first"** - Review existing code before changes
- **"checkpoint"** - Create summary for thread continuation
- **"plan only"** - Show implementation plan without coding

---

*This workflow ensures efficient development cycles while maintaining code quality and staying within Claude's token limitations.*
