# Notion Integration Reference

Shared reference for all pipeline skills that update Notion. All skills read this file instead of hardcoding database IDs or column names.

---

## Database IDs

| Database | Page ID | Data Source URL |
|---|---|---|
| **Dev Tracker** | `03b93a05-93eb-433b-94f8-6697dd0a602d` | `collection://f0c5c186-7c5f-4c25-89d8-775a4426da5a` |
| **Sprint List** | `3ca149ea-4550-4f99-941f-9ae3b36bd194` | `collection://3f437e88-0a75-477a-ba04-b47e8b86370a` |
| **Bug Log** | `26a6c461-0760-8008-8eca-cce74e61545b` | `collection://26a6c461-0760-8092-9c7a-000ba3008d92` |
| **Product Dev Hub** (parent page) | `26a6c461-0760-801e-ad44-cc1c36ae981a` | — |

---

## Dev Tracker Kanban Columns (Status property)

### Flow columns (left → right)

| Column | Pipeline Trigger | Description |
|---|---|---|
| `Speccing` | INTAKE through DOCUMENT | Feature being specified/designed |
| `Backend Dev` | BUILD starts (backend) | Backend implementation in progress |
| `Frontend Dev` | HANDOVER or frontend BUILD | Frontend implementation in progress |
| `Code Review` | VALIDATE passes | Code review after build |
| `Manual QA` | Manual step | Flow testing by dev |
| `Replit Staging` | Manual step | Final environment check in Replit pre-production |
| `Keri Review` | Manual step | Keri's testing pass |
| `Published` | SHIP (published) or `/publish` | Live in production |

### Parking lot columns (no flow)

| Column | Trigger |
|---|---|
| `Future Improvements` | `/future-improvements` skill |
| `Tech Debt` | `/tech-debt` skill |

---

## Dev Tracker Card Properties

| Property | Type | Auto-populated | Source |
|---|---|---|---|
| `Feature / Item` | title | Yes | MANIFEST feature name |
| `Status` | select | Yes | Pipeline phase (see column map) |
| `Priority` | select | Yes | MANIFEST priority or ask at intake |
| `Stage` | select | Yes | MANIFEST stage tag (MVP/1.5/2.0/2.5) |
| `Epic` | select | Yes | MANIFEST epic or sprint name |
| `Notes` | text | Yes | Phase summaries appended over time |
| `Last Updated` | date | Yes | Auto-set on every Notion update |
| `Link to PRD` | url | Yes | Path to `docs/[Feature]/` |
| `Owner` | person | No | Set manually |
| `Number` | number | No | Set manually |

---

## Sprint List Properties

| Property | Type | Auto-populated | Source |
|---|---|---|---|
| `Sprint` | title | Yes | MANIFEST feature/sprint name |
| `Status` | select | Yes | Active (on create), Completed (on ship) |
| `Focus` | text | Yes | MANIFEST description |
| `Dates` | date | No | Set manually |
| `Key Features` | multi_select | No | Set manually |

---

## Bug Log Properties

| Property | Type | Auto-populated | Source |
|---|---|---|---|
| `Title` | title | Yes | Bug title from `/investigate` |
| `Status` | select | Yes | In Triage → In Progress → Fixed |
| `Severity` | select | Yes | From investigation priority |
| `Date Reported` | date | Yes | Current date |
| `Fixed Date` | date | Yes | When fix verified |
| `Notes` | text | Yes | Diagnosis and fix summary |
| `Reported By` | select | Yes | "Internal" (from Claude Code) |
| `Linked Linear Issue` | url | No | Set manually |

---

## MCP Tool Patterns

### Create a Dev Tracker card

```
Tool: mcp__plugin_Notion_notion__notion-create-pages
Parent: 03b93a05-93eb-433b-94f8-6697dd0a602d (Dev Tracker database)
Properties:
  - Feature / Item: [title]
  - Status: Speccing
  - Priority: [High/Medium/Low]
  - Stage: [MVP/Thoven 1.5/Thoven 2.0/Thoven 2.5]
  - Epic: [epic name]
  - Notes: [initial notes]
  - Last Updated: [ISO date]
  - Link to PRD: [docs path]
```

### Update a Dev Tracker card status

```
Tool: mcp__plugin_Notion_notion__notion-update-page
Page ID: [card ID from MANIFEST]
Properties:
  - Status: [new column name]
  - Last Updated: [ISO date]
  - Notes: [append new content]
```

### Create a Sprint List entry

```
Tool: mcp__plugin_Notion_notion__notion-create-pages
Parent: 3ca149ea-4550-4f99-941f-9ae3b36bd194 (Sprint List database)
Properties:
  - Sprint: [sprint name]
  - Status: Active
  - Focus: [description]
```

### Create a Bug Log entry

```
Tool: mcp__plugin_Notion_notion__notion-create-pages
Parent: 26a6c461-0760-8008-8eca-cce74e61545b (Bug Log database)
Properties:
  - Title: [bug title]
  - Status: In Triage
  - Severity: [Critical/High/Medium/Low]
  - Date Reported: [ISO date]
  - Reported By: Internal
  - Notes: [diagnosis notes]
```

---

## MANIFEST Integration

Every MANIFEST includes a Notion Integration section:

```markdown
## Notion Integration
- Card ID: <notion-page-uuid>
- Sprint: <sprint-name>
- Created: <ISO-date>
```

- **Card ID** is populated after `/dev:intake` creates the Notion card
- All subsequent phases read this ID to update the card
- If Card ID is empty, the phase should warn but not block

---

## Status Summary Format

After every Notion update, display a status line:

```
📋 Notion: [Action] — "[Feature Name]" → [Status Column]
```

Examples:
```
📋 Notion: Created card — "Unified Schedule Conflict Service" → Speccing
📋 Notion: Moved — "Unified Schedule Conflict Service" → Backend Dev
📋 Notion: Updated notes — "Unified Schedule Conflict Service" (Wave 2/3 complete)
📋 Notion: Moved — "Unified Schedule Conflict Service" → Published
📋 Notion: Created bug — "403 on booking endpoint" → In Triage
```

---

## Error Handling

- If Notion MCP tools are unavailable, warn but do NOT block the pipeline
- If a card update fails, log the failure in the phase artifact and continue
- Never let a Notion error prevent code from being built/tested/shipped
- The pipeline is the source of truth; Notion is a read-only reflection
