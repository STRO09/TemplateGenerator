# File Index

## docs

### docs/file-index.md

A one-line architectural reference describing the purpose of each file.

---

## src

### src/app.js

Configures the Express application, middleware, and routes.

### src/server.js

Application entry point responsible for bootstrapping and starting the server.

---

## src/auth

### src/auth/credentialTransport.js

Provides a unified interface for returning authentication credentials to clients.

### src/auth/provider.js

Resolves and exposes the configured authentication strategy.

### src/auth/transport.js

Resolves and exposes the configured access token transport mechanism.

---

## src/auth/providers

### src/auth/providers/oauth.provider.js

OAuth authentication providers.

### src/auth/providers/passkey.provider.js

passkey-based authentication.

### src/auth/providers/password.provider.js

Authenticates users using email and password credentials.

---

## src/auth/strategies

### src/auth/strategies/token.strategy.js

Defines the contract for token-based authentication strategies.

---

## src/auth/strategies/jwt

### src/auth/strategies/jwt/jwt.strategy.js

Implements stateless JWT authentication.

---

## src/auth/strategies/jwt-refresh

### src/auth/strategies/jwt-refresh/jwt-refresh.strategy.js

Implements JWT authentication with refresh token support.

---

## src/auth/transports

### src/auth/transports/bearer.transport.js

Transfers access tokens through the Authorization header.

### src/auth/transports/cookie.transport.js

Transfers access and refresh tokens through HTTP cookies.

---

## src/cache/keys

### src/cache/keys/cacheKeys.js

Centralizes cache key generation and naming conventions.

---

## src/cache/providers

### src/cache/providers/inMemory.provider.js

Provides an in-memory cache implementation.

### src/cache/providers/provider.interface.js

Defines the contract for cache providers.

### src/cache/providers/provider.js

Resolves and exposes the configured cache provider.

### src/cache/providers/redis.provider.js

Provides a Redis-backed cache implementation.

---

## src/config

### src/config/db.config.js

Establishes and manages the database connection.

### src/config/env.js

Loads, validates, and exposes application configuration.

### src/config/redis.config.js

Configures and manages the Redis client.

### src/config/upload.config.js

Defines file upload configuration.

---

## src/controllers

### src/controllers/auth.controller.js

Handles authentication-related HTTP requests.

### src/controllers/emailVerification.controller.js

Handles email verification requests.

### src/controllers/health.controller.js

Health checks, metrics and diagnosis requests.

### src/controllers/product.controller.js

Handles product-related HTTP requests.

---

## src/db

### src/db/provider.js

Initializes and exposes the configured repositories.

### src/db/repository.interface.js

Defines the contract for repository implementations.

---

## src/db/mongoose/models

### src/db/mongoose/models/product.model.js

Defines the MongoDB product schema.

### src/db/mongoose/models/refreshSession.model.js

Defines the MongoDB refresh session schema.

### src/db/mongoose/models/user.model.js

Defines the MongoDB user schema.

---

## src/db/mongoose/repositories

### src/db/mongoose/repositories/mongoRepository.js

Provides a reusable base repository for MongoDB operations.

### src/db/mongoose/repositories/product.repository.js

Implements data access operations for products.

### src/db/mongoose/repositories/refreshSession.repository.js

Implements data access operations for refresh sessions.

### src/db/mongoose/repositories/user.repository.js

Implements data access operations for users.

---

## src/fileUpload/providers

### src/fileUpload/providers/cloudinary.provider.js

Uploads and manages files through Cloudinary.

### src/fileUpload/providers/local.provider.js

Stores uploaded files on the local filesystem.

### src/fileUpload/providers/provider.interface.js

Defines the contract for file storage providers.

### src/fileUpload/providers/provider.js

Resolves and exposes the configured file storage provider.

---

## src/middleware

### src/middleware/auth.middleware.js

Authenticates incoming requests.

### src/middleware/error.middleware.js

Provides centralized application error handling.

### src/middleware/helmet.middleware.js

Applies HTTP security headers using Helmet.

### src/middleware/requestId.middleware.js

Creates requestId and attaches on every incoming request and sends it in every response in meta.

