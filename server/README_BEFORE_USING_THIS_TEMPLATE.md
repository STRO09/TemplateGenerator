
# Node.js Backend Starter Template

> A production-ready Node.js and Express backend starter designed to provide a clean, scalable foundation for building modern backend applications.

[![Status](https://img.shields.io/badge/status-development-yellow)](#status)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## Overview

This template provides a reusable foundation for building production-oriented Node.js backend applications without repeatedly rebuilding the same project structure, infrastructure, and boilerplate.

Originally created as a personal backend starter, it has evolved into a general-purpose template that can serve as a foundation for personal projects and even production applications.

The template focuses on providing:

- Clean and modular architecture
- Feature-based organization
- Database abstraction
- Authentication infrastructure
- Standardized API responses
- Centralized error handling
- Request validation
- Centralized configuration
- Structured logging
- Reusable utilities
- Scalable service and repository layers
- Provider and strategy design abstractions

The goal is not to provide a complete application, but rather a strong foundation that can be extended according to the requirements of the project being built.



## Tech Stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js |
| API | Express.js |
| Specification | ES6+ |
| Database | MongoDB with Mongoose Sample (other dbs / ORMs can be switched with easily) |
| Authentication Strategies | JWT, Refresh Token, OAuth, Passkeys |
| Validation | Zod |
| Logging | Custom Logger / Pino |
| Metrics | prom-client / Prometheus |
| Real-time Communication | Socket.IO |
| Payment | Razorpay  |
| Email | Resend / SMTP |
| File Storage | Local Filesystem / Cloudinary |
| Cache | In-Memory / Redis |
| Package Manager | npm |

THE ARCHITECTURE IS PROVIDER-BASED WHERE PRACTICAL, ALLOWING INFRASTRUCTURE IMPLEMENTATIONS TO BE REPLACED WITHOUT COUPLING BUSINESS LOGIC TO A SPECIFIC VENDOR.

## Features

### Core Infrastructure

- Modular Express application structure
- Layered controller/service/repository architecture
- Centralized environment configuration
- Standardized API responses
- Global error handling
- Custom application errors
- Request validation
- Structured application logging
- Async request handling
- Reusable utilities

### Database

- Repository abstraction
- Database provider layer
- MongoDB/Mongoose implementation
- Generic CRUD repository
- Feature-specific repositories
- Repository initialization and index synchronization

### Authentication

- Password-based authentication
- Secure password hashing with bcrypt
- JWT access tokens
- Configurable access-token transport
  - Bearer token
  - HTTP-only cookie
- Refresh-token sessions
- Refresh-token hashing
- Refresh-token rotation
- Refresh-token reuse prevention
- Session metadata
  - IP address
  - User agent
- Configurable refresh-token cookie transport
- Logout and logout all active sessions with refresh token

### Email

- Email provider abstraction
  - Resend provider
  - SMTP provider
- Email verification flow
- Reusable email templates
  - Password reset template
  - Welcome email template

### Payments 

- Payment provider abstraction
  - Razorpay provider
- Razorpay webhook integration

The payment architecture isolates operations behind a provider interface so the application is not directly coupled to the Razorpay SDK/API.

### File Uploads

- File storage provider abstraction
  - Local filesystem provider
  - Cloudinary provider

### Caching

- Cache provider abstraction
  - In-memory cache implementation
  - Redis cache implementation
- Centralized cache key generation

### Rate Limiting

- Reusable rate-limiting strategies
- Predefined rate-limiting policies
- Support for different request identification strategies

### Real-Time Communication

- Socket provider abstraction
  - Socket.IO implementation
- Centralized socket initialization
- Feature-specific socket events

### Background Processing

- Worker thread abstraction
- Reusable worker pool
- Worker task registry
- Background execution of registered tasks
- Worker error handling
- Worker lifecycle management

The worker infrastructure allows CPU-intensive or isolated tasks to be executed outside the main Node.js event loop.

### Pagination

- Reusable server-side pagination component

### Observability

- Configurable logger abstraction
  - Custom logger
  - Pino logger
- Error serialization
- Request correlation IDs
- Health endpoint
- Prometheus metrics endpoint

The template intentionally keeps observability lightweight. Application-level business metrics are not prescribed by the template; infrastructure and observability platforms can consume the exposed service metrics.



## Architecture

The application follows a layered and modular architecture designed to keep business logic independent from infrastructure concerns.

At a high level:

    HTTP Request
         │
         ▼
    Middleware
         │
         ▼
    Controller
         │
         ▼
    Service
         │
         ├── Providers
         ├── Strategies
         └── Utilities
         │
         ▼
    Repository
         │
         ▼
    Database

For the complete architecture, request lifecycle, authentication design, repository abstraction, response handling, exception handling, and folder responsibilities, see [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Project Structure

    src/
    ├── auth/
    ├── cache/
    ├── config/
    ├── controllers/
    ├── db/
    ├── fileUpload/
    ├── middleware/
    ├── notifications/
    ├── payment/
    ├── routes/
    ├── services/
    ├── socket/
    ├── utils/
    └── validators/

The exact responsibilities and relationships between these modules are documented in [`file-index.md`](./docs/file-index.md).

---

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB

### Installation

Clone the repository and switch to this branch:

    git clone https://github.com/STRO09/BackendTemplates.git
    cd BackendTemplates
    git checkout NodejsV1

THIS GIVES YOU THE WHOLE GIT HISTORY AS WELL. FOR ALTERNATIVE WITHOUT GIT HISTORY : 

    npx degit STRO09/BackendTemplates#NodejsV1 my-project
    cd my-project
    npm install

Install dependencies:

    npm install

Create your environment file:

    cp .env.example .env

Configure the required environment variables and start the development server:

    npm run dev

---

## Environment Configuration

Environment variables are centralized through the application configuration module.

The `.env.example` file contains the available configuration options & details.

Important configuration includes:

- Database configuration
- JWT configuration
- Refresh-token configuration
- Authentication strategy
- Authentication transport
- Cookie configuration

Environment variables are intentionally kept separate from application logic so that configuration can be changed without modifying the implementation.

---

## Screenshots & Media

### Screenshots

<!-- Add screenshots here -->

### Demo Video

<!-- Add demo video or GIF here -->

### Architecture Diagram

<!-- Add architecture diagram here -->


## Testing

Testing documentation and automated test coverage will be expanded as the template evolves.


## Future Enhancements

Planned improvements include:

- OAuth 2.0 / OpenID Connect
- Passkeys / WebAuthn
- Expanded automated testing
- Additional security hardening
- Password reset flows
- Account recovery
- API documentation
- Additional database implementations
- Additional payment providers
- Additional email providers
- Additional file storage providers
~~ - Stripe provider ~~ (Stripe isn't available in india.)


## Status

**Intended Base Completed / Upgrading**

The template is actively being developed as part of the Backend Templates project.

The architecture may change as additional authentication mechanisms, infrastructure, and production-oriented features are introduced.


## Documentation

Additional documentation:

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Contribution and development guidelines.


## Contributing

Contributions, suggestions, improvements, and discussions are welcome.

Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting issues or pull requests.


## License

This project is licensed under the MIT License.

See [`LICENSE`](./LICENSE) for details.

---

## Author

**Sagar Janjoted**

Part of the [`BackendTemplates`](https://github.com/STRO09/BackendTemplates) project.

If you find this template useful, consider giving the repository a ⭐.

