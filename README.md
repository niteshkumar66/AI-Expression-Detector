# AI Magic Mirror & Real-Time Expression Suite ✨

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary%20%2F%20All%20Rights%20Reserved-red.svg)](LICENSE)
[![Platform: Web (WASM/WebGL)](https://img.shields.io/badge/Platform-Browser%20%7C%20On--Device-blue.svg)]()
[![Privacy: Zero-Telemetry](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald.svg)]()

> **An interactive, browser-based facial tracking and dynamic effects experience powered by on-device computer vision and low-latency landmark classification.**

---

## 🌟 Overview

**AI Magic Mirror** is a real-time interactive computer vision application developed for high-engagement, touch-friendly kiosk and showcase environments. Operating entirely within client-side WebAssembly and WebGL runtimes, the system detects user facial landmarks, models head pose kinematics, and triggers dynamic vector-based visual effects reacting to live facial movements.

### Key Highlights
- **100% Client-Side Pipeline:** Zero external API dependencies, zero cloud telemetry, and zero biometric persistence. All video processing and landmark calculations remain strictly inside the local browser sandbox.
- **Dual-Face Simultaneous Tracking:** Capable of tracking multiple independent faces concurrently with per-face pose smoothing and isolated visual overlays.
- **Adaptive Micro-Smoothing:** Uses speed-adaptive low-pass filtering (One Euro Filter architecture) to eliminate camera sensor jitter while preserving sub-30ms responsiveness.
- **Physical Expression Classification:** Evaluates high-dimensional blendshapes with hysteresis and debounce filtering to reliably detect smiles, winks, eyebrow elevations, downturns, and mouth opening.
- **Dynamic Modular Visual Layers:** Generates real-time procedural canvas visuals, physics-driven accessories, and particle halos tuned to selectable color palettes.

---

## 🎭 Experience Modes & Effects

| Effect Module | Description | Reactive Mechanics |
| :--- | :--- | :--- |
| **Golden Imperial Crown** | Ornate metallic headpiece anchored to forehead vector | Angular roll/pitch compensation with smile-activated sparkle bursts |
| **Aero Shades** | Polarized procedural eyewear with metallic sheen | Rotational spring-damper flip animation triggered by eyebrow elevation |
| **Radiant Aura** | Radial perimeter particle halo | Emission velocity and particle density scale dynamically with smile intensity |
| **Prismatic Cascade** | Undulating multi-channel color ribbon stream | Velocity-driven dispersion emitted on mouth opening |
| **Celestial & Heart Overlays** | Animated eye replacements with depth tracking | Wink asymmetry recognition, pucker droplet particle emissions |
| **Cyber Wireframe Mesh** | High-density 478-node facial topology visualization | Real-time anatomical contour rendering with holographic scanning line |
| **Dynamic Animal Archetypes** | Procedural ears and facial anchors | Angular inertia physics and head-tilt spring recoil |

---

## 🛡️ Privacy Architecture

This project was built from the ground up to comply with strict privacy standards for public exhibits, educational venues, and family events:

1. **No Data Transmission:** The application does not establish outbound telemetry sockets or transmit camera frames across the network.
2. **Zero Biometric Profiling:** The vision models classify purely geometric physical landmark positions. No facial recognition, emotional diagnosis, or demographic labeling is performed.
3. **Transient Memory Footprint:** Video frame buffers and landmark tensors are discarded immediately after rendering each frame.

---

---

## ⚖️ Intellectual Property & Copyright Notice

**Copyright © 2026 Nitesh Kumar. All Rights Reserved.**

### Terms of Use:
- **No Unauthorized Reproduction:** The source code, visual design, custom shaders, and architectural assets contained in this repository are proprietary.
- **No Commercial Exploitation:** No part of this project may be copied, modified, distributed, sublicensed, sold, or used for commercial purposes without explicit prior written authorization from the copyright holder.
- **Academic & Portfolio Reference Only:** This repository is hosted publicly solely for demonstration, peer review, and portfolio evaluation purposes.

For licensing inquiries, collaboration requests, or deployment permissions, please contact the repository owner directly.