### src/middleware/upload.middleware.js

Processes incoming file uploads.

### src/middleware/validation.middleware.js

Validates incoming request data.

---

## src/middleware/rate-limit

### src/middleware/rate-limit/policies.js

Provides predefined rate-limiting policies for common use cases.

### src/middleware/rate-limit/strategies.js

Provides reusable rate-limiting strategies based on different identifiers.

---

## src/notifications/email/providers

### src/notifications/email/providers/provider.interface.js

Defines the contract for email notification providers.

### src/notifications/email/providers/provider.js

Resolves and exposes the configured email provider.

### src/notifications/email/providers/resend.provider.js

Delivers emails through the Resend API.

### src/notifications/email/providers/smtp.provider.js

Delivers emails through an SMTP server.

---

## src/notifications/email/templates

### src/notifications/email/templates/emailVerification.template.js

Generates the email verification message.

### src/notifications/email/templates/passwordReset.template.js

Generates the password reset email.

### src/notifications/email/templates/welcome.template.js

Generates the welcome email.

---

### src/payment/providers/provider.interface.js

Defines the common contract that every payment provider implementation must follow.

### src/payment/providers/provider.js 
Selects and exposes the configured payment provider without coupling the rest of the application to Razorpay.

### src/payment/providers/razorpay.provider.js 
Implements payment operations using the Razorpay API, including order creation, payment verification, and payment lookup.

---

## src/routes

### src/routes/auth.routes.js

Defines authentication endpoints.

### src/routes/health.routes.js

Health & metrics endpoints.

### src/routes/index.routes.js

Registers and combines all application routes.

### src/routes/product.routes.js

Defines product-related endpoints.

---

## src/services

### src/services/auth.service.js

Implements authentication business logic.

### src/services/emailVerification.service.js

Generates, stores, sends, and validates email verification tokens.

### src/services/order.service.js

Implements checkout, order and payment verification logic.

### src/services/product.service.js

Implements product business logic.

---

## src/socket

### src/socket/socket.js

Initializes the application's socket layer.

---

## src/socket/events

### src/socket/events/product.event.js

Defines product-related socket events.

---

## src/socket/providers

### src/socket/providers/provider.interface.js

Defines the contract for socket providers.

### src/socket/providers/provider.js

Resolves and exposes the configured socket provider.

### src/socket/providers/socketio.provider.js

Implements socket communication using Socket.IO.

---

## src/utils

## src/utils/workers/worker.js
Executes registered tasks inside an isolated Node.js worker thread and communicates results back to the main thread.

## src/utils/workers/workerPool.js
Manages a pool of reusable worker threads and distributes submitted tasks among available workers.

## src/utils/workers/tasks/index.js
Registers and exposes the tasks that are available for execution by worker threads.

### src/utils/ApiError.js

Defines a standardized application error object.

### src/utils/ApiResponse.js

Defines a standardized API response object.

### src/utils/asyncHandler.js

Wraps asynchronous route handlers and forwards errors automatically.

### src/utils/DateTimeFormat.js

Provides date and time formatting utilities.

### src/utils/hashing.js

Provides password hashing utilities.

### src/utils/jwt.js

Provides JWT generation and verification utilities.

### src/utils/logger.js

Provides structured application logging.

### src/utils/metrics.js

Registers and uses prometheus client for service metrics.

### src/utils/pagination.js

Provides a server side pagination component that's reusable.

### src/utils/refreshToken.js

Provides refresh token utilities.

### src/utils/response.js

Provides response helper functions.

### src/utils/retry.js

Provides retry utilities for asynchronous operations.

### src/utils/usernameGenerator.js

Generates usernames from email addresses.

### src/utils/userSerializer.js

Transforms user objects into API-safe response objects.

---

## src/validators

### src/validators/auth.validator.js

Defines authentication request validation schemas.

### src/validators/order.validator.js

Defines checkout and payment verification schema.

### src/validators/product.validator.js

Defines product request validation schemas.

### testpages 
Just some demo pages that need web interaction and won't suffice with postman.

### testpages/paymentDemo.html
razorpay demo checkout and payment verification
