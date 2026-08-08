---
title: "Static Site Generator"
description: "A Markdown-to-HTML static site generator built in Python to explore parsing, document transformation, and composable software architecture."
summary: "A Python static site generator that transforms Markdown documents into structured HTML pages."
date: 2026-07-16
draft: false
featured: false
status: "Completed"
github: "https://github.com/ikwukao/static-site-generator"
demo: "https://ikwukao.github.io/static-site-generator/"
technologies:
  - Python
  - Markdown
  - HTML
  - Parsing
  - Static Site Generation
  - Pytest
tags:
  - Python
  - Backend
  - Parsing
  - Tooling
  - Boot.dev
---

## Overview

**Static Site Generator** is a Python-based tool that converts Markdown content into static HTML pages.

The project was built to understand the transformation pipeline behind static websites rather than relying entirely on an existing framework. It progressively models text, inline markup, blocks, HTML nodes, and complete document structures.

## Architecture

```text
Markdown
   │
   ▼
Blocks
   │
   ▼
Block Types
   │
   ▼
Text Nodes
   │
   ▼
HTML Nodes
   │
   ▼
HTML Document
```

---

## Engineering Highlights

- Implemented Markdown block parsing.
- Added inline Markdown parsing for links, images, code, and emphasis.
- Built reusable text-node representations.
- Implemented HTML leaf and parent nodes.
- Converted Markdown structures into HTML node trees.
- Added support for Markdown delimiters and inline elements.
- Used automated tests to validate parsing behavior.
- Separated parsing, transformation, and rendering responsibilities.

---

## Engineering Focus

**Parsing · Data Transformation · Python Architecture · Testing · Developer Tooling**

---

## Lessons Learned

The project demonstrated how text transformation becomes a series of well-defined parsing and representation problems. It reinforced the value of small abstractions and predictable transformation stages when building developer tools.

---
