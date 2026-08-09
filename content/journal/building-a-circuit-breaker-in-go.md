---

title: "Building a Circuit Breaker in Go"
description: "A practical look at implementing a concurrent circuit breaker in Go to prevent cascading failures in backend services."
date: 2026-08-09
draft: false
featured: true
tags:
  - Go
  - Golang
  - Circuit Breaker
  - Distributed Systems
  - Fault Tolerance
  - Concurrency
keywords:
  - circuit breaker Go
  - Go circuit breaker
  - circuit breaker pattern
  - fault tolerance Go
  - preventing cascading failures

---

## Building a Circuit Breaker in Go

A backend service does not operate in isolation.

Even a relatively simple HTTP handler may depend on databases, caches, authentication services, payment providers, internal APIs, or other microservices.

When one of those dependencies becomes unhealthy, repeatedly calling it can make the original problem much worse.

This is where the **circuit breaker pattern** becomes useful.

While building Flux-Gateway, I implemented a circuit breaker in Go to explore how a gateway can detect repeated upstream failures and stop sending traffic to a dependency that is already known to be unhealthy.

## The Problem

Consider a gateway forwarding requests to an upstream service:

```text
Client
  |
  v
Gateway
  |
  v
Upstream
```

If the upstream starts timing out, every request can consume resources while waiting.

Under increasing traffic:

```text
100 requests
   |
   v
100 slow upstream calls
   |
   v
More waiting goroutines
   |
   v
More resource consumption
```

The dependency's failure begins affecting the gateway itself.

That is the beginning of a cascading failure.

## The Circuit Breaker Model

A circuit breaker introduces explicit states.

The common model consists of:

```text
CLOSED
  |
  | failures exceed threshold
  v
OPEN
  |
  | recovery timeout
  v
HALF-OPEN
  |
  +---- success ----> CLOSED
  |
  +---- failure ----> OPEN
```

### Closed

In the closed state, requests are allowed through normally.

Failures are recorded.

### Open

When failures exceed the configured threshold, the circuit opens.

Requests are rejected immediately instead of being forwarded.

### Half-Open

After a recovery period, the circuit permits a limited request to determine whether the upstream has recovered.

If the test succeeds, the circuit closes.

If it fails, the circuit opens again.

## Why Synchronization Matters

A circuit breaker is shared state.

Multiple requests can attempt to update it simultaneously.

That means a naive implementation can introduce race conditions.

Flux-Gateway uses `sync.RWMutex` to protect circuit state.

The important principle is to keep state transitions explicit and synchronized.

For example, the decision to allow a request and the transition of the circuit state should not be allowed to observe contradictory values.

## Fail Fast

The most useful property of an open circuit is that requests fail quickly.

Instead of:

```text
Request
  |
  v
TCP connection
  |
  v
Wait
  |
  v
Timeout
  |
  v
Failure
```

the gateway can do:

```text
Request
  |
  v
Circuit OPEN
  |
  v
Immediate failure
```

This is particularly important under high concurrency.

Failing quickly releases resources so the gateway can continue serving traffic that is actually useful.

## Testing the State Machine

A circuit breaker is essentially a state machine, which makes table-driven tests a natural fit.

Tests can cover transitions such as:

* closed → open
* open → half-open
* half-open → closed
* half-open → open

They can also verify that concurrent access does not introduce races.

The native Go race detector provides an additional safety layer during development.

## The Bigger Lesson

The circuit breaker pattern is not about preventing failures.

Failures are inevitable.

The goal is to prevent a failing dependency from consuming unlimited resources and turning a local failure into a system-wide incident.

That distinction changed how I think about backend reliability.

A resilient service needs to know not only how to succeed, but also how to **stop doing something that is clearly failing**.

Flux-Gateway is where I am exploring that idea in practice.

**[Explore Flux-Gateway →](/projects/flux-gateway/)**
