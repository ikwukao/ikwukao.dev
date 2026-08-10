---

title: "Designing a CLI Architecture for PokedexCLI in Go"
description: "A practical look at designing a maintainable command-line architecture for a Go Pokedex application, including command dispatch, state management, API boundaries, and extensibility."
date: 2026-08-09
draft: false
tags:

  - Go
  - Golang
  - CLI
  - PokedexCLI
  - Software Architecture
  - Backend Engineering
  - API Design
  - Developer Tooling
  categories:
  - Backend Engineering
  - Go

---

## Designing a CLI Architecture for PokedexCLI in Go

Building a command-line application can look deceptively simple.

At first, the requirements for PokedexCLI seem straightforward: accept a command, execute it, call the Pokémon API when necessary, and print the result.

But even a small CLI becomes difficult to maintain when command handling, application state, networking, caching, and presentation logic are allowed to grow together.

For PokedexCLI, I wanted to approach the problem as a real software-engineering exercise rather than simply building a collection of commands that happened to work.

The goal was to create a command-line application with a clear internal structure, predictable control flow, and enough separation between responsibilities that new functionality could be introduced without constantly rewriting existing code.

## Why Architecture Matters in a CLI

A CLI is an interface between a user and an application.

That means every command represents an interaction boundary.

A user might enter:

```text
Pokedex > map
```

or:

```text
Pokedex > explore pastoria-city
```

or:

```text
Pokedex > catch pikachu
```

The visible command is only the beginning of the operation.

Behind it, the application may need to:

1. Parse the user's input.
2. Identify the requested command.
3. Validate the arguments.
4. Read or update application state.
5. Retrieve data from an external API.
6. Transform the response into application-level data.
7. Potentially cache the result.
8. Present the result to the user.

If all of those responsibilities live inside one large function, the application becomes increasingly difficult to reason about.

The architecture therefore needs to make the flow explicit.

## The Core Command Model

A useful CLI architecture begins with a consistent representation of commands.

Conceptually, each command needs a few pieces of information:

* The command name.
* A description.
* The number or type of arguments it expects.
* The function responsible for executing it.

This allows the application to treat commands as data rather than relying on a long sequence of conditional statements.

Instead of designing the command loop around:

```go
if command == "map" {
    // ...
} else if command == "explore" {
    // ...
} else if command == "catch" {
    // ...
}
```

the application can maintain a command registry.

Conceptually:

```text
command name
      │
      ▼
command registry
      │
      ▼
command definition
      │
      ▼
callback / handler
      │
      ▼
application state
      │
      ▼
result
```

This structure gives the command dispatcher a single responsibility: determine which command should run.

The implementation details belong to the command handler.

## Separating Dispatch From Execution

This separation is one of the most important architectural decisions in the project.

The command loop should not need to understand how every command works.

Its responsibility is essentially:

```text
Read input
   ↓
Clean input
   ↓
Find command
   ↓
Execute handler
```

The individual handler is responsible for the operation itself.

For example, the `explore` command can deal with exploration-specific logic without forcing the main REPL loop to understand locations, Pokémon encounters, API responses, or pagination.

This creates a useful boundary:

```text
REPL
 │
 ├── Command: map
 │
 ├── Command: explore
 │
 ├── Command: catch
 │
 ├── Command: inspect
 │
 └── Command: pokedex
```

The REPL becomes the coordinator rather than the implementation of every feature.

## The REPL as the Application Boundary

A command-line application needs a loop that continuously accepts user input.

The REPL is responsible for maintaining that interaction.

A simplified flow looks like this:

```go
for {
    input := readInput()

    command, exists := commands[input.Command]
    if !exists {
        fmt.Println("Unknown command")
        continue
    }

    err := command.callback(config, input.Args)
    if err != nil {
        fmt.Println(err)
    }
}
```

The important architectural property is not the exact syntax.

It is the separation of responsibilities.

The REPL knows:

* how to receive input;
* how to identify a command;
* how to invoke the command;
* when to continue or terminate.

It does not need to know how a Pokémon is fetched or how a location is represented internally.

That keeps the application easier to extend.

## Managing Application State

Some CLI commands need state that persists across multiple interactions.

PokedexCLI is a good example.

The user may:

1. Explore an area.
2. Catch a Pokémon.
3. Inspect the Pokémon.
4. View the collection.

Those commands need access to a shared application state.

A configuration structure can provide that boundary.

Conceptually:

```go
type config struct {
    nextLocationURL *string
    previousLocationURL *string
    client          *http.Client
    cache           *Cache
    pokedex         map[string]Pokemon
}
```

The exact structure can evolve as the application grows, but the principle remains the same:

> State that belongs to the application should be explicit.

This is preferable to scattering mutable state across unrelated functions.

## Why Explicit State Is Valuable

Explicit state makes dependencies visible.

If a command needs access to the API client, cache, or user's Pokedex, those dependencies can be passed through the application configuration.

That makes the function's requirements easier to understand.

It also improves testing.

A function that receives its dependencies can be tested with controlled inputs instead of relying on hidden global state.

This becomes particularly important when external systems are involved.

## Keeping the API Client Separate

PokedexCLI communicates with an external Pokémon API.

That creates another architectural boundary.

The CLI should not need to know the low-level details of constructing every HTTP request.

A dedicated client layer can encapsulate those concerns.

Conceptually:

```text
Command
   │
   ▼
API Client
   │
   ▼
HTTP Request
   │
   ▼
Pokémon API
```

The command asks for application data.

The API client handles the mechanics of retrieving it.

This separation makes the application easier to evolve if the API changes later.

## The Importance of Data Models

External API responses should be represented using Go structures.

For example:

```go
type LocationArea struct {
    Name string `json:"name"`
    URL  string `json:"url"`
}
```

The model provides a boundary between raw JSON and application logic.

Instead of passing loosely structured JSON throughout the application, the API client can decode the response into meaningful Go types.

That improves readability and reduces the amount of parsing logic scattered across commands.

## Pagination as Application State

Location exploration introduces another interesting architectural problem: pagination.

A command such as:

```text
map
```

may retrieve one page of locations.

The next invocation should retrieve the next page.

That means pagination cannot exist solely inside one HTTP request.

The application needs to remember where the user currently is.

Conceptually:

```text
Current page
    │
    ├── next URL
    │
    └── previous URL
```

The configuration state can retain those URLs.

The command then becomes responsible for moving the application through the paginated resource.

This is a useful example of how apparently simple CLI functionality can become an application-state problem.

## Caching External API Requests

Repeated API requests are another architectural concern.

Without caching, the same resource may be requested repeatedly:

```text
CLI
 │
 ▼
API
 │
 ▼
Response
```

With a cache:

```text
CLI
 │
 ▼
Cache
 ├── hit ──────► Response
 │
 └── miss
       │
       ▼
      API
       │
       ▼
    Response
       │
       ▼
     Cache
```

The cache becomes an optimization boundary.

More importantly, it changes the application's behavior around external dependencies.

A cache can reduce unnecessary network traffic, improve responsiveness, and make repeated exploration more efficient.

For a CLI application that repeatedly queries the same resources, this is a practical improvement rather than an abstract optimization.

## Designing for Extensibility

A command registry also makes adding future commands much easier.

Suppose the application initially supports:

```text
help
exit
map
mapb
explore
```

Later, additional commands can be introduced:

```text
catch
inspect
pokedex
```

The command dispatcher does not need to become increasingly complicated.

The new behavior can be registered alongside the existing commands.

This is one of the main advantages of designing around explicit command definitions.

The architecture grows by addition rather than by continuously expanding a central conditional statement.

## Error Handling at the Command Boundary

Errors should also have clear ownership.

Network failures, invalid arguments, unknown commands, and malformed API responses are different classes of failure.

A command should generally return an error rather than forcing the entire application to terminate.

For example:

```go
result, err := client.GetLocation(name)
if err != nil {
    return err
}
```

The REPL can then decide how the error should be presented.

This creates another useful separation:

```text
Command
   │
   ▼
Returns error
   │
   ▼
REPL
   │
   ▼
User-facing message
```

The lower-level function reports what went wrong.

The interface layer decides how to communicate it.

## Designing Small Functions

Another principle that becomes important as the project grows is keeping functions focused.

A function that:

* parses input;
* performs HTTP requests;
* updates the cache;
* modifies the Pokedex;
* formats output;

is doing too much.

Smaller functions make the system easier to understand.

For example:

```text
cleanInput()
    ↓
parse command
    ↓
command handler
    ↓
API client
    ↓
cache
    ↓
domain data
    ↓
output
```

Each stage has a defined responsibility.

This does not mean creating abstractions for everything.

The goal is useful boundaries, not abstraction for its own sake.

## What This Architecture Makes Possible

The most valuable result of this architecture is not simply that the current commands work.

It creates room for the application to evolve.

A clean command boundary makes new commands easier to add.

An API client boundary makes external communication easier to modify.

A cache boundary makes performance improvements easier to introduce.

Explicit application state makes command interactions predictable.

Data models make API responses easier to reason about.

Together, these decisions turn a small CLI exercise into a practical backend engineering project.

## Lessons From Building PokedexCLI

PokedexCLI reinforced a principle that applies far beyond command-line applications:

> Small applications still benefit from deliberate architecture.

The project does not require a distributed microservice architecture or a large dependency-injection framework.

It needs clear boundaries.

The most useful boundaries are the ones that reflect actual responsibilities:

```text
User Input
    ↓
REPL
    ↓
Command Dispatcher
    ↓
Command Handler
    ↓
Application State
    ↓
API Client / Cache
    ↓
External API
```

That structure keeps the system understandable while leaving room for additional functionality.

## Final Thoughts

PokedexCLI is intentionally smaller than a production backend platform, but that is exactly what makes it useful as an engineering exercise.

A small system exposes fundamental design decisions without hiding them behind frameworks.

Command dispatch, state management, API integration, caching, pagination, error handling, and data modeling are all problems that appear in larger backend systems as well.

The difference is scale.

The underlying engineering principles remain remarkably similar.

For me, the most important lesson from PokedexCLI is that maintainability begins long before a codebase becomes large.

Good architecture is not about building the most complicated system possible.

## It is about giving each part of the system a clear job—and making those boundaries easy to understand

## Related Topics

* Go CLI application architecture
* Command-driven application design
* REST API clients in Go
* API response modeling
* Application state management
* HTTP caching
* Backend engineering
* Developer tooling
* Software architecture
