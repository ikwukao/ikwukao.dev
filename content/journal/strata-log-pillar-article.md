---

title: "Building Strata-Log: Designing a High-Throughput Distributed Log Aggregator in Go"
description: "How I designed Strata-Log in Go to process thousands of concurrent TCP log streams while controlling memory usage, garbage-collection pressure, and disk I/O."
date: 2026-08-20
draft: false
tags:

  - Go
  - Distributed Systems
  - TCP
  - Concurrency
  - Performance Engineering
  - Systems Programming
  - Backend Engineering
  - Observability

---

## Building Strata-Log: Designing a High-Throughput Distributed Log Aggregator in Go

When a backend system starts receiving logs from hundreds or thousands of concurrent sources, the problem stops being simply **"how do I write logs to disk?"**

The harder questions become:

* How many connections can the system handle simultaneously?
* How much memory does each connection consume?
* What happens when incoming traffic is faster than disk I/O?
* How do we prevent a burst of traffic from exhausting system resources?
* How do we shut the system down without losing buffered data?
* Where does garbage collection begin to affect latency and throughput?

These questions became the foundation for **Strata-Log**, a high-throughput distributed log aggregation engine I built in Go.

The goal was not to create another logging library. I wanted to explore what happens when a relatively simple backend service is pushed toward systems-level constraints: raw TCP connections, concurrent producers, bounded workers, reusable memory, buffered writes, and graceful shutdown.

The result is an engineering project centered around one question:

> **How much throughput can a carefully designed Go service achieve when memory allocation, concurrency, and I/O are treated as first-class design concerns?**

---

## The Problem I Wanted to Solve

Traditional application logging usually assumes that the destination can keep up with the producer.

A service writes a message, a logging library formats it, and eventually the message reaches a file, stream, or centralized logging platform.

That model becomes less comfortable when the number of producers increases significantly.

Imagine a system receiving:

```text
Service A ─┐
Service B ─┤
Service C ─┤
Service D ─┤
Service E ─┤──> TCP ingestion ──> processing ──> storage
   ...     ┤
Service N ─┘
```

Every connection can produce data independently.

The ingestion layer therefore needs to deal with several competing constraints:

1. **Network concurrency**
2. **CPU scheduling**
3. **Memory usage**
4. **Garbage collection**
5. **Disk throughput**
6. **Backpressure**
7. **Shutdown coordination**

Optimizing only one of these can easily create a bottleneck somewhere else.

For example, accepting more TCP connections increases ingestion capacity, but unrestricted concurrency can also increase memory pressure.

Similarly, writing every log line immediately to disk simplifies the implementation but creates unnecessary I/O overhead.

Strata-Log was an attempt to design these boundaries deliberately.

---

## The Engineering Goals

I defined several goals before implementing the system.

### High ingestion throughput

The system should be capable of processing a very large number of log lines per second without requiring an enormous number of application-level workers.

### Controlled memory usage

A burst in incoming traffic should not cause memory usage to grow without bounds.

### Efficient allocation

Repeatedly allocating buffers for every incoming message would create unnecessary garbage and increase pressure on Go's garbage collector.

### Concurrent processing

Network connections should be handled concurrently while expensive downstream operations remain bounded.

### Efficient storage

Disk writes should be batched instead of issuing a separate write operation for every log line.

### Predictable shutdown

The service should be able to stop accepting new work while allowing existing work and buffered data to complete safely.

These goals naturally pushed the architecture toward a combination of **TCP ingestion, worker pools, buffer reuse, asynchronous storage, and coordinated shutdown**.

---

## Architecture

At a high level, Strata-Log separates the system into several stages:

```text
                    ┌─────────────────────┐
                    │   TCP Log Sources   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   TCP Ingestion     │
                    │  Connection Loops   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Worker Pool       │
                    │                     │
                    │ Worker  Worker ...  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Buffered Storage    │
                    │      Manager        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Disk          │
                    └─────────────────────┘
```

The important architectural decision is that **network ingestion and disk persistence are not allowed to become the same operation**.

The TCP layer is responsible for receiving data.

The worker pool is responsible for bounded concurrent processing.

The storage manager is responsible for efficiently moving processed data to disk.

This separation makes it possible to reason about each stage independently.

---

## Why Raw TCP?

For this project, I deliberately avoided hiding the ingestion layer behind a higher-level HTTP framework.

Logs are fundamentally streams of data, and TCP provides a useful systems-level environment for exploring that problem.

Using raw TCP allowed me to work directly with:

* connections
* read deadlines
* byte buffers
* network backpressure
* connection lifecycle
* concurrent connection handling

