---

title: "Handling 165,000 Log Lines per Second: Performance Engineering Lessons from Strata-Log"
description: "Performance engineering lessons from Strata-Log, including throughput benchmarking, allocation behavior, concurrency, buffering, and identifying real bottlenecks."
date: 2026-08-13
draft: false
tags:

  - Go
  - Performance Engineering
  - Benchmarking
  - Distributed Systems
  - Backend Engineering

---

## Handling 165,000 Log Lines per Second: Performance Engineering Lessons from Strata-Log

Performance numbers are easy to publish and surprisingly difficult to interpret.

A statement such as "165,000 log lines per second" sounds impressive, but the number is only useful when the conditions behind it are understood.

What workload produced it?

What hardware was used?

What counted as a successful operation?

Where was the bottleneck?

What happened to memory usage?

These questions matter more than the headline number.

While building **Strata-Log**, the target benchmark reached approximately **165,000 log lines per second**. The more valuable outcome, however, was understanding the engineering decisions that made that throughput possible.

## Start With a Bottleneck

Performance optimization should begin with a problem.

It is easy to optimize code that looks inefficient without knowing whether that code actually limits the system.

A better process is:

```text
Measure
  ↓
Identify Bottleneck
  ↓
Change One Thing
  ↓
Measure Again
  ↓
Keep or Revert
```

This prevents optimization from becoming guesswork.

## What the System Has to Do

At a high level, Strata-Log performs several operations for incoming data:

```text
Receive TCP Data
      ↓
Process Bytes
      ↓
Dispatch Work
      ↓
Worker Processing
      ↓
Buffer Data
      ↓
Persist
```

Every stage can become a bottleneck.

The system therefore has to avoid optimizing one stage while accidentally making another stage dominant.

## Throughput Is a Pipeline Property

Suppose the network layer can process 200,000 messages per second but storage can only sustain 100,000.

The system cannot meaningfully sustain 200,000 end-to-end.

The slowest constrained stage determines the effective throughput.

That is why the architecture separates network ingestion from storage.

The system can process incoming work asynchronously while the storage subsystem operates at its own pace.

## Allocation Pressure

One of the major performance areas investigated in Strata-Log was memory allocation.

Repeated temporary allocations create additional work for the runtime.

The project therefore introduced reusable byte buffers and a custom `sync.Pool`-based recycling layer.

The targeted benchmark reached:

```text
0 allocs/op
```

That result helped demonstrate that the benchmarked processing path could avoid per-operation allocations under the tested conditions.

It also provided a measurable target for future changes.

## Why Allocation Counts Matter

Allocation count is not the same thing as total application performance.

A system with fewer allocations is not automatically faster.

Other factors matter:

* CPU utilization;
* memory bandwidth;
* network throughput;
* disk throughput;
* synchronization;
* lock contention;
* system calls.

Allocation benchmarks are useful because they tell us something specific.

They should be interpreted alongside other measurements.

## Concurrency and Worker Pools

Strata-Log uses a fixed worker-pool architecture.

The objective is not to maximize the number of goroutines.

It is to provide enough parallelism to keep the processing pipeline busy without allowing concurrency to become uncontrolled.

A simplified model is:

```text
Incoming Streams
       │
       ▼
     Queue
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
 W1    W2    W3
 │     │     │
 └─────┼─────┘
       ▼
    Storage
```

The appropriate worker count depends on the workload and available resources.

More workers can help until contention or downstream bottlenecks begin dominating.

## Memory Pressure During Bursts

High throughput often arrives in bursts.

A system that behaves well under steady traffic may behave very differently when traffic suddenly increases.

The architecture therefore needs to consider what happens when incoming data temporarily exceeds processing capacity.

Unbounded buffering is dangerous because it converts traffic bursts into memory growth.

Bounded workers and controlled buffering make the system's resource usage more predictable.

## Buffered Storage

Storage efficiency also contributes to throughput.

Strata-Log uses a 256 KB page buffer and `bufio.Writer` to batch sequential writes.

This reduces the need to perform tiny writes repeatedly.

But again, buffering is not free.

It introduces memory consumption and creates a durability boundary.

Performance improvements always have to be evaluated alongside their operational consequences.

## Benchmark Conditions Matter

A benchmark number should always be accompanied by enough context to understand what it means.

Useful benchmark information includes:

* workload characteristics;
* test duration;
* concurrency level;
* hardware;
* operating system;
* whether the benchmark is local or networked;
* whether storage is included;
* whether the result represents peak or sustained throughput.

Without this context, a number can easily be misunderstood.

The 165,000-lines-per-second result for Strata-Log should therefore be treated as a project benchmark rather than a universal performance guarantee.

## Avoiding Premature Optimization

One of the most useful lessons from performance work is that optimization can make software harder to understand.

A simple implementation is often preferable until measurements demonstrate that it is insufficient.

The progression should be:

```text
Correct
  ↓
Measure
  ↓
Optimize
  ↓
Measure
  ↓
Document
```

Not:

```text
Guess
  ↓
Optimize Everything
  ↓
Hope
```

## Performance and Correctness

There is also a dangerous temptation to sacrifice correctness for a benchmark.

That is rarely worthwhile for infrastructure software.

A logging system that processes 165,000 lines per second but silently loses data is not necessarily better than a slower system that preserves its guarantees.

Performance has to exist within the system's correctness requirements.

That means measuring both:

**How much work can the system process?**

and:

**What guarantees does the system provide while doing it?**

## What I Learned From Strata-Log

The biggest lesson was that performance engineering is mostly systems thinking.

The interesting optimization was not one clever line of code.

It was the interaction between:

* raw TCP networking;
* bounded concurrency;
* worker pools;
* reusable buffers;
* asynchronous storage;
* buffered writes;
* controlled memory usage;
* graceful shutdown.

Each decision affects the others.

That is what makes performance engineering difficult—and interesting.

## Closing Thoughts

The 165,000-lines-per-second benchmark became a useful milestone for Strata-Log, but the number itself was never the most important result. The real value came from understanding the system deeply enough to explain where the throughput came from.Performance engineering is ultimately about turning measurements into engineering decisions.
The benchmark tells you what happened. The architecture helps explain why.
