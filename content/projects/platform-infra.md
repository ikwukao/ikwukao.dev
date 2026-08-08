---
title: "Platform-Infra"
description: "A master multi-project orchestration repository applying Infrastructure-as-Code principles to declaratively manage configurations and workloads for core Go services."
date: 2026-08-08
draft: true
featured: true
status: "Platform Engineering"
github: "https://github.com/ikwukao/platform-infra"
technologies:
  - Terraform
  - Kubernetes
  - Docker
  - Bash
  - Make
  - Minikube
  - K3s
metrics:
  - label: "Container Image"
    value: "<20 MB"
  - label: "Rollout Target"
    value: "<25 sec"
  - label: "Environments"
    value: "Minikube / K3s"
---

## Overview

Platform-Infra is a master multi-project orchestration repository applying Infrastructure-as-Code principles to declaratively manage configurations and workloads for core Go services.

## Engineering Highlights

- Authored declarative Terraform configurations for local Kubernetes infrastructure.
- Partitioned Kubernetes workloads into isolated `flux-ingress` and `strata-analytics` namespaces.
- Deployed managed stateful caching nodes through infrastructure configuration.
- Designed Kubernetes ConfigMaps to separate environment parameters from deployment code.
- Injected operational parameters such as worker-pool bounds and buffer sizes through dynamic container environments.
- Built a unified CLI task-runner workflow using Makefile targets and automated Bash scripts.
- Coordinated cross-compilation and multi-stage Docker builds.
- Used `scratch` base images to minimize final container image size.
- Targeted final transit images below 20MB.
- Designed deployment workflows targeting rollouts under 25 seconds.

## Engineering Focus

**Infrastructure as Code · Kubernetes · Terraform · Containers · Automation · Platform Engineering**
