---

title: "Building an HTML Node Tree Instead of Generating Strings"
description: "Why a static site generator benefits from an explicit HTML node tree and how ParentNode and LeafNode abstractions simplify rendering."
date: 2026-08-21
draft: false
tags:

  - Static Site Generator
  - Python
  - HTML
  - Software Architecture
  - Trees
  - Backend Engineering

---

## Building an HTML Node Tree Instead of Generating Strings

Generating HTML by concatenating strings works until it doesn't.

For a very small page, this might be perfectly acceptable:

```python
return "<p>" + text + "</p>"
```

But once a document contains nested elements, attributes, links, images, lists, and formatting, string concatenation becomes increasingly difficult to maintain.

The static site generator therefore uses a more structured approach: representing HTML as a tree.

## HTML Is Already a Tree

Consider:

```html
<p>
  Build <strong>reliable</strong> systems.
</p>
```

The structure is naturally hierarchical:

```text
p
├── "Build "
├── strong
│   └── "reliable"
└── " systems."
```

The browser ultimately interprets HTML as a document tree.

It therefore makes sense for the generator to construct a similar representation before serializing it.

## Parent and Leaf Nodes

A useful abstraction is to distinguish between nodes that contain children and nodes that do not.

A `LeafNode` represents content such as:

```text
"Build reliable systems."
```

A `ParentNode` contains other nodes:

```text
<p>
    ...
</p>
```

Conceptually:

```python
class LeafNode:
    def __init__(self, tag, value, props=None):
        self.tag = tag
        self.value = value
        self.props = props
```

and:

```python
class ParentNode:
    def __init__(self, tag, children, props=None):
        self.tag = tag
        self.children = children
        self.props = props
```

The exact implementation can vary, but the distinction is valuable.

## Rendering a Leaf

A leaf node has no children to traverse.

For example:

```python
LeafNode("p", "Hello")
```

can render to:

```html
<p>Hello</p>
```

A text leaf without a tag can render directly as:

```text
Hello
```

## Rendering a Parent

A parent node must render its children first.

For example:

```text
ParentNode(
    "p",
    [
        LeafNode(None, "Build "),
        LeafNode("strong", "reliable"),
        LeafNode(None, " systems.")
    ]
)
```

becomes:

```html
<p>Build <strong>reliable</strong> systems.</p>
```

The renderer can accomplish this recursively.

## Recursive Rendering

The general algorithm is simple:

```text
Render node
    │
    ├── Leaf?
    │     └── Render value
    │
    └── Parent?
          ├── Render opening tag
          ├── Render each child
          ├── Render closing tag
          └── Return result
```

This is one of the places where recursion naturally matches the data structure.

The input is a tree, so the rendering process traverses a tree.

## HTML Properties

HTML elements can also contain attributes.

For example:

```html
<a href="https://go.dev" target="_blank">
  Go
</a>
```

The node therefore needs a way to store properties.

Conceptually:

```python
{
    "href": "https://go.dev",
    "target": "_blank"
}
```

The renderer can then serialize these properties into HTML attributes.

## Keeping Rendering Generic

One of the strongest benefits of the node abstraction is that the renderer does not need to understand Markdown.

It only needs to understand HTML nodes.

That means the same renderer can potentially be reused by other input formats.

For example:

```text
Markdown ────────┐
                 │
HTML-like data ──┼──→ Node Tree → HTML
                 │
Future format ───┘
```

This is a useful separation of concerns.

## Testing the Tree Independently

The node system can be tested without involving the Markdown parser.

For example:

```python
node = LeafNode("strong", "important")
assert node.to_html() == "<strong>important</strong>"
```

Likewise, a parent node can be tested independently:

```python
node = ParentNode(
    "p",
    [
        LeafNode(None, "Hello "),
        LeafNode("strong", "world"),
    ],
)

assert node.to_html() == "<p>Hello <strong>world</strong></p>"
```

These tests are small and deterministic.

## Why This Matters

The generator is still a relatively small project, but the design principles scale.

A structured intermediate representation gives the system:

* Clearer boundaries
* Better testability
* Easier debugging
* Recursive composition
* Cleaner rendering logic
* A foundation for future features

This is much more maintainable than assembling increasingly complicated HTML strings.

## Conclusion

The HTML node tree became one of the most useful architectural boundaries in the project.

Instead of thinking of HTML as text that needs to be produced, the generator treats it as structured data that eventually gets serialized.

That shift sounds subtle, but it changes how the entire implementation can be designed.

The generator parses meaning first and generates HTML second.

That is a much stronger foundation for a system intended to evolve.
