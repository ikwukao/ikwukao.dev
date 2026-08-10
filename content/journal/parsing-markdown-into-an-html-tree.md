---

title: "Parsing Markdown into an HTML Tree: Designing the Intermediate Representation"
description: "How a static site generator can transform Markdown into a structured HTML tree instead of relying on direct string replacement."
date: 2026-08-10
draft: false
tags:

  - Python
  - Markdown
  - Parsing
  - HTML
  - Abstract Syntax Tree
  - Static Site Generator

---

## Parsing Markdown into an HTML Tree: Designing the Intermediate Representation

One of the easiest mistakes to make when building a Markdown-to-HTML converter is to think of the problem as string replacement.

Replace `**text**` with `<strong>text</strong>`.

Replace `*text*` with `<em>text</em>`.

Replace headings with `<h1>`.

At first, this seems sufficient.

It quickly becomes difficult once documents contain nested structures.

A more robust approach is to introduce an intermediate representation between Markdown and HTML.

That is the approach I used while building my Static Site Generator.

## The Problem With Direct Replacement

Suppose the Markdown contains:

```markdown
This is **very *important***.
```

There are multiple levels of structure here.

The content is not simply a string containing special characters.

It represents:

```text
Paragraph
└── Text
└── Bold
    ├── Text
    └── Italic
        └── Text
```

A series of string replacements does not naturally express that structure.

An intermediate tree does.

## From Text to Structure

The parser can divide the document into logical blocks first.

For example:

```markdown
# Architecture

The system uses a modular design.

- Parser
- Renderer
- File Generator
```

can become:

```text
Heading
Paragraph
Unordered List
```

The next step is to transform each block into an HTML-oriented structure.

## HTML as a Tree

HTML is naturally hierarchical.

Consider:

```html
<ul>
  <li>Parser</li>
  <li>Renderer</li>
  <li>Generator</li>
</ul>
```

The relationship is:

```text
ul
├── li
│   └── Parser
├── li
│   └── Renderer
└── li
    └── Generator
```

Representing this structure explicitly makes rendering much simpler.

## Parent Nodes and Leaf Nodes

A useful abstraction is to distinguish between nodes that contain children and nodes that do not.

A leaf node might represent:

```text
"Parser"
```

A parent node might represent:

```text
<ul>
```

with multiple child nodes.

Conceptually:

```python
ParentNode(
    "ul",
    [
        LeafNode("li", "Parser"),
        LeafNode("li", "Renderer"),
    ],
)
```

The exact implementation can vary, but the design principle remains the same.

## Recursive Rendering

Once the tree exists, rendering becomes recursive.

A leaf node can produce its HTML directly.

A parent node can render its children and wrap them with its own tag.

Conceptually:

```text
render(parent)
    opening tag
    render children
    closing tag
```

For example:

```text
ParentNode("p")
    ├── TextNode("Hello ")
    └── ParentNode("strong")
        └── TextNode("world")
```

renders to:

```html
<p>Hello <strong>world</strong></p>
```

## Why This Architecture Scales

The tree representation makes new Markdown features easier to implement.

Instead of teaching the renderer about every possible Markdown combination, the parser creates the appropriate nodes.

The renderer only needs to know how each node type renders.

This creates a clean separation:

```text
Parser
  ↓
Intermediate Representation
  ↓
Renderer
```

That architecture is easier to test because each layer can be tested independently.

## Inline Parsing

Block parsing alone is not enough.

A paragraph such as:

```markdown
Build reliable systems with **clear abstractions**.
```

contains inline formatting.

The inline parser can split it into:

```text
Text("Build reliable systems with ")
Bold("clear abstractions")
Text(".")
```

Those nodes then become children of the paragraph node.

## Links and Images

The same principle applies to links and images.

A Markdown link:

```markdown
[GitHub](https://github.com/ikwukao)
```

represents an element with:

* visible text
* destination URL

It can therefore become an HTML anchor node.

Likewise:

```markdown
![Architecture diagram](architecture.png)
```

can become an image node containing the source and alternative text.

## Separating Meaning From Syntax

This is the deeper lesson.

Markdown syntax describes meaning.

HTML syntax expresses that meaning in another language.

The intermediate representation acts as the bridge between them.

```text
Markdown Syntax
      ↓
Semantic Structure
      ↓
HTML Syntax
```

That is much cleaner than translating one syntax directly into another.

## Testing the Tree

An intermediate representation also makes testing more precise.

Instead of testing only:

```text
Markdown → HTML
```

individual stages can be tested:

```text
Markdown
   ↓
Blocks
```

and:

```text
Text Nodes
   ↓
HTML Nodes
```

and finally:

```text
HTML Nodes
   ↓
HTML
```

When a test fails, the failing layer is easier to identify.

## Engineering Trade-Offs

A tree-based representation introduces additional code.

For a tiny converter, that may initially seem unnecessary.

But the additional abstraction pays off as complexity increases.

Once nesting, links, images, lists, code blocks, and multiple inline formats are supported, direct string manipulation becomes increasingly fragile.

The tree gives the system somewhere to put that complexity.

## Final Thoughts

The most important decision in a parser is often not the parsing algorithm itself.

It is the representation produced by the parser.

A well-designed intermediate representation creates a clean boundary between syntax and rendering.

For a static site generator, that boundary makes Markdown processing more understandable, testing more targeted, and future extensions considerably easier.

The HTML tree is therefore more than an implementation detail.

It is the architectural center of the transformation pipeline.
