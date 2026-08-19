# Task Manager - Project Overview

## What is this project?
This project is an advanced, AI-ready Task Manager and Pipeline Generation Dashboard. 
It replaces traditional to-do lists with a structural, developer-focused workspace that allows users to seamlessly parse text/documents into actionable sub-tasks and track statistical metrics like time and energy estimates.

## Core Architecture
- **Backend:** Python, Flask, Flask-SQLAlchemy
- **Database:** SQLite (Currently optimized for local/demo deployment with no user authentication)
- **Frontend Engine:** Vanilla HTML5, CSS3, Vanilla JS (ES6+) with Framer Motion (`motion`) via CDN for fluid, performant micro-interactions.
- **API Strategy:** Multi-Page Application (MPA) routing for structural pages (Dashboard, Metrics, Settings), paired with an asynchronous `fetch()` API for seamless, zero-reload state updates on the frontend.

## Design System (Matte Dark)
The application strictly utilizes a "Matte Dark Override" system:
- **Palette:** `#161616` main background, `#222222` card surfaces, `#0084ff` primary accents.
- **Typography:** `Inter` for structural UI, `Fira Code/Space Mono` for data tags and ML statistics.
- **Constraints:** Strict Flexbox/Grid layouts preventing sidebar bleed, absolute zero use of glassmorphism or CSS blurs.
