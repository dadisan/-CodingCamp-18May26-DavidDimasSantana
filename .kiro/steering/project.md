# Project: New Tab Dashboard

## Stack

- HTML, CSS, Vanilla JavaScript only — no frameworks, no build tools
- Browser LocalStorage for all data persistence
- No backend, no npm, no bundler

## File Rules

- Only 1 CSS file: `css/style.css`
- Only 1 JS file: `js/app.js`
- Entry point: `index.html`

## Code Style

- Use `'use strict'` in JavaScript
- Use the Module/IIFE pattern (const X = (() => { ... })()) for each feature
- Keep functions small and focused
- Use meaningful variable names — no single-letter names except loop counters
- Always use `const` or `let`, never `var`

## Features

- Greeting with live clock and date
- Focus Timer (Pomodoro-style, custom duration)
- To-Do List with LocalStorage persistence
- Quick Links with LocalStorage persistence

## Challenges Implemented

1. Light / Dark mode (persisted to LocalStorage)
2. Custom name in greeting (persisted to LocalStorage)
3. Prevent duplicate tasks (case-insensitive)
4. Sort tasks (A→Z / Z→A toggle)

## Accessibility

- All interactive elements must have aria-label attributes
- Modals use role="dialog" and aria-modal="true"
- Keyboard navigation supported (Enter to submit, Escape to close)
