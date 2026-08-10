---

title: "Testing a Static Site Generator: Small Contracts, Reliable Output"
description: "How focused tests can validate Markdown parsing, text nodes, HTML nodes, and end-to-end page generation without relying on fragile full-site tests."
date: 2026-08-10
draft: false
tags:

  - Static Site Generator
  - Python
  - Testing
  - TDD
  - Markdown
  - Backend Engineering

---

## Testing a Static Site Generator: Small Contracts, Reliable Output

A static site generator is a good example of a system where small bugs can propagate through multiple layers.

A mistake in Markdown parsing can eventually appear as malformed HTML.

A malformed text node can produce incorrect links.

A block-classification error can cause an entire section of a page to render incorrectly.

That makes testing especially important.

The solution is not necessarily hundreds of large end-to-end tests.

Instead, the generator benefits from testing the contracts between its individual stages.

## Test the Smallest Useful Unit

Consider the transformation:

```text
Markdown
   ↓
Text Nodes
```

This can be tested independently.

For example, given:

```markdown
This is **important**.
```

the parser should produce a predictable sequence of nodes.

The test can verify:

```text
Text("This is ")
Bold("important")
Text(".")
```

without generating an entire website.

## Testing Block Classification

Block classification should also be tested independently.

Given:

```markdown
# Project
```

the parser should identify a heading.

Given:

```markdown
This is a paragraph.
```

it should identify a paragraph.

Given:

```markdown
- One
- Two
```

it should identify an unordered list.

These tests are small, fast, and precise.

## Testing Text Nodes

Text nodes should have predictable behavior.

For example:

```python
node = TextNode("hello", TextType.TEXT)
```

should preserve its:

* Text
* Type
* Optional URL

Equality behavior is also useful for testing.

Two logically identical nodes should compare as equal when appropriate.

## Testing HTML Nodes

HTML nodes can be tested independently of Markdown.

For example:

```python
node = LeafNode("strong", "important")
```

should produce:

```html
<strong>important</strong>
```

A parent node should correctly render nested children.

This isolates rendering bugs from parsing bugs.

## Testing Links

Links deserve dedicated tests because they contain additional metadata.

Given:

```markdown
[Go](https://go.dev)
```

the parser should produce a link node containing:

```text
text = Go
url = https://go.dev
```

The renderer should then produce the correct anchor element.

Testing both stages separately makes failures easier to diagnose.

## Testing Images

Images have a similar structure:

```markdown
![Architecture](architecture.png)
```

The parser needs to preserve both:

```text
alt text
image URL
```

A dedicated test ensures neither value is accidentally lost during parsing.

## Edge Cases Matter

Parsing systems often fail at boundaries rather than normal input.

Useful test cases therefore include:

* Empty strings
* Empty blocks
* Leading whitespace
* Trailing whitespace
* Missing delimiters
* Adjacent formatting
* Empty list items
* Multiple consecutive blocks
* Nested formatting
* Links containing punctuation
* Images with unusual filenames

These cases help reveal assumptions that ordinary examples hide.

## Integration Tests

Unit tests are not enough.

The generator also needs tests that validate the complete pipeline.

For example:

```text
Markdown file
      ↓
Generator
      ↓
HTML file
```

An integration test can verify that a small Markdown document becomes the expected HTML output.

The important point is balance.

Most tests should remain focused and fast, while a smaller number should verify that the complete pipeline works.

## Golden Output

For a static site generator, expected HTML output can also be treated as a reference.

Given a known Markdown document:

```markdown
# Hello

World.
```

the generated result should remain stable:

```html
<h1>Hello</h1>
<p>World.</p>
```

This makes regressions easier to identify.

If a refactor unexpectedly changes the generated HTML, the difference becomes immediately visible.

## Testing the Build Process

The generator itself should also be tested as a command-line application.

A realistic test can verify:

1. Source files exist.
2. The generator runs successfully.
3. Output directories are created.
4. HTML files are generated.
5. Expected content exists.
6. Static assets are copied correctly.

This catches problems that unit tests cannot see.

## Why Small Tests Improve Architecture

There is another benefit to testing.

Good tests encourage good boundaries.

If a function is difficult to test independently, that may indicate that it is doing too much.

For example:

```python
def parse_and_render_everything(...):
    ...
```

is difficult to test precisely.

A system with smaller functions such as:

```python
markdown_to_blocks(...)
block_to_block_type(...)
text_to_textnodes(...)
text_node_to_html_node(...)
markdown_to_html_node(...)
```

has much clearer contracts.

Testing therefore becomes a design tool.

## Test-Driven Development

The project also provides a practical environment for applying test-driven development.

A useful workflow is:

```text
Write failing test
       ↓
Implement smallest solution
       ↓
Run tests
       ↓
Refactor
       ↓
Repeat
```

The objective is not to maximize the number of tests.

It is to establish confidence around the behavior that matters.

## Conclusion

Testing a static site generator is ultimately about protecting transformations.

Each stage should have a clear contract:

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
   ↓
HTML
```

When those contracts are tested independently, the generator becomes easier to evolve without accidentally breaking existing behavior.

That is one of the most valuable lessons from the project: **reliable software is easier to build when every transformation has a clearly defined responsibility and a testable contract.**
