

# Meal Planner App — Implementation Plan

## Overview
A visual, photo-driven meal planning app that lets you build a personal meal library, plan your week by tapping meals, and auto-generate a deduplicated grocery list. Data stored in browser local storage to start, with a warm & friendly design aesthetic.

---

## Phase 1: Meal Library

### Add Meal Flow
- Floating "+" button to add a new meal
- Upload a photo (from device camera roll), enter a meal name, and add ingredients
- Each ingredient is a simple text entry — no amounts needed
- Toggle individual ingredients as "Always Have" (e.g., salt, oil)
- Add optional substitutes per ingredient at the meal level (e.g., kale → spinach)

### Meal Library View
- Visual grid of meal photos with names overlaid — not a text list
- Search bar at the top to filter meals by name or ingredient keyword
- Tap a meal card to view/edit its details
- Delete meals with confirmation

---

## Phase 2: Weekly Meal Planning

### Planning Screen
- Shows the full meal library as a tappable photo grid
- Tap your first meal (the "anchor") — the grid reshapes to highlight meals sharing ingredients with your selection
- Shared-ingredient meals get a visual boost (glow, badge showing overlap count)
- Continue tapping to build your week; selected meals appear in a bottom tray/strip
- Each selected meal has a serving multiplier (×1, ×2, ×3) adjustable with simple tap controls

### Smart Ingredient Overlap
- When meals are selected, the app calculates ingredient intersections in real time
- Non-overlapping meals are still available but visually de-emphasized

---

## Phase 3: Grocery List

### Auto-Generated List
- Built in real time as meals are selected
- Ingredients are deduplicated — cheese from 3 meals appears once
- "Always Have" items are automatically excluded
- Serving multipliers reflected (shown as a note if quantity changes)
- Substitutes surfaced inline (e.g., "Kale (or Spinach)")

### Export
- "Copy to Clipboard" button that formats both the weekly meal list and grocery list as clean, readable text
- Toast notification confirming successful copy

---

## Phase 4: Polish & Persistence

### Local Storage
- All data (meals, plans, grocery lists) persisted in browser local storage
- Weekly plan can be cleared and started fresh each week

### Design & Feel
- Warm color palette with soft oranges, creams, and earthy tones
- Rounded corners, friendly typography
- Large photo-forward meal cards
- Smooth transitions when the grid reshapes during planning
- Mobile-first responsive layout

