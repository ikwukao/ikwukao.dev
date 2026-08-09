---

title: "Adding RED Metrics to a Go API Gateway"
description: "How I approached observability in Flux-Gateway using Prometheus metrics for request rate, errors, and latency."
date: 2026-08-18
draft: false
featured: true
tags:
  - Go
  - Prometheus
  - Observability
  - Monitoring
  - API Gateway
  - Distributed Systems
keywords:
  - RED metrics Go
  - Prometheus Go API
  - Go observability
  - API gateway monitoring
  - Prometheus HTTP metrics

---

## Adding RED Metrics to a Go API Gateway

A backend system can be fast, reliable, and well designed and still be difficult to operate if nobody can see what it is doing.

That is why observability became an explicit part of Flux-Gateway rather than something added after the core functionality.

The project exposes Prometheus metrics through a dedicated metrics endpoint and focuses on the RED model: **Rate, Errors, and Duration**.

## Rate

Rate answers a basic question:

**How much traffic is the service handling?**

A sudden increase in request rate can explain why downstream resources are becoming saturated.

It can also reveal unexpected traffic patterns before they become incidents.

## Errors

Error rate provides another dimension.

A service processing thousands of requests per second may appear healthy until the percentage of failed requests begins increasing.

Tracking successful and failed requests separately makes that change visible.

## Duration

Latency tells us how long requests take.

Average latency is useful, but tail latency is often more interesting for distributed systems.

A service may have an acceptable average while a small percentage of requests experience very long delays.

That is why p95 and p99 latency are useful signals when analyzing backend performance.

## Why Put Metrics at the Gateway?

The gateway sees traffic entering and leaving the system.

That makes it a useful observation point.

A simplified architecture looks like:

```text
Clients
   |
   v
+-----------+
| Gateway   |
|           |
| Rate      |
| Errors    |
| Duration  |
+-----+-----+
      |
      v
 Services
```

The gateway can therefore provide a high-level view of the health of the request path.

## Dedicated Metrics Endpoint

Flux-Gateway exposes telemetry through a dedicated endpoint at:

```text
:8090/metrics
```

Prometheus can scrape this endpoint and store the resulting time-series data.

This separation keeps operational telemetry independent from normal application responses.

## Observability Is an Engineering Feature

The deeper lesson is that observability should influence architecture.

If a system cannot expose meaningful signals about its behavior, debugging production problems becomes significantly harder.

Metrics do not prevent failures.

They reduce the amount of time engineers spend trying to understand them.

## What I Learned

While building Flux-Gateway, observability stopped feeling like a monitoring checkbox.

It became part of the system's design.

Reliable systems need reliable feedback loops.

The ability to see request rate, error behavior, and latency is one of the foundations of those loops.

**[Explore Flux-Gateway →](/projects/flux-gateway/)**
