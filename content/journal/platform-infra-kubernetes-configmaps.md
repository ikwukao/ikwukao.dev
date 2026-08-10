---

title: "Designing Kubernetes Deployments with Namespaces and ConfigMaps"
description: "How Platform-Infra separates workloads and operational configuration using Kubernetes namespaces and ConfigMaps."
date: 2026-08-13
draft: false
featured: false
tags:

  - Kubernetes
  - ConfigMaps
  - Platform Engineering
  - Infrastructure
  - DevOps
  - Configuration Management

---

## Designing Kubernetes Deployments with Namespaces and ConfigMaps

A Kubernetes deployment is more than a container specification.

Once an application moves beyond a simple experiment, questions about configuration and resource organization become important.

Where should the workload live?

Which configuration belongs to the application?

Which values belong to the environment?

How can those values change without rebuilding the container?

These questions influenced the design of **Platform-Infra**.

## Separating Workloads

Platform-Infra uses Kubernetes namespaces to create logical boundaries between different workloads.

The project currently separates workloads such as:

* `flux-ingress`
* `strata-analytics`

The objective is straightforward: infrastructure should communicate ownership and purpose clearly.

A namespace gives related Kubernetes resources a shared organizational context.

That becomes increasingly useful when multiple services coexist in the same cluster.

## Why Configuration Should Be Externalized

Operational parameters often change independently of application code.

For example, a service may expose configuration for:

* worker-pool size
* buffer size
* runtime behavior
* operational limits
* environment-specific settings

Embedding those values directly into a Docker image creates unnecessary coupling.

Changing a configuration value would require rebuilding and redeploying the image.

That is not always desirable.

## ConfigMaps

Kubernetes ConfigMaps provide a mechanism for storing non-sensitive configuration separately from the application container.

Conceptually:

```text
Container Image
      │
      │ application
      ▼
   Workload
      ▲
      │ configuration
      │
   ConfigMap
```

The application image remains portable.

The environment provides the configuration.

This is a simple architectural distinction, but it becomes valuable as deployment environments multiply.

## Environment-Specific Configuration

Consider a worker pool.

A local development environment might require only a small number of workers.

A more demanding environment could require a larger pool.

The application should not need two different binaries to accommodate those environments.

Instead:

```text
Development
worker_pool = small

Production
worker_pool = larger
```

The same application image can consume different configuration values.

That is one of the principles Platform-Infra is designed to reinforce.

## Configuration Is Part of the Platform

Configuration management is sometimes treated as an afterthought.

I prefer to think of it as part of the platform contract.

The platform determines:

* which configuration is available
* how it reaches the workload
* which environment owns it
* how it is changed
* how it is documented

This reduces the amount of implicit knowledge required to operate the service.

## Namespace Design

Namespaces also provide a useful mental model for platform ownership.

Instead of thinking:

> "There are several deployments somewhere in Kubernetes."

the infrastructure can express:

> "This namespace contains the resources associated with this platform capability."

That distinction matters when a cluster grows.

Clear organizational boundaries reduce cognitive overhead.

## Avoiding Configuration Leakage

External configuration also reduces the temptation to place environment-specific values directly into source code.

This matters for more than convenience.

Hardcoded infrastructure settings can make applications:

* harder to deploy
* harder to test
* harder to reuse
* harder to configure

A cleaner boundary is:

```text
Application
    │
    │ consumes configuration
    ▼
Runtime Environment
    │
    └── Kubernetes ConfigMap
```

The application focuses on behavior.

The platform focuses on environment.

## What I Learned

The important lesson was not simply how to create a ConfigMap or namespace.

It was understanding why the boundaries exist.

Good infrastructure design makes responsibilities visible.

Namespaces organize workloads.

ConfigMaps separate operational configuration.

Containers package applications.

Terraform manages infrastructure intent.

Kubernetes orchestrates the resulting workloads.

Each component has a responsibility, and the platform becomes easier to reason about when those responsibilities remain distinct.

## The Bigger Picture

Platform-Infra is deliberately small enough to understand but structured around concepts that scale beyond a local cluster.

The same principles become relevant in larger environments:

**separation of concerns, declarative infrastructure, externalized configuration, reproducibility, and clear resource ownership.**

Those principles are ultimately more important than the individual Kubernetes commands used to implement them.
