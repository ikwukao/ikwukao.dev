---

title: "Worker Pools in Go: Controlling Concurrency in High-Throughput Systems"
description: "Why Strata-Log uses a fixed worker pool to control concurrency, protect resources, and separate network ingestion from slower storage operations."
date: 2026-08-13
draft: false
tags:
       - Go
       - Concurrency
       - Worker Pools
       - Distributed Systems
       - Backend Engineering
       - Performance

---

Concurrency is one of Go's greatest strengths.

It is also one of the easiest things to use without enough boundaries.

Creating another goroutine is cheap compared with creating an operating-system thread, but that does not mean an application should create unlimited concurrent work.

Strata-Log uses a fixed worker-pool architecture to make concurrency an explicit resource.

## The Problem With Unbounded Work

Imagine a service receiving a sudden burst of log traffic.

A naive architecture might create a new worker for every unit of incoming work.

At first, that can appear to scale beautifully.

But downstream systems have limits.

CPU is limited.

Memory is limited.

Disk throughput is limited.

File descriptors are limited.

Eventually, the amount of incoming work can exceed the system's ability to process it.

The problem then becomes one of controlling the queue between demand and capacity.

## A Fixed Worker Pool

Strata-Log uses a worker pool to establish that boundary.

```text
Incoming Work
      │
      ▼
    Channel
      │
 ┌────┼────┬────┐
 ▼    ▼    ▼    ▼
 W1   W2   W3   W4
 │    │    │    │
 └────┴────┴────┘
          │
          ▼
       Storage
```

The number of active workers is controlled.

New work enters the queue and workers consume it.

This produces a much more predictable concurrency model than allowing processing capacity to grow indefinitely.

## Why Channels Fit the Model

Go channels provide a natural communication boundary between producers and consumers.

The network-facing side can produce work.

The worker pool consumes it.

The storage layer receives the processed data.

Each component can therefore have a relatively clear responsibility.

This separation also makes the system easier to test because the processing pipeline does not have to be tightly coupled to the network connection itself.

## Concurrency Versus Throughput

More concurrency does not automatically mean more throughput.

Suppose a disk subsystem can sustainably process 10,000 operations per second.

Increasing the number of workers from 10 to 100 does not magically make the disk capable of processing 100,000 operations per second.

Instead, additional concurrency may simply increase contention and memory usage.

The goal is therefore not maximum concurrency.

The goal is **appropriate concurrency**.

## Worker Pools as a Resource Boundary

A worker pool effectively says:

> This is how much parallel processing the system is willing to perform.

That makes it a form of resource governance.

When workload increases beyond available processing capacity, the system can queue, slow producers, reject work, or apply another backpressure strategy.

The important part is that the behavior is designed rather than accidental.

## Protecting the Storage Layer

The worker pool is especially useful because Strata-Log has two very different performance characteristics.

Network input can arrive quickly.

Disk writes are slower.

Without separation, those workloads can interfere directly with each other.

The worker layer creates an intermediate processing boundary:

```text
Fast Network Input
        │
        ▼
   Controlled Work
        │
        ▼
 Buffered Storage
        │
        ▼
       Disk
```

The storage system can therefore batch writes rather than forcing every network operation to wait for an individual disk operation.

## Goroutines Still Matter

Using a worker pool does not mean avoiding goroutines.

The system still relies heavily on Go's concurrency model.

The important distinction is between **using concurrency** and **allowing concurrency to become unlimited**.

Goroutines provide the execution mechanism.

The worker pool provides the policy.

## Context and Shutdown

A worker pool also needs a clean lifecycle.

Workers should not remain alive indefinitely after the application begins shutting down.

Strata-Log coordinates worker completion with `sync.WaitGroup`.

The shutdown process can therefore wait for active work to finish before final storage flushes occur.

That avoids leaving background workers behind after the main server has terminated.

## Measuring the Result

The Strata-Log workload is designed around high-volume concurrent processing.

The system has been tested against a simulated workload reaching approximately **165,000 log lines per second**.

Again, this is a project-specific benchmark result rather than a claim that the architecture will sustain that throughput in every environment.

The useful part of the benchmark is that it gives the architecture a demanding workload against which its design decisions can be evaluated.

## What Worker Pools Taught Me

The most useful lesson was that concurrency needs a budget.

A system becomes easier to reason about when the engineer can answer:

* How many workers exist?
* How is work queued?
* What happens when workers are busy?
* How does downstream storage affect throughput?
* How are workers stopped?
* How is buffered work drained?

Those questions turn concurrency from an implementation detail into an architectural concern.

## Related Project

See [Strata-Log](../projects/strata-log/) for the complete implementation and system architecture.
