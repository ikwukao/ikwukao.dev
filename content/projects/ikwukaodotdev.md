---
title: "ikwukao.dev"
description: "A production-oriented personal engineering portfolio built to communicate backend engineering, distributed systems, and platform engineering work."
summary: "A polished engineering portfolio focused on systems thinking, technical case studies, and professional presentation."
date: 2026-08-02
draft: false
featured: false
status: "Active"
github: "https://github.com/ikwukao/ikwukao.dev"
demo: "https://ikwukao.dev/"
technologies:
  - Hugo
  - Go
  - Tailwind CSS
  - HTML
  - CSS
  - JavaScript
  - GitHub Actions
tags:
  - Portfolio
  - Hugo
  - Go
  - Web Development
  - Developer Experience
---

## Overview

**ikwukao.dev** is my personal engineering portfolio, built to present the systems I develop, the engineering problems I explore, and the direction of my work as a backend and distributed-systems engineer.

The site is structured around technical projects, engineering case studies, professional experience, skills, and engineering writing rather than functioning as a conventional résumé page.

## Engineering Highlights

- Built the site with Hugo using reusable layouts and partials.
- Structured the portfolio around projects, journal entries, skills, résumé, about, and contact sections.
- Created reusable project case-study components for communicating architecture, engineering decisions, metrics, and implementation details.
- Developed a dark, terminal-inspired visual identity aligned with the site's engineering focus.
- Integrated technical SEO, Open Graph metadata, structured data, sitemap generation, and robots directives.
- Optimized production builds with Hugo asset processing and minification.
- Used Tailwind CSS to maintain a consistent utility-driven design system.

## Architecture

```text
Content
  │
  ├── Projects
  ├── Journal
  ├── Skills
  ├── About
  └── Resume
       │
       ▼
   Hugo Templates
       │
       ├── Layouts
       └── Reusable Partials
       │
       ▼
   Tailwind CSS
       │
       ▼
   Static Production Site
```

## Engineering Principles

* Clarity over unnecessary complexity.
* Reusable components over duplicated presentation logic.
* Performance as a feature.
* Technical work should be easy to evaluate.
Documentation is part of engineering.
Design should support the content rather than compete with it.
Lessons Learned

Building the portfolio reinforced that a professional engineering site is more than a collection of technologies. Structure, writing, case studies, performance, accessibility, and visual hierarchy all contribute to how effectively technical work is communicated.
