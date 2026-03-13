# EARS Notation Guide

Used during **Kiro spec** intake mode. EARS (Easy Approach to Requirements Syntax) statements from Kiro's `requirements.md` become PLAN acceptance criteria and VALIDATE checks.

## Core Structure

```
WHEN [triggering condition] THE SYSTEM SHALL [required behavior]
```

## Five Patterns

| Pattern | Keyword | Example |
|---|---|---|
| Event-driven | WHEN | `WHEN a parent submits a booking THE SYSTEM SHALL send a confirmation email` |
| State-based | WHILE | `WHILE a lesson is in progress THE SYSTEM SHALL display a live timer` |
| Conditional | WHERE | `WHERE a teacher has Stripe connected THE SYSTEM SHALL display their hourly rate` |
| Ubiquitous | (none) | `THE SYSTEM SHALL require auth for all /api/v1 endpoints except /auth` |
| Prohibition | (none) | `THE SYSTEM SHALL NOT expose student data before a booking is confirmed` |

## Rules

- **SHALL** = mandatory (never "should" or "may")
- Each statement independently testable with a single verifiable outcome
- No compound statements — split "and" into two separate EARS lines

## How the Pipeline Uses EARS

- **Kiro spec intake:** each EARS statement from `requirements.md` → PLAN acceptance criteria
- **VALIDATE:** Layer checks evidence against each EARS statement
- **WHEN [user action]** statements → integration test cases in BUILD
