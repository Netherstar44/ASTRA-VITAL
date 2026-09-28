# ASTRA-VITAL: Distributed Health Architecture

## 1. System Philosophy & Purpose
ASTRA-VITAL is a distributed, human-centered health monitoring and predictive risk prevention platform engineered for deep-space and planetary surface operations (Moon, Mars, Venus, Deep Space).

**Core Motto:**
> **DETECTAR → ENTENDER → PREDECIR → PREVENIR → ACTUAR**

The platform is designed under an **edge-first** computing paradigm: it does not assume persistent network connectivity to Earth or mission control. Critical physiological processing, risk assessment, and alerting operate autonomously at the closest computational node to the astronaut.

---

## 2. Distributed Node Topology

```
+-----------------------------------------------------------------------------------+
|                        1. ASTRONAUT HEALTH EDGE NODE                              |
|   (Wearable BIOSEN-9 Suite + Suit Microprocessor: IMU, PPG, Dosimeter, Capno)     |
|   - Real-time normalization, calibration, SNR noise filtering                     |
|   - Deterministic risk engine & behavioral tremor analysis                        |
|   - Instant HUD audio/haptic alert synthesis (zero Earth latency dependency)     |
+------------------------------------------+----------------------------------------+
                                           | Store-and-Forward (Priority P0-P4)
                                           v
+-----------------------------------------------------------------------------------+
|                         2. VEHICLE / RELAY NODE                                   |
|   (Lunar Rover / Habitat Local Area Wireless Mesh - DTN Hop 1)                    |
|   - Multi-crew correlation & local data cache                                     |
|   - Environmental space weather fusion (Proton flux dosimeters)                   |
|   - Priority bundle queueing during line-of-sight occultation                      |
+------------------------------------------+----------------------------------------+
                                           | DTN Inter-node sync
                                           v
+-----------------------------------------------------------------------------------+
|                     3. LUNAR GATEWAY / SURFACE HABITAT                            |
|   - Long-term clinical trending across mission days                               |
|   - Aggregated telemetry storage                                                  |
+------------------------------------------+----------------------------------------+
                                           | Deep Space Network (DSN, 1.8s - 22min delay)
                                           v
+-----------------------------------------------------------------------------------+
|                       4. EARTH MISSION CONTROL (HOUSTON)                          |
|   - Flight Surgeon console (pathophysiology & capnometry)                         |
|   - Flight Controller console (systems telemetry & DTN recovery)                  |
|   - Neuro-Behavioral health monitoring & post-mission analytics                   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Flow & Signal Pipeline

```
Raw Biosensors (9 Channels)
           │
           ▼
[ Pipeline 1: Calibration & Normalization ]
           │
           ▼
[ Pipeline 2: Noise Filtering & Uncertainty Estimation ]
           │
           ▼
[ Trusted Telemetry (Quality Score >= 0.90) ]
           ├───► [ Deterministic Risk Rules (IF radiation↑ AND EVA THEN HIGH) ]
           ├───► [ AI Anomaly Detection & Behavioral Heuristics ]
           └───► [ Multidimensional CrewState Engine ]
                       │
                       ▼
             [ Alert Manager ]
           (Decoupled from UI)
     Maps severity to Symbol + Audio + Haptic + Priority
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ Local HUD & Audio/Haptic ]   [ DTN Buffer (P0-P4 Queue) ]
(Immediate Actionable UX)        (Store-and-Forward to Earth)
```

---

## 4. Priority Queue & DTN Protocol

Data packets are tagged with strict delay-tolerant priorities:
- **P0 (Critical / Medical Emergency):** Flushed immediately over any available link. Zero drop policy.
- **P1 (Action Required / High Risk):** Dispatched upon reconnect before telemetry frames.
- **P2 (Observation / Environmental Warning):** Cached locally with 1-hour TTL.
- **P3 (Nominal Telemetry / Periodic):** Regular stream (1 Hz).
- **P4 (Background Logs / Sensor Calibration):** Transmitted only during high-bandwidth windows.

### Store-and-Forward Resilience
When communication links degrade or fail (crater occultation, coronal mass ejections):
1. Packets route to non-volatile local memory (`DTNStore`).
2. Retry tracker applies exponential backoff ($2^n$ seconds, ceiling 60s).
3. Upon signal acquisition, high-priority queues flush first without packet duplication.