It also exposed an important reality of backend engineering:

**network I/O is not the same thing as application processing.**

A TCP connection can remain active while the system behind it is temporarily busy.

That means the architecture needs a way to prevent slow downstream operations from blocking the entire ingestion path.

---

## Connection Handling

Each incoming TCP connection is handled independently.

Conceptually, the server follows this lifecycle:

```text
Accept connection
       │
       ▼
Configure read deadline
       │
       ▼
Read incoming data
       │
       ▼
Submit work
       │
       ▼
Continue receiving
       │
       ▼
Connection closes
```

Read deadlines are particularly important.

A connection that remains open indefinitely without sending useful data can otherwise consume resources indefinitely.

Using kernel-level read deadlines provides a mechanism for detecting stalled connections and reclaiming resources.

This is a small implementation detail, but it represents a broader systems principle:

> **Every long-lived resource should have a lifecycle and a failure boundary.**

---

## The Worker Pool

One of the most important architectural decisions was to avoid creating an unrestricted processing goroutine for every piece of work.

Go makes goroutines cheap, but "cheap" does not mean "free."

If incoming traffic increases dramatically, unrestricted concurrency can eventually create:

* excessive scheduling overhead
* memory pressure
* contention
* unpredictable latency
* downstream resource exhaustion

Instead, Strata-Log uses a **fixed worker-pool architecture**.

```text
                 Incoming Work
                      │
                      ▼
                ┌───────────┐
                │   Queue    │
                └─────┬─────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Worker 1    Worker 2    Worker N
          │           │           │
          └───────────┼───────────┘
                      ▼
                Storage Layer
```

The number of workers becomes a deliberate capacity boundary.

Instead of allowing incoming traffic to determine the number of active workers, the application determines its processing capacity.

This makes the system easier to reason about under load.

---

## Why a Fixed Worker Pool?

Consider two designs.

### Unbounded concurrency

```text
10,000 incoming tasks
        ↓
10,000 goroutines
```

This may work under light traffic.

Under sustained load, however, the system can end up spending more resources managing concurrency than processing useful work.

### Bounded concurrency

```text
10,000 incoming tasks
        ↓
      Queue
        ↓
   8–32 workers
        ↓
    Storage
```

Now the processing stage has a known concurrency limit.

The queue becomes part of the backpressure mechanism.

This does not magically make an overloaded system infinitely scalable. Instead, it makes overload behavior explicit.

That distinction matters.

A reliable system should degrade predictably rather than simply consuming every available resource.

---

## The Allocation Problem

Once the basic architecture was working, another problem became obvious.

High-throughput systems can generate enormous numbers of short-lived allocations.

Consider a simplified processing loop:

```go
for {
    buffer := make([]byte, bufferSize)

    // read data

    process(buffer)
}
```

If that allocation occurs repeatedly, the system creates a large amount of temporary garbage.

The garbage collector eventually needs to discover and reclaim those objects.

At moderate throughput, this may be perfectly acceptable.

At very high throughput, however, allocation behavior can become part of the performance profile.

That led to one of the central optimization experiments in Strata-Log:

**buffer reuse.**

---

## Reusing Buffers with `sync.Pool`

Go's `sync.Pool` provides a mechanism for temporarily reusing allocated objects.

Instead of constantly allocating a new buffer:

```text
allocate
   ↓
use
   ↓
discard
   ↓
allocate again
```

the system can follow:

```text
pool
 │
 ├── get buffer
 │
 ▼
use buffer
 │
 ▼
return buffer
 │
 └──────────────> pool
```

The goal is not to eliminate every allocation in the application.

The goal is to reduce unnecessary allocation in a hot path where objects are repeatedly created and discarded.

Strata-Log therefore uses a custom buffer-recycling layer built around `sync.Pool`.

This became one of the most interesting performance experiments in the project.

---

## The Benchmark Result

The buffer-recycling design reached an observed benchmark result of:

```text
0 allocs/op
```

That result is significant because allocations per operation directly influence the amount of garbage the runtime must eventually manage.

Reducing allocations does not automatically make an application faster.

However, in a workload dominated by repeated buffer creation, reducing allocation pressure can significantly improve the stability of the processing pipeline.

The broader lesson is more important than the benchmark itself:

> **Performance optimization should target measured bottlenecks rather than assumptions.**

`sync.Pool` is not a universal performance solution.

It becomes useful when the workload repeatedly creates temporary objects with compatible lifetimes and reuse patterns.

---

## Separating Network I/O from Disk I/O

Another important design decision was separating network ingestion from persistence.

This matters because network traffic and disk operations have very different performance characteristics.

A network connection may produce data continuously.

A disk, however, may be significantly slower and more variable.

If every network read immediately performs a disk write, the ingestion path becomes coupled to storage latency.

Conceptually:

```text
TCP read
   ↓
disk write
   ↓
TCP read
   ↓
disk write
```

This means storage latency directly affects ingestion throughput.

Strata-Log instead uses an asynchronous storage layer:

```text
TCP
 │
 ▼
Workers
 │
 ▼
Memory Buffer
 │
 ▼
Buffered Writer
 │
 ▼
Disk
```

The worker layer can continue processing while the storage manager batches writes.

---

## Buffered Disk Writes

Writing every log line individually is expensive.

If thousands of lines arrive each second, performing thousands of independent writes introduces unnecessary system-call and filesystem overhead.

Strata-Log therefore uses `bufio.Writer` to batch sequential writes.

The basic idea is straightforward:

```text
incoming lines
      │
      ▼
256 KB memory page
      │
      ├── line
      ├── line
      ├── line
      ├── line
      │
      ▼
batched write
      │
      ▼
disk
```

The project uses a **256 KB in-memory page buffer** as part of this storage strategy.

Instead of treating every log line as an independent disk operation, the system accumulates data and writes it in larger batches.

This improves the relationship between ingestion throughput and storage throughput.

---

## Throughput vs Durability

Buffering introduces an important trade-off.

The larger the buffer, the more efficiently the system can batch writes.

But more data sitting in memory also means more data potentially waiting to reach durable storage.

That creates a fundamental engineering tension:

```text
More buffering
      ↓
Better throughput
      ↓
More data temporarily in memory
      ↓
Potentially greater loss during abrupt failure
```

There is no universally correct buffer size.

The right value depends on the application's requirements.

For Strata-Log, the purpose of the 256 KB buffer is to explore this trade-off while maintaining predictable resource usage.

---

## Synchronization and Durability

The storage manager also needs a mechanism for periodically synchronizing buffered data.

Waiting forever for a buffer to fill would maximize batching efficiency but would make durability unpredictable.

Instead, background synchronization can periodically flush buffered data.

Conceptually:

```text
Incoming data
      │
      ▼
Memory buffer
      │
      ├── buffer reaches threshold ──► flush
      │
      └── timer expires ─────────────► flush
```

This creates two useful boundaries:

1. **Size-based flushing**
2. **Time-based flushing**

The combination provides a balance between throughput and durability.

---

## Handling Bursts

The real challenge is not processing a steady stream of data.

It is handling sudden bursts.

For example:

```text
Normal traffic
──────────────────────────────

██████████████████████████████


Traffic burst
──────────────────────────────

██████████████████████████████████████████████████████████████
```

A system designed only around average throughput can fail badly during bursts.

Strata-Log therefore treats memory as a finite resource.

The worker pool limits processing concurrency.

The buffers provide temporary storage.

The storage layer drains data asynchronously.

Together, these boundaries prevent every stage of the system from expanding without control.

---

## The 165,000 Lines/Second Experiment

One of the project's performance experiments pushed the system toward approximately:

```text
165,000 log lines / second
```

The benchmark was useful not simply because of the number itself, but because it exposed how the individual architectural decisions interacted.

At this scale, seemingly small implementation details become significant.

For example:

* unnecessary allocations become expensive
* excessive goroutines increase scheduling pressure
* small writes increase I/O overhead
* uncontrolled buffers increase memory usage
* slow storage can create backpressure
* poorly coordinated shutdown can lose buffered data

The benchmark therefore became an architectural test rather than merely a speed test.

---

## Graceful Shutdown

High-throughput systems need to think about how they stop.

A process termination signal should not simply result in:

```text
kill
 ↓
process exits
 ↓
buffered data disappears
```

Strata-Log uses coordinated shutdown with `sync.WaitGroup` and explicit worker lifecycle management.

The intended shutdown sequence is:

```text
Shutdown signal
      │
      ▼
Stop accepting new work
      │
      ▼
Allow active work to finish
      │
      ▼
Stop workers
      │
      ▼
Flush buffered storage
      │
      ▼
Close resources
      │
      ▼
Exit
```

The objective is to make shutdown an explicit state transition rather than an afterthought.

This is particularly important for systems that maintain buffered state.

---

## Avoiding Zombie Workers

Concurrency creates another shutdown problem.

A worker that is waiting indefinitely on a channel or network operation can prevent the process from shutting down cleanly.

The system therefore needs explicit cancellation and lifecycle coordination.

This is where context-aware operations become useful.

The broader pattern is:

```text
Parent lifecycle
      │
      ├── network workers
      ├── processing workers
      └── storage workers
```

When the parent lifecycle ends, each child component needs a predictable path toward termination.

This avoids leaving background goroutines alive after the main application has stopped.

---

## What the Architecture Taught Me

The most valuable part of Strata-Log was not the final benchmark.

It was learning how several relatively simple design decisions interact.

A fixed worker pool by itself does not create a high-throughput system.

`sync.Pool` by itself does not create a high-throughput system.

Buffered I/O by itself does not create a high-throughput system.

Raw TCP by itself does not create a high-throughput system.

The result comes from composing the boundaries correctly:

```text
             ┌────────────────────┐
             │     Raw TCP         │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Bounded Concurrency│
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Buffer Reuse       │
             │ sync.Pool          │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Async Storage      │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Buffered I/O       │
             └─────────┬──────────┘
                       │
                       ▼
                    Storage
```

Each layer solves a different constraint.

---

## The Most Important Lessons

### 1. Throughput is an architectural property

You cannot reliably optimize a high-throughput system by looking at one function at a time.

The entire data path matters.

### 2. Concurrency needs boundaries

Go makes concurrent programming accessible, but unrestricted concurrency is still a resource-management problem.

Worker pools provide a useful boundary.

### 3. Allocations matter in hot paths

When an operation executes hundreds of thousands of times per second, even small allocations can become significant.

Measure them.

Then optimize them when the evidence justifies it.

### 4. Storage should not dictate ingestion speed

Separating network processing from disk persistence allows each subsystem to operate according to its own constraints.

### 5. Buffers are a trade-off

More buffering can improve throughput but increases the amount of data temporarily held in memory.

Performance and durability need to be considered together.

### 6. Shutdown is part of the architecture

A system is not complete simply because it can start and process traffic.

It should also be able to stop without leaving resources behind or silently discarding buffered work.

---

## What I Would Improve Next

Strata-Log is intentionally focused on the core ingestion and storage pipeline, but there are several directions I would explore in a production-oriented version.

### Horizontal scaling

The current architecture can be extended toward multiple ingestion nodes behind a load balancer.

```text
                Load Balancer
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Node A       Node B       Node C
          │           │           │
          └───────────┼───────────┘
                      ▼
                Storage Layer
```

### Durable distributed storage

Local disk is useful for experimentation, but production log aggregation typically requires a more durable and distributed storage strategy.

### Structured log formats

Supporting structured formats such as JSON would make downstream querying and analysis more useful.

### Metrics

The ingestion layer could expose metrics such as:

* active connections
* lines processed
* bytes received
* queue depth
* worker utilization
* flush frequency
* write latency
* dropped messages

### Backpressure policies

A mature implementation should explicitly define what happens when incoming traffic exceeds processing capacity.

Possible strategies include:

* blocking producers
* bounded queues
* controlled dropping
* prioritization
* sampling

The correct strategy depends on the system's reliability requirements.

---

## Closing Thoughts

Building Strata-Log changed how I think about performance-oriented backend systems.

The interesting part of systems engineering is rarely a single clever optimization.

It is usually the interaction between constraints.

Network connections consume resources.

Concurrency increases throughput but introduces coordination costs.

Memory reuse reduces allocation pressure but adds lifecycle considerations.

Buffering improves I/O efficiency but introduces durability trade-offs.

Graceful shutdown requires every subsystem to understand its lifecycle.

Those constraints are what make the problem interesting.

Strata-Log gave me a practical environment for exploring those trade-offs in Go while working directly with concurrency, TCP networking, memory management, buffered I/O, and backend performance.

The next stage of the project is less about simply pushing the throughput number higher and more about understanding **how the system behaves when individual components become the bottleneck**.

That is where the most useful engineering lessons usually begin.

---

## Related Strata-Log Articles

This article is the foundation for a deeper technical series covering the engineering decisions behind Strata-Log:

* **Zero-Allocation Logging in Go: Using `sync.Pool` to Reduce GC Pressure**
* **Designing Worker Pools in Go for Concurrent TCP Log Processing**
* **Buffered I/O in Go: Batching Disk Writes Without Losing Data**
* **Handling 165,000 Log Lines per Second: Performance Engineering Strata-Log**

Each article will examine one part of the system in greater depth, including the reasoning behind the implementation decisions and the trade-offs involved.

---

## Project

**Strata-Log** is an experimental high-throughput distributed log aggregation engine built in Go.

The project focuses on: **High Throughput · Memory Efficiency · Concurrency · TCP Networking · Buffered I/O · Graceful Shutdown**
