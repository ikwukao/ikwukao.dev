---
title: "Strata-Log"
description: "An ultra-high-throughput distributed log aggregation engine in Go designed to safely process thousands of concurrent log streams over raw TCP sockets."
date: 2026-08-08
draft: false
featured: true
status: "Distributed Systems"
github: "https://github.com/ikwukao/strata-log"
technologies:
  - Go
  - TCP
  - sync.Pool
  - Worker Pools
  - bufio
  - Linux
metrics:
  - label: "Throughput"
    value: "165,000 lines/sec"
  - label: "Heap Benchmark"
    value: "0 allocs/op"
  - label: "Page Buffer"
    value: "256 KB"
---

## Overview

Strata-Log is an ultra-high-throughput distributed log aggregation engine in Go designed to safely process thousands of concurrent log streams over raw TCP network sockets.

## Engineering Highlights

- Designed a zero-allocation byte-buffer recycling tier using a custom `sync.Pool` wrapper.
- Achieved an optimal `0 allocs/op` performance footprint in heap benchmarks.
- Reduced garbage-collection pressure and eliminated allocation-driven latency spikes.
- Built a context-aware fixed worker-pool architecture using channels.
- Decoupled low-level Linux TCP socket connections from slower disk input/output operations.
- Protected system memory ceilings during bursts reaching 165,000 log lines per second.
- Developed an asynchronous buffered storage manager using a 256KB in-memory page buffer.
- Used `bufio.Writer` to batch sequential writes to disk.
- Added background synchronization timers to balance write batching with data durability.
- Implemented connection-handling loops using kernel-level `SetReadDeadline` controls.
- Coordinated graceful shutdown with `sync.WaitGroup`.
- Designed shutdown paths to avoid zombie threads and guarantee buffered data flushes.

## Engineering Focus

**High Throughput · Memory Efficiency · Concurrency · TCP Networking · Buffered I/O · Graceful Shutdown**
