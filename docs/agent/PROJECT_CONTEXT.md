# PROJECT_CONTEXT.md

## Project Summary
This project is a production-like marketplace for **used computer hardware**.

### Example categories
- CPU
- GPU
- RAM
- SSD / HDD
- Motherboard
- PSU
- Monitor
- Mouse
- Keyboard
- Laptop (optional later)
- Networking gear (optional later)

The project is intentionally designed to expose realistic backend and frontend complexity:
- auth and RBAC
- listing creation and moderation
- search / filtering / sorting / pagination
- media uploads
- messaging and anti-spam
- reservations / orders (later)
- notifications
- caching and queues
- admin tools
- audit logs

## Main User Roles
- **BUYER** — browses listings, sends messages, may reserve/buy items later
- **SELLER** — creates and manages listings, responds to messages
- **ADMIN** — moderates listings/users/messages, reviews reports, audits changes

## Core Domain Concepts
### Listing
A listing is a seller-created advertisement for a hardware item.
It includes:
- title
- description
- category
- brand (optional / normalized later)
- condition
- price
- count of items
- location/city
- attributes (category-specific structured data)
- status (draft/published/archived/sold/blocked)
- seller owner
- media/photos
- moderation flags (later)

### Listing Attributes (Important)
Category-specific attributes must **not** be modeled as many nullable columns.
Use:
- a common `listings` table/model
- `attributes` as JSON/JSONB
- category-specific validation schemas

Examples:
- CPU attributes: socket, cores, threads, baseClockGHz
- RAM attributes: capacityGb, type(DDR4/DDR5), speedMhz
- Monitor attributes: sizeInches, resolution, refreshRateHz, panelType

## Future Production-Like Features (Planned)
- anti-spam and phishing link detection in messages
- rate limiting
- moderation queues and review states
- audit log (who changed what and when)
- delayed notifications (BullMQ)
- caching hot catalog queries (Redis)
- idempotency for critical write flows
- background jobs and retries
- observability basics (logs, health checks, metrics later)

## Non-Goals (for early sprints)
- Microservices from day 1
- Event sourcing
- CQRS everywhere
- RabbitMQ from day 1
- Kubernetes
- Overly complex architecture before core marketplace flows work

## Learning Goal Alignment
Every implementation should optimize for:
1. production realism
2. maintainability
3. observability
4. testability
5. security
6. developer experience