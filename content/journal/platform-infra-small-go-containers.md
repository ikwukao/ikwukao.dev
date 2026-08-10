---

title: "Building Small Go Containers with Multi-Stage Docker Builds and scratch"
description: "How Platform-Infra uses multi-stage Docker builds and scratch images to produce small, deployment-focused Go containers."
date: 2026-08-14
draft: false
featured: false
tags:

  - Docker
  - Go
  - Kubernetes
  - Containers
  - Platform Engineering
  - DevOps

---

## Building Small Go Containers with Multi-Stage Docker Builds and `scratch`

Container size matters.

Not because a small image automatically makes an application better, but because unnecessary image contents increase the amount of software that has to be transferred, stored, scanned, and maintained.

For **Platform-Infra**, I wanted the containerization workflow to remain intentionally lean.

The project therefore uses multi-stage Docker builds and targets extremely small final images for suitable Go services.

## Why Multi-Stage Builds?

A Go application generally requires a compiler and build tooling during compilation.

The final application does not necessarily need those tools at runtime.

That creates an obvious separation:

```text
Build Environment
    │
    ├── Go compiler
    ├── source code
    └── dependencies
            │
            ▼
        Compiled Binary
            │
            ▼
Runtime Image
    └── application
```

A multi-stage Dockerfile allows those two environments to remain separate.

The builder stage performs compilation.

The final stage contains only what the application needs to execute.

## The Problem with Shipping the Build Environment

A straightforward container can include:

* compiler
* package manager
* source code
* build dependencies
* shell utilities
* application binary

Most of those components are irrelevant after compilation.

Shipping them into production increases the image footprint without providing value to the running application.

Multi-stage builds solve that problem by leaving the build environment behind.

## Why `scratch`?

Go is particularly interesting for minimal container images because statically compiled binaries can often run without a conventional Linux userland.

That makes the Docker `scratch` base image an attractive option for suitable services.

A conceptual build looks like:

```dockerfile
FROM golang AS builder

# Build application
# ...

FROM scratch

COPY --from=builder /app/service /service

ENTRYPOINT ["/service"]
```

The resulting runtime image starts from essentially nothing.

Only the application artifacts deliberately copied into the image are present.

## The Platform-Infra Target

One of the engineering targets in Platform-Infra is keeping final transit images below **20 MB**.

That target encourages deliberate container construction.

Instead of asking:

> "What can I put into this image?"

the workflow becomes:

> "What does this process actually need at runtime?"

That is a much healthier question.

## Smaller Does Not Always Mean Better

Minimal images are not universally appropriate.

A production application may require:

* CA certificates
* timezone data
* shared libraries
* debugging tools
* shell utilities

depending on how it is built and what it does.

A `scratch` image therefore requires more consideration than simply changing the base image.

For Platform-Infra, the point is experimentation with the trade-off between minimalism and operational requirements.

## Why This Matters in Kubernetes

Kubernetes frequently pulls container images onto nodes.

Smaller images can reduce:

* image transfer time
* storage requirements
* startup overhead associated with pulling images
* the amount of software present in the runtime environment

These benefits become more noticeable as deployment frequency and cluster size increase.

## Build Reproducibility

Container builds are also part of infrastructure reproducibility.

If the Dockerfile clearly defines how the application is compiled, another engineer can understand the relationship between source code and runtime artifact.

That makes the container itself part of the platform's documented architecture.

## Platform Engineering Perspective

The interesting lesson is that container optimization is not merely a Docker trick.

It is a platform-engineering concern.

The platform controls how applications are packaged, transported, deployed, and operated.

A well-designed container pipeline creates a predictable artifact that Kubernetes can consume.

That gives us another clean boundary:

```text
Go Source
   ↓
Compiler
   ↓
Static Binary
   ↓
Minimal Container
   ↓
Kubernetes
```

## What I Took Away

The most useful lesson was learning to distinguish build-time requirements from runtime requirements.

A compiler belongs in the build environment.

The application binary belongs in the runtime environment.

Everything else should have a reason for being there.

That mindset makes container construction more intentional and makes infrastructure easier to optimize.

For Platform-Infra, the goal is simple:

**Build small artifacts, understand exactly what they contain, and make the deployment pipeline reproducible.**
