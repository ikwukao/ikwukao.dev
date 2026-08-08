---
title: "Flux-Gateway"
description: "A high-performance, fault-tolerant API Gateway and Reverse Proxy engineered in Go to protect downstream microservices from traffic spikes and cascading network partitions."
date: 2026-08-08
draft: true
featured: true
status: "Flagship Project"
github: "https://github.com/ikwukao/flux-gateway"
technologies:
  - Go
  - Redis
  - Docker
  - Kubernetes
  - Prometheus
  - GitHub Actions
metrics:
  - label: "Simulated Load"
    value: "14,200 req/sec"
  - label: "Fail-Fast Latency"
    value: "<0.4 ms"
  - label: "Quality Gate"
    value: "70% Coverage"
---

## Overview

Flux-Gateway is a high-performance API Gateway and Reverse Proxy built in Go from scratch to safeguard downstream microservices from traffic spikes and cascading network partitions.

## Engineering Highlights

- Engineered an in-memory, thread-safe Circuit Breaker using Go `sync.RWMutex` primitives.
- Reduced failed-request latency from a 2000ms TCP connection timeout to less than 0.4 milliseconds through automated fail-fast edge boundaries.
- Built a low-latency traffic-policing tier using atomic Redis Lua script execution to prevent race conditions across multi-node scaling contexts.
- Validated the traffic-policing layer under a simulated load of 14,200 requests per second.
- Integrated concurrent background health probers using `context.Context` timeout handles to actively evaluate upstream cluster degradation.
- Implemented automated circuit-state transitions based on upstream health.
- Added a decoupled telemetry interface at `:8090/metrics`.
- Exported Prometheus RED metrics for application observability and p95/p99 latency analysis.
- Practiced table-driven TDD alongside the native Go race detector.
- Used Miniredis in-memory mocks for deterministic Redis testing.
- Established a GitHub Actions quality gate requiring a minimum of 70% code coverage.

## Engineering Focus

**Reliability · Concurrency · Fault Tolerance · Traffic Control · Observability · Testing**
