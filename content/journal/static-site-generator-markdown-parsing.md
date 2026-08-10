---

title: "Building a Markdown Parser: Turning Structured Text into HTML"
description: "A practical look at the parsing pipeline behind a static site generator, from Markdown blocks and inline syntax to structured HTML nodes."
date: 2026-08-22
draft: false
tags:

  - Static Site Generator
  - Python
  - Markdown
  - Parsing
  - HTML
  - Backend Engineering

---

## Building a Markdown Parser: Turning Structured Text into HTML

A static site generator looks deceptively simple from the outside.

You write Markdown, run a command, and receive HTML.

Underneath that simple workflow, however, is a small compiler-like pipeline. The system has to understand structured text, identify different syntactic constructs, preserve their meaning, and eventually transform them into valid HTML.

That transformation became one of the most interesting parts of building my static site generator.

## The Core Problem

Markdown is designed to be readable as plain text while still carrying structure.

Consider:

```markdown
# Hello World

This is **important**.

- First item
- Second item
```

A browser cannot directly interpret this as a document structure.

The generator needs to transform it into something closer to:

```html
<h1>Hello World</h1>

<p>This is <b>important</b>.</p>

<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>
```

The important part is that the generator should not attempt to perform this transformation as one enormous string replacement.

A structured pipeline is much easier to reason about.

## A Parsing Pipeline

The architecture can be thought of as several stages:

```text
Markdown
   │
   ▼
Block Parsing
   │
   ▼
Block Classification
   │
   ▼
Inline Parsing
   │
   ▼
Text Nodes
   │
   ▼
HTML Nodes
   │
   ▼
Rendered HTML
```

Each stage has one responsibility.

That separation makes the system significantly easier to test and extend.

## Splitting Markdown into Blocks

The first useful distinction is between block-level structures.

A document can be separated into blocks using blank lines as boundaries.

For example:

```markdown
# Introduction

This is a paragraph.

## Features

- Fast
- Simple
- Portable
```

becomes a sequence of independent blocks:

```text
# Introduction

This is a paragraph.

## Features

- Fast
- Simple
- Portable
```

The parser can then classify each block.

## Classifying Blocks

Instead of asking every downstream function to understand arbitrary Markdown, the generator assigns a block type.

Typical types include:

* Heading
* Paragraph
* Code
* Quote
* Unordered list
* Ordered list

This produces a much cleaner internal representation.

Conceptually:

```python
class BlockType(Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    CODE = "code"
    QUOTE = "quote"
    UNORDERED_LIST = "unordered_list"
    ORDERED_LIST = "ordered_list"
```

The exact implementation can vary, but the principle remains the same.

**Parse first. Render later.**

## Why an Intermediate Representation Matters

One of the most useful architectural decisions is introducing an intermediate representation between Markdown and HTML.

Instead of:

```text
Markdown → HTML
```

the system becomes:

```text
Markdown → Nodes → HTML
```

This creates a boundary between parsing and rendering.

A heading might become:

```text
ParentNode
└── LeafNode("Hello World")
```

while emphasized text could become:

```text
ParentNode(<b>)
└── LeafNode("important")
```

The renderer no longer needs to understand Markdown syntax.

It only needs to understand nodes.

## Inline Parsing

Block parsing determines the large-scale structure of a document.

Inline parsing handles syntax inside those blocks.

Examples include:

* Bold text
* Italic text
* Inline code
* Links
* Images

For example:

```markdown
This is **bold** and this is `code`.
```

contains a paragraph block, but the paragraph itself contains multiple inline structures.

The parser therefore needs another layer.

```text
Paragraph
├── Text
├── Bold
│   └── Text
├── Text
├── Inline Code
│   └── Text
└── Text
```

This tree-like representation makes rendering predictable.

## Recursive Parsing

Nested structures are one reason recursive parsing is useful.

A Markdown fragment can contain several levels of interpretation.

For example:

```markdown
This is **very *important***.
```

The parser needs to recognize:

```text
Bold
└── Text
└── Italic
    └── Text
```

A recursive strategy makes this possible without creating an enormous collection of special cases.

## Parsing Is About Boundaries

One of the most important lessons from this project is that parsing is largely about identifying boundaries correctly.

For example:

```markdown
**hello**
```

contains a pair of delimiters.

The parser needs to determine:

1. Where the delimiter begins.
2. Where the matching delimiter ends.
3. What exists inside the delimiter.
4. What type of node should represent it.

The same idea applies to:

* Links
* Images
* Code spans
* Emphasis
* Headings
* Lists

Once boundaries are identified correctly, rendering becomes much simpler.

## Testing the Parser

Parsing code benefits enormously from small, focused tests.

Instead of testing an entire generated website, individual transformations can be tested independently.

For example:

```text
Markdown block
       ↓
BlockType
```

and:

```text
Markdown inline syntax
       ↓
TextNode sequence
```

and finally:

```text
TextNode sequence
       ↓
HTMLNode
```

This allows failures to be localized.

If a test reports that a link was rendered incorrectly, the problem is probably inside the inline parsing stage rather than the entire generator.

## What I Learned

The biggest lesson was that a static site generator is not fundamentally an HTML templating problem.

It is a **parsing problem**.

The quality of the final HTML depends heavily on how cleanly the input is represented internally.

Building explicit parsing stages makes the system easier to understand, test, debug, and extend.

That is the approach I want to continue applying to the generator as its Markdown support grows.
