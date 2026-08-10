---

title: "Designing Text Nodes for a Static Site Generator"
description: "How an explicit text-node model makes Markdown parsing, inline formatting, links, images, and HTML rendering easier to reason about."
date: 2026-08-15
draft: false
tags:

  - Static Site Generator
  - Python
  - Markdown
  - Data Structures
  - HTML
  - Software Architecture

---

## Designing Text Nodes for a Static Site Generator

One of the easiest mistakes when building a Markdown-to-HTML converter is to treat everything as strings.

At first, that approach feels natural.

Markdown comes in as a string, so perhaps HTML should simply come out as another string.

The problem appears as soon as formatting becomes more complicated.

Bold text, links, images, code spans, and nested formatting all require the generator to understand what individual pieces of text actually represent.

That is where an explicit text-node model becomes useful.

## From Strings to Structure

Consider this Markdown:

```markdown
Build **reliable** systems with [Go](https://go.dev).
```

A string-based implementation might try to repeatedly replace pieces of text.

A structured implementation instead recognizes several components:

```text
Text("Build ")
Bold(
    Text("reliable")
)
Text(" systems with ")
Link(
    Text("Go")
)
Text(".")
```

This is a much more useful representation.

The renderer can now make decisions based on structure rather than guessing from raw strings.

## A TextNode Model

A simple representation can contain three important properties:

```python
class TextNode:
    def __init__(self, text, text_type, url=None):
        self.text = text
        self.text_type = text_type
        self.url = url
```

The node represents a piece of content and the meaning assigned to it.

Possible types include:

```text
TEXT
BOLD
ITALIC
CODE
LINK
IMAGE
```

The model does not need to know how HTML works.

Its responsibility is simply to represent the parsed meaning.

## Why URLs Belong in the Node

Links and images require additional information.

For example:

```markdown
[Go](https://go.dev)
```

contains both:

```text
text = "Go"
url = "https://go.dev"
```

Keeping the URL as node metadata means the parser does not need to encode it into the text itself.

The same approach works for images:

```markdown
![Go Logo](logo.png)
```

which can be represented as:

```text
text = "Go Logo"
url = "logo.png"
type = IMAGE
```

## Separating Parsing from Rendering

This separation is important.

The parser answers:

> What does this Markdown mean?

The renderer answers:

> How should that meaning become HTML?

For example:

```text
TextNode(
    "reliable",
    BOLD
)
```

can later become:

```html
<b>reliable</b>
```

The parser does not need to generate HTML.

That responsibility belongs elsewhere.

## Delimiter-Based Parsing

Many Markdown constructs use delimiters.

Bold text commonly uses:

```markdown
**text**
```

Italic text uses:

```markdown
_text_
```

or:

```markdown
*text*
```

Inline code uses:

```markdown
`text`
```

The parser can identify these delimiters and split the input around them.

For example:

```text
before **important** after
```

becomes:

```text
before
important
after
```

with the middle node assigned the appropriate type.

## Splitting Nodes

A useful parsing operation is therefore:

```python
split_nodes_delimiter(nodes, delimiter, text_type)
```

Conceptually, it takes existing text nodes and replaces formatted regions with typed nodes.

For example:

```text
Text("Hello **world**")
```

becomes:

```text
Text("Hello ")
Bold("world")
```

This can then be repeated for other formatting types.

## Parsing Links and Images

Links require slightly different handling because they contain both visible text and a destination.

For example:

```markdown
[documentation](https://example.com)
```

needs to become something like:

```text
Link(
    text="documentation",
    url="https://example.com"
)
```

Images follow a similar pattern:

```markdown
![Architecture Diagram](architecture.png)
```

becomes:

```text
Image(
    text="Architecture Diagram",
    url="architecture.png"
)
```

Once these structures exist, HTML rendering becomes straightforward.

## Avoiding Parser Entanglement

A major benefit of the node approach is preventing one parser from becoming responsible for everything.

Instead of one enormous function:

```python
markdown_to_html(markdown)
```

doing all the work, the system can use smaller transformations:

```text
Markdown
   ↓
Blocks
   ↓
Block Types
   ↓
Text Nodes
   ↓
HTML Nodes
```

Each transformation has a clearly defined contract.

That makes debugging significantly easier.

## Invalid Input

Explicit node structures also make invalid input easier to reason about.

For example, a malformed link:

```markdown
[documentation]( 
```

should not silently produce unpredictable HTML.

The parser can detect that the expected closing structure is missing and handle the case deliberately.

This is especially important for a generator that may eventually process content from different sources.

## The Broader Engineering Lesson

The text-node system taught me a broader software engineering principle:

**Intermediate representations are powerful abstractions.**

They allow one stage of a system to communicate meaning to another stage without forcing both stages to understand each other's implementation details.

That principle applies far beyond static site generators.

It appears in:

* Compilers
* Interpreters
* Query engines
* Serialization systems
* Template engines
* Language tooling

A small Markdown project therefore becomes a useful exercise in software architecture.

## Conclusion

The text-node layer may look like a small implementation detail, but it provides the foundation for the rest of the generator.

Once Markdown has been converted into explicit structures, the rest of the pipeline becomes much easier to extend.

New syntax can be introduced by adding new parsing and rendering behavior rather than rewriting the entire generator.

That is exactly the kind of architectural boundary I want in a system that is expected to grow.
