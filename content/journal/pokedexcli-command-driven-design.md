---

title: "Command-Driven Design in Go: Building an Extensible PokedexCLI"
description: "How command-driven architecture makes a Go CLI easier to extend, test, and maintain by separating command discovery, dispatch, application state, and feature-specific behavior."
date: 2026-08-16
draft: false
tags:

  - Go
  - Golang
  - CLI
  - Command Pattern
  - PokedexCLI
  - Software Design
  - Developer Tooling
  - Backend Engineering
  categories:
  - Backend Engineering
  - Go

---

## Command-Driven Design in Go: Building an Extensible PokedexCLI

A command-line interface is fundamentally a command-driven system.

The user provides an instruction, the application identifies what that instruction means, and a corresponding operation is executed.

That sounds simple.

But as the number of commands grows, the way those commands are organized becomes increasingly important.

PokedexCLI provided an opportunity to explore this problem directly.

Instead of treating every command as a special case, I structured the application around explicit command definitions and handlers.

The result is a system that can grow without turning the main REPL loop into a large collection of conditional branches.

## From User Input to Behavior

The basic lifecycle of a command is:

```text
User input
    ↓
Input normalization
    ↓
Command parsing
    ↓
Command lookup
    ↓
Command handler
    ↓
Application state
    ↓
Result
```

Each stage has a different responsibility.

That distinction is what makes the architecture manageable.

## The Problem With a Giant Conditional

A beginner implementation might look like this:

```go
if command == "map" {
    // map implementation
} else if command == "explore" {
    // explore implementation
} else if command == "catch" {
    // catch implementation
}
```

This works.

Until it doesn't.

As commands accumulate, the dispatcher becomes responsible for understanding the details of every feature.

The result is a central function that constantly grows.

That is a maintainability problem.

## Commands as Data

A better approach is to represent commands explicitly.

Conceptually:

```go
type cliCommand struct {
    name        string
    description string
    callback    func(*config, []string) error
}
```

The command definition describes what the command is and which function should execute it.

The command registry can then associate names with definitions.

```text
"map"     → mapCommand
"explore" → exploreCommand
"catch"   → catchCommand
"inspect" → inspectCommand
```

This makes the system extensible.

## The Command Registry

A command registry acts as the application's lookup table.

Conceptually:

```text
Input: "explore"
       │
       ▼
Registry
       │
       ▼
explore command
       │
       ▼
explore handler
```

The dispatcher does not need to understand exploration.

It only needs to find the correct command.

That is a powerful simplification.

## Keeping the REPL Small

The REPL should remain boring.

That is a good thing.

Its job should primarily be:

```text
Read
 ↓
Parse
 ↓
Lookup
 ↓
Execute
 ↓
Repeat
```

If the REPL starts containing business logic for Pokémon encounters, pagination, caching, or API parsing, the architecture has begun leaking responsibilities into the wrong layer.

Keeping the loop small provides a useful signal that responsibilities are being separated correctly.

## Input Normalization

Command-line input is messy.

Users may enter:

```text
map
MAP
map   
map   area
```

Input normalization can make command processing more predictable.

A dedicated input-cleaning function can:

* trim unnecessary whitespace;
* normalize casing;
* split input into tokens.

The resulting representation can then be passed to the command dispatcher.

This makes the rest of the application operate on structured input rather than raw user text.

## Arguments Belong to Commands

Commands can have different argument requirements.

For example:

```text
map
```

requires no explicit location.

While:

```text
explore pastoria-city-area
```

requires an argument.

The command handler should validate the arguments relevant to its own behavior.

This keeps validation close to the feature that understands the requirement.

## Command Responsibilities

A command should ideally answer one question:

> What should happen when this command is invoked?

For example:

```text
map
```

might:

1. retrieve the current location page;
2. display locations;
3. update pagination state.

Meanwhile:

```text
explore
```

might:

1. validate the location argument;
2. request location details;
3. display available Pokémon.

The dispatcher should not know these details.

## State and Commands

Commands often need shared application state.

For PokedexCLI, that includes things such as:

* API client;
* cache;
* pagination URLs;
* captured Pokémon.

A configuration structure provides a useful home for that state.

The command receives access to the configuration and performs its operation.

This keeps state explicit.

## The `exit` Command

Even the simplest command demonstrates the architecture.

The `exit` command has one responsibility:

```text
Terminate the CLI session.
```

It does not need to know anything about API calls or Pokémon data.

That simplicity is useful.

It shows that the command framework can support both local control-flow commands and network-backed application commands.

## The `help` Command

The `help` command demonstrates another advantage of command registration.

If commands are represented as data, the application can iterate through them and display:

```text
map       → Get the next page of locations
mapb      → Get the previous page
explore   → Explore a location
catch     → Attempt to catch a Pokémon
inspect   → Inspect a caught Pokémon
pokedex   → View captured Pokémon
```

The command registry becomes a source of truth for the CLI interface.

This reduces duplication.

## Adding New Commands

One of the strongest properties of this architecture is that adding a new command does not require rewriting the dispatcher.

The workflow becomes:

```text
Create handler
     ↓
Define command
     ↓
Register command
     ↓
Test
```

The core REPL remains unchanged.

That is a strong indicator that the architecture is open to extension without unnecessary modification to its central control flow.

## Testing Command Behavior

Individual handlers can also be tested independently.

A command can be given:

* controlled configuration;
* known arguments;
* predictable dependencies.

The test can then verify the expected result.

This is significantly easier than testing the entire interactive loop for every behavior.

## Avoiding Over-Engineering

Command-driven architecture does not mean every CLI needs a massive framework.

For a small Go application, a map of command definitions and simple functions can be enough.

The goal is not to reproduce a web framework.

The goal is to create a boundary where commands are easy to discover, execute, and extend.

Good architecture should reduce complexity, not replace one form of complexity with another.

## Lessons From PokedexCLI

The biggest lesson from command-driven design is that structure matters even when the application is small.

The command registry gives the application a clear extension point.

The REPL provides a stable interaction loop.

Command handlers contain feature-specific behavior.

Application configuration provides shared state.

Together, these pieces create a simple architecture that remains understandable as features are added.

## Final Thoughts

A CLI is often one of the first places where developers encounter application architecture in a practical way.

PokedexCLI demonstrates that a command-driven application does not need complicated abstractions to remain maintainable.

It needs:

* explicit commands;
* focused handlers;
* predictable input processing;
* centralized dispatch;
* explicit state;
* clean dependency boundaries.

These principles are useful far beyond PokedexCLI.

They apply to administrative tools, deployment utilities, developer tooling, infrastructure CLIs, and many internal engineering systems.

The interface may be a terminal.

## The engineering principles are the same

## Related Topics

* Command-driven architecture
* Go CLI development
* REPL design
* Command pattern
* Developer tooling
* Application state
* Software maintainability
