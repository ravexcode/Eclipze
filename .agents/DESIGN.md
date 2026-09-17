# DESIGN.md

> **Source of Truth**
>
> Figma: **Sin título**
> Frame: `dashboard`
> Node: `1:3`
> Canvas: `UI Design`

---

# Overview

Eclipse is a dark-themed developer dashboard focused on productivity.

Current dashboard sections:

- Overview
- Current Issues
- Projects
- Agent Sessions

---

# Canvas

| Property | Value |
|----------|-------|
| Desktop Size | **1728 × 1117** |
| Sidebar | **324px (fixed)** |
| Content | **Fluid (1404px base)** |

---

# Color Tokens

| Token | Value | Usage |
|--------|-------|------|
| `background` | `#010101` | Page background |
| `surface` | `#060606` | Cards, sidebar, rows |
| `surface-raised` | `#111111` | Active sidebar item, dividers |
| `text-primary` | `#fafafa` | Primary text |
| `text-secondary` | `#676767` | Secondary text |
| `accent` | `#000bde` | Primary charts |
| `accent-muted` | `#676767` | Secondary charts |
| `status-purple` | `#cb30e0` | Project status |
| `status-cyan` | `#00c0e8` | Project status |
| `status-green` | `#34c759` | Project status |
| `alert-red` | `#ff383c` | Attention borders |

---

# Typography

## Fonts

| Usage | Font |
|--------|------|
| Brand | Roboto Mono |
| UI | Roboto Flex |

## Type Scale

| Element | Weight | Size |
|---------|-------:|-----:|
| Page Title | 400 | 24px |
| Card Title | 700 | 24px |
| Section Heading | 600 | 16px |
| Body | 400 | 15px |
| Metadata | 400 | 12px |
| Description | 300 | 12px |
| Date Labels | 400 | 11px |
| Sidebar User | 400 | 12px |
| Sidebar Navigation | 400 | 10px |

---

# Icons

All icons must come from **Tabler Icons** (`@tabler/icons-react`).

## Suggested Mapping

| UI | Icon |
|----|------|
| User | `IconUser` |
| Sidebar Toggle | `IconLayoutSidebar` |
| Overview | `IconHome` |
| Mails | `IconMail` |
| Issues | `IconBug` |
| Agents | `IconSparkles` or `IconRobot` |
| Projects | `IconFolders` |
| External Link | `IconArrowUpRight` |
| Session | `IconTerminal2` |

## Rules

- Use 19–20px icon slots.
- Active navigation icons use `text-primary`.
- Inactive navigation icons use `text-secondary`.

---

# Layout Specification

## Sidebar

- Width: **324px**
- Full viewport height
- Background: `surface`

### User

- Circular avatar
- Roboto Mono 12px username
- Settings button on the top-right

### Navigation

Options:

- Overview
- My Mails
- Issues
- Agents
- Projects

States:

- Active → `surface-raised`
- Inactive → Transparent

---

## Header

Contains:

- Page title
- 1px divider spanning the content width

---

## Current Issues

Card:

- Size: **860 × 140**
- Radius: **5px**
- Background: `surface`

Contains:

- Issue counters
- Severity indicators
- Bar chart

Severity colors:

- Important → Red
- Medium → Amber
- Low → Gray

Chart:

- Primary series → `accent`
- Secondary series → `accent-muted`

---

## Projects

Stacked cards:

- Size: **842 × 128**
- Radius: **4px**
- Background: `surface`

Each card contains:

- Title
- Description
- Status indicator
- External link actions

Cards requiring attention use a **1px `alert-red` border**.

---

## Agent Sessions

Grouped by date:

- Today
- Yesterday

Session rows:

- Size: **842 × 37**
- Radius: **5px**
- Background: `surface`

Each row contains:

- Leading Tabler icon
- Session description

---

# Responsive Behavior

- Sidebar remains fixed at **324px**.
- Content area expands fluidly.
- Preserve spacing proportions from the desktop design.
- Do not alter typography scale without updating the design system.

---

# Design Rules

## DO

- Match the Figma layout as closely as possible.
- Reuse the defined color tokens.
- Use Roboto Flex and Roboto Mono exclusively.
- Use only Tabler Icons.
- Preserve spacing and hierarchy from the source design.

## DON'T

- Introduce new colors outside the design tokens.
- Substitute icon libraries.
- Modify typography scale arbitrarily.
- Change layout proportions unless the design is updated.
