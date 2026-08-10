---

title: "Designing Text Nodes for Markdown Processing in Python"
description: "A practical look at representing plain text, emphasis, links, images, and inline Markdown as structured nodes inside a static site generator."
date: 2026-08-12
draft: false
tags:

  - Python
  - Markdown
  - Text Processing
  - HTML
  - Parsing
  - Static Site Generator

---

## Designing Text Nodes for Markdown Processing in Python

Markdown looks like plain text, but it contains structure.

A sentence can contain bold text, emphasis, links, images, and code without looking like a formal programming language.

That makes Markdown pleasant to write.

It also makes Markdown surprisingly interesting to parse.

While building a Static Site Generator in Python, one of the important design problems was deciding how inline content should be represented before it became HTML.

The solution was to treat pieces of text as structured nodes.

## Why Text Needs Structure

Consider:

```markdown
Build **reliable** systems with *clear* abstractions.
```

A human immediately understands the structure.

The parser needs to understand it too.

Instead of storing the paragraph as one string, it can represent it as:

```text
Text("Build ")
Bold("reliable")
Text(" systems with ")
Italic("clear")
Text(" abstractions.")
```

That structure can then be converted into HTML.

## The Text Node

The simplest node is plain text.

Conceptually:

```text
TextNode
    "Build reliable systems."
```

A text node does not need children.

It simply represents a piece of literal content.

That makes it a leaf in the document tree.

## Styled Text

Formatting introduces parent nodes.

For example:

```markdown
**reliable systems**
```

can become:

```text
Bold
└── Text
```

which renders to:

```html
<strong>reliable systems</strong>
```

The important distinction is that the text itself remains separate from the formatting element.

## Nested Formatting

The real value of this representation becomes obvious with nesting.

Consider:

```markdown
**highly *reliable* systems**
```

The structure becomes:

```text
Bold
└── Text("highly ")
└── Italic
    └── Text("reliable")
└── Text(" systems")
```

The renderer can recursively process this structure without knowing anything about the original Markdown delimiters.

## Delimiter Splitting

A common parsing strategy is to split text around Markdown delimiters.

For example:

```text
This is **important**.
```

can be separated into:

```text
This is
**
important
**
.
```

The parser can then determine which pieces represent formatted content.

The implementation needs to be careful about:

* missing closing delimiters
* empty content
* nested formatting
* multiple formatted regions
* delimiters appearing inside unrelated content

These edge cases are where a seemingly simple parser becomes an engineering problem.

## Links

Links introduce attributes as well as content.

For example:

```markdown
[Go](https://go.dev)
```

contains:

```text
text = Go
url = https://go.dev
```

The resulting HTML node can represent:

```html
<a href="https://go.dev">Go</a>
```

The visible text and destination are therefore stored separately.

## Images

Images follow a similar pattern:

```markdown
![Go logo](go.png)
```

contains:

```text
alt = Go logo
src = go.png
```

which becomes:

```html
<img src="go.png" alt="Go logo">
```

This demonstrates why structured nodes are useful.

Different Markdown constructs contain different data, but they can still participate in one rendering system.

## Escaping Content

One important responsibility of a text-processing pipeline is distinguishing content from markup.

If a user writes:

```text
5 < 10
```

the generator should not accidentally interpret the `<` character as HTML.

The renderer therefore needs to treat literal text safely.

This becomes particularly important when generated pages contain user-controlled or externally sourced content.

## Testing Inline Parsing

Inline parsing is an ideal candidate for focused tests.

Examples include:

```text
plain text
```

```text
**bold**
```

```text
*italic*
```

```text
[text](url)
```

```text
![alt](image.png)
```

and combinations such as:

```text
**bold *nested italic***
```

Testing these independently makes failures much easier to diagnose.

## The Value of Small Functions

One lesson from the project was the importance of keeping parsing functions focused.

A function responsible for splitting Markdown delimiters should not also:

* create files
* render HTML
* manage templates
* copy assets

Those are different responsibilities.

Small parsing functions are easier to test and compose.

## From Nodes to HTML

Once inline nodes exist, rendering becomes straightforward.

For example:

```text
Paragraph
├── Text("Build ")
├── Strong
│   └── Text("reliable")
└── Text(" systems.")
```

becomes:

```html
<p>Build <strong>reliable</strong> systems.</p>
```

The renderer does not need to understand the original Markdown.

It only needs to understand the node types.

## Why This Matters Beyond Markdown

The same design principle appears throughout software engineering.

Compilers use intermediate representations.

Browsers construct document trees.

Programming languages use syntax trees.

Data pipelines use normalized intermediate formats.

The common idea is to transform messy input into a structured representation before performing later operations.

That is exactly what the text-node layer provides here.

## Final Thoughts

Markdown parsing looks like a text-processing problem until formatting becomes nested and contextual.

At that point, strings alone become difficult to reason about.

Representing inline content as nodes creates a much cleaner abstraction.

The parser can focus on understanding Markdown.

The renderer can focus on producing HTML.

And the filesystem layer can focus on generating the final website.

That separation is one of the most useful architectural lessons from building the project.
