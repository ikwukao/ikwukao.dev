---

title: "Building a Reliable REST API Client in Go for PokedexCLI"
description: "How PokedexCLI uses Go's HTTP primitives to communicate with a REST API, decode structured responses, handle failures, and keep network concerns isolated from command logic."
date: 2026-08-09
draft: false
tags:

  - Go
  - Golang
  - REST API
  - HTTP
  - API Client
  - PokedexCLI
  - Backend Engineering
  - Networking
categories:
  - Backend Engineering
  - Go

---

## Building a Reliable REST API Client in Go for PokedexCLI

A command-line application becomes considerably more interesting when it has to communicate with a remote service.

PokedexCLI does not contain all of its data locally. Much of the information the application needs comes from the Pokémon API, which means the application has to deal with HTTP requests, JSON responses, network failures, pagination, and external service boundaries.

Rather than allowing every command to construct its own HTTP requests, I treated API communication as a dedicated responsibility.

The result is a small but important architectural boundary:

```text
CLI Command
    │
    ▼
API Client
    │
    ▼
HTTP
    │
    ▼
Pokémon API
```

That separation keeps command implementations focused on application behavior instead of networking details.

## Why Build an API Client?

It is possible to make an HTTP request directly from a command handler.

For a small application, that might initially seem reasonable:

```go
resp, err := http.Get(url)
```

The problem appears when several commands need the API.

Soon, request construction, status-code handling, JSON decoding, and error handling begin appearing in multiple places.

That creates duplicated logic.

A dedicated client provides one place for those concerns.

Instead of commands thinking about HTTP mechanics, they can think in terms of operations such as:

```text
GetLocations()
GetLocationArea()
GetPokemon()
```

That is a much more useful abstraction for the application.

## The API Client as a Boundary

The client sits between the application and the external service.

```text
Application
     │
     ▼
API Client
     │
     ├── Request construction
     ├── HTTP transport
     ├── Status handling
     ├── JSON decoding
     └── Error propagation
             │
             ▼
        External API
```

This boundary has an important property: changes to the external API do not automatically have to propagate through the entire application.

If the API response format changes, the client and its data models are the first places that need attention.

## Modeling JSON Responses in Go

One of the strengths of Go for API clients is its straightforward JSON support.

An API response can be represented using structs.

For example:

```go
type LocationArea struct {
    Name string `json:"name"`
    URL  string `json:"url"`
}
```

The JSON tags define how fields map to the remote representation.

This creates a clean transition:

```text
JSON
 ↓
Go struct
 ↓
Application logic
```

The rest of the application no longer needs to work with raw JSON.

## Keeping Network Logic Out of Commands

A command should not have to understand the details of decoding an HTTP response.

A cleaner flow is:

```text
explore command
      │
      ▼
API client
      │
      ▼
HTTP request
      │
      ▼
JSON response
      │
      ▼
Go model
      │
      ▼
command output
```

The command asks for information.

The client retrieves and decodes it.

This makes both components easier to reason about.

## HTTP Status Codes Matter

A successful HTTP request does not necessarily mean the operation succeeded.

An HTTP request can complete successfully while the server returns:

* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* 429 Too Many Requests
* 500 Internal Server Error

A useful API client therefore needs to distinguish transport success from application-level success.

The general sequence is:

```text
Send request
    ↓
Did transport succeed?
    ↓
Check HTTP status
    ↓
Decode response
    ↓
Return application data
```

Skipping status validation can result in confusing downstream failures.

## Handling Network Errors

External systems are inherently unreliable.

DNS failures, connection problems, timeouts, interrupted connections, and remote server failures can all occur.

The client should return those errors rather than hiding them.

For example:

```go
resp, err := httpClient.Do(req)
if err != nil {
    return nil, err
}
defer resp.Body.Close()
```

The important principle is that failures should remain visible to the layer responsible for deciding how they should be presented.

## Closing Response Bodies

HTTP response bodies represent resources.

They should be closed when processing is complete:

```go
defer resp.Body.Close()
```

This is a small implementation detail with significant practical value.

A CLI may make many requests during one interactive session. Consistently releasing resources helps prevent unnecessary connection and resource consumption.

## Pagination and URLs

The Pokémon API exposes paginated resources.

That means the API client should not assume that all resources arrive in one response.

A paginated response can conceptually look like:

```text
Current Page
 ├── results
 ├── next
 └── previous
```

The application can preserve those navigation URLs as part of its state.

This allows commands such as:

```text
map
```

and:

```text
mapb
```

to move forward and backward through the remote dataset.

The API client retrieves the requested page; the application state determines where the user currently is.

## Avoiding Hidden API Knowledge

A command such as `map` should not need to know how pagination is encoded by the remote API.

Ideally, the command interacts with a client method and receives structured application data.

This keeps external API details contained.

That matters because external APIs are dependencies, not part of the application's core domain.

## API Clients and Testability

A clean API boundary also improves testing.

If network logic is scattered throughout the application, tests have to understand HTTP implementation details.

If the network boundary is isolated, the rest of the application can be tested independently.

The goal is not to create an enormous mocking framework.

It is simply to keep responsibilities separated enough that tests do not require a real external service for every behavior.

## Data Transformation

The API response is not always the exact representation the CLI needs.

The client can decode remote data into Go structures, after which application logic can select the information relevant to the user.

For example:

```text
Remote API response
        │
        ▼
Go response model
        │
        ▼
Application representation
        │
        ▼
CLI output
```

This avoids coupling presentation directly to the external JSON schema.

## Error Propagation

One of the simplest and most effective patterns in Go is explicit error propagation.

```go
data, err := client.GetLocation(url)
if err != nil {
    return err
}
```

There is no hidden exception system.

The failure is explicit.

That makes control flow easier to follow, particularly in applications where several operations depend on external services.

## What I Learned From the API Layer

Building the API client reinforced an important backend engineering principle:

> External systems deserve explicit boundaries.

The Pokémon API is outside the application's control.

It can be slow.

It can fail.

Its response structure can change.

Its availability cannot be assumed.

By keeping it behind a dedicated client, the rest of PokedexCLI can remain focused on the application's behavior.

## Final Thoughts

The API client in PokedexCLI is relatively small, but it represents a pattern that scales well beyond a learning project.

Production backend systems frequently sit between an application and external services.

The same principles apply:

* isolate network concerns;
* model external data explicitly;
* validate responses;
* propagate errors;
* release resources;
* separate remote representations from application behavior.

PokedexCLI provided a compact environment in which to practice those fundamentals.

## The code may be small, but the engineering lessons are applicable to considerably larger systems

## Related Topics

* Go HTTP clients
* REST API design
* JSON decoding in Go
* Backend networking
* API error handling
* Go application architecture
