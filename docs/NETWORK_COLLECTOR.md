# Network Collector

## Goal

Collect local Linux network statistics without reading packet payloads. The collector reads counters from `/proc/net/dev` and interface metadata from `/sys/class/net`, stores them in PostgreSQL, and exposes them via the existing Express API.

## Data sources

### `/proc/net/dev`

This file contains live interface counters such as:

- RX bytes
- TX bytes
- RX packets
- TX packets
- RX errors
- TX errors
- RX dropped
- TX dropped

### `/sys/class/net`

This directory contains interface metadata including:

- interface name
- `address` (MAC)
- `operstate`
- flags

### OS network interfaces

Node.js `os.networkInterfaces()` provides local IP addresses for each interface, which is used to populate the IPv4 and IPv6 values.

## Rate calculation

The collector calculates throughput with delta-based differences:

- RX bytes/sec = (current RX bytes - previous RX bytes) / elapsedSeconds
- TX bytes/sec = (current TX bytes - previous TX bytes) / elapsedSeconds
- RX packets/sec = (current RX packets - previous RX packets) / elapsedSeconds
- TX packets/sec = (current TX packets - previous TX packets) / elapsedSeconds

If counters reset or go backwards, the collector treats the delta as zero and preserves stability for the application.

## Scheduler

The monitoring scheduler runs in the backend as a background singleton and does not block HTTP handlers.

Intervals:

- collection: 1 second
- flush to DB: 5 seconds

Both are configurable through the scheduler startup options.

The scheduler is started when the backend starts and stopped on shutdown to avoid orphan collectors.

## Database structure

### network_interfaces

Stores the current known interfaces and metadata.

Fields:

- id
- name
- mac_address
- ipv4_address
- ipv6_address
- operstate
- is_loopback
- is_up
- last_seen_at
- created_at
- updated_at

### network_metrics

Stores a time series of interface snapshots and computed throughput.

Fields include:

- interface_id
- collected_at
- rx_bytes
- tx_bytes
- rx_packets
- tx_packets
- rx_errors
- tx_errors
- rx_dropped
- tx_dropped
- rx_bytes_per_sec
- tx_bytes_per_sec
- rx_packets_per_sec
- tx_packets_per_sec
- status
- is_up

Large counters use PostgreSQL `BIGINT` and throughput uses `DOUBLE PRECISION`.

## API

Available endpoints under `/api/v1/network`:

- GET `/api/v1/network/interfaces`
- GET `/api/v1/network/interfaces/:interfaceName`
- GET `/api/v1/network/interfaces/:interfaceName/speed`
- GET `/api/v1/network/metrics/latest`
- GET `/api/v1/network/metrics/history`

The API reuses the existing Express middleware stack and Zod validation conventions.

## Reliability handling

The collection logic treats the following as non-fatal conditions:

- no interfaces available
- no read permission
- PostgreSQL temporary failure
- interface resets
- interface appear/disappear events
- time drift or stale readings
- partial invalid counter values

The backend logs errors and continues processing without crashing the application.

## Linux-specific limitations

- Only local machine metrics are collected.
- The collector reads counters, not packet payloads.
- Loopback is excluded by default but can be included when needed.
- This implementation is designed for Linux system interfaces inside `/sys/class/net` and `/proc/net/dev`.

## Current status

The collector is implemented as a backend service and is ready for Linux monitoring usage in the existing HelpdeskPrime architecture, while keeping the application and API model intact.
