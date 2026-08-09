---

title: "Building Distributed Rate Limiting with Redis and Lua"
description: "How Flux-Gateway uses Redis Lua scripts to implement atomic traffic control across multiple gateway instances."
date: 2026-08-10
draft: false
featured: true
tags:
   - Redis
   - Go
   - Rate Limiting
   - Lua
   - Distributed Systems
   - API Gateway
keywords:
   - Redis rate limiting
   - Redis Lua rate limiter
   - distributed rate limiting
   - Go Redis rate limiter
   - API gateway rate limiting

---

## Building Distributed Rate Limiting with Redis and Lua

Rate limiting sounds simple until an application runs on more than one machine.

A single process can keep a counter in memory.

A distributed gateway cannot rely on local state alone.

While building Flux-Gateway, I used Redis and Lua scripts to explore how traffic control can remain atomic when multiple gateway instances are operating simultaneously.

## Why Local Rate Limiting Is Not Enough

Imagine two gateway instances:

```text
             Client Traffic
                  |
          +-------+-------+
          |               |
          v               v
     Gateway A       Gateway B
          |               |
          +-------+-------+
                  |
                 Redis
```

If each gateway maintains its own counter, the global limit is no longer global.

Each instance sees only its local traffic.

A shared datastore is therefore needed when the rate limit applies across the deployment.

## The Race Condition

A naive implementation might perform:

```text
GET counter
CHECK limit
INCREMENT counter
```

The problem is that these are separate operations.

Two requests can interleave:

```text
Request A -> GET = 99
Request B -> GET = 99

Request A -> allowed
Request B -> allowed

Request A -> INCREMENT = 100
Request B -> INCREMENT = 101
```

The application intended to allow one request.

Instead, both requests were admitted.

## Atomic Redis Lua Scripts

Redis Lua scripts allow related operations to execute atomically inside Redis.

Instead of moving the decision-making logic back and forth between the gateway and Redis, the gateway sends the operation as a single script execution.

Conceptually:

```text
Gateway
   |
   | execute script
   v
Redis
   |
   +-- check counter
   +-- evaluate limit
   +-- update state
   +-- return decision
```

The gateway receives the result rather than performing each state transition independently.

## Why This Matters for a Gateway

Traffic control belongs close to the edge.

If a backend service is already overloaded, allowing more requests through does not improve the situation.

A gateway can reject excess traffic before it reaches downstream services.

That provides a protective layer between clients and internal workloads.

## Testing the Limiter

Distributed infrastructure is difficult to test if every test requires a real external service.

Flux-Gateway uses Miniredis for deterministic Redis testing.

This makes it possible to test:

* request limits
* counter behavior
* concurrent requests
* expiration
* rejection paths

without requiring a production Redis deployment during normal development.

## The Engineering Lesson

The most important lesson was not "use Redis."

It was understanding **where atomicity needs to exist**.

If multiple operations together represent one logical decision, splitting them across independent network calls creates opportunities for race conditions.

Distributed systems force you to think carefully about those boundaries.

Flux-Gateway is my practical exploration of that problem.

**[Explore the project →](/projects/flux-gateway/)**
