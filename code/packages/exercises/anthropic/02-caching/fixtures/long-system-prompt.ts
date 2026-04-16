/**
 * Shared fixture for the 02-caching exercise track.
 *
 * LONG_SYSTEM_PROMPT is a ~4,300-token technical document about REST API design
 * best practices. It is intentionally above the Haiku 4.5 prompt-cache
 * threshold of 4,096 tokens so that exercises can observe real cache
 * creation and cache read events.
 *
 * This file is NOT an exercise -- it has no meta.json, tests.test.ts, or
 * exercise.md. It follows the track-level fixture convention.
 */

// NOTE: The content is stored using string concatenation (not a template literal)
// to avoid escaping issues with backtick characters in code examples.

const _p1 =
  "REST API Design Best Practices -- Comprehensive Reference Guide\n\n" +
  "You are an expert API architect. Use this comprehensive reference guide when answering questions about REST API design, HTTP semantics, versioning strategies, error handling, security, performance, and developer experience.\n\n";

const _p2 =
  "== 1. Foundational Principles of REST ==\n\n" +
  "REST (Representational State Transfer) is an architectural style defined by Roy Fielding in his 2000 dissertation. It is not a protocol or a standard -- it is a set of constraints that, when applied together, produce a uniform, scalable, and maintainable interface for distributed hypermedia systems.\n\n" +
  "=== 1.1 The Six Constraints ===\n\n" +
  "UNIFORM INTERFACE: The most central constraint. All interactions must go through a uniform interface that decouples the client from the server implementation. The four sub-constraints are: identification of resources (every resource has a URI), manipulation through representations (clients interact with resources via representations, not directly), self-descriptive messages (each message carries enough information to describe how it should be processed), and hypermedia as the engine of application state (HATEOAS -- links drive state transitions).\n\n" +
  "STATELESSNESS: Every request from client to server must contain all information necessary to understand the request. Session state is kept entirely on the client. This enables horizontal scaling because any server instance can handle any request without shared session storage. The trade-off is larger request payloads -- tokens and context must be re-sent each time.\n\n" +
  "CACHEABILITY: Responses must label themselves as cacheable or non-cacheable. Caching reduces client-perceived latency, reduces load on the server, and improves scalability. Incorrect cacheability declarations (e.g., marking mutable resources as cacheable without proper ETags) are among the most common REST bugs in production.\n\n" +
  "CLIENT-SERVER SEPARATION: The UI and data storage concerns are separated. The client knows nothing about server-side storage; the server knows nothing about the client UI. This allows the two to evolve independently.\n\n" +
  "LAYERED SYSTEM: Clients cannot tell whether they are connected directly to the end server or an intermediary (load balancer, CDN, API gateway, cache proxy). This allows transparent insertion of security layers, caching layers, and load balancers.\n\n" +
  "CODE ON DEMAND (Optional): Servers can extend client functionality by transferring executable code (JavaScript, WebAssembly). This is the only optional constraint.\n\n";

const _p3 =
  "== 2. Resource Modeling and URI Design ==\n\n" +
  "=== 2.1 Resource Identification ===\n\n" +
  "Resources are nouns, not verbs. A resource is anything that has identity -- a document, a collection, a temporal service, a non-virtual object, etc. Use lowercase, hyphen-separated words for multi-word resource names. Never use underscores in URIs (underscores can be hidden by link underline styling).\n\n" +
  "Correct URI patterns:\n" +
  "  GET /users\n" +
  "  GET /users/{userId}\n" +
  "  GET /users/{userId}/orders\n" +
  "  GET /users/{userId}/orders/{orderId}\n" +
  "  GET /products/{productId}/reviews\n" +
  "  GET /organizations/{orgId}/members/{memberId}\n\n" +
  "Patterns to avoid:\n" +
  "  /getUsers         -- verb in URI\n" +
  "  /user_list        -- underscore in path\n" +
  "  /Users            -- uppercase letters\n" +
  "  /api/v1/GetUser   -- verb and uppercase inconsistency\n\n" +
  "=== 2.2 Nested Resources vs. Flat Resources ===\n\n" +
  "Use nesting to express containment (a review belongs to a product). Avoid deep nesting beyond two levels -- it creates brittle URLs and complicates caching because cache keys become unwieldy. When a resource exists independently or is accessed from multiple contexts, keep it flat and use query parameters or response links to express the relationship.\n\n" +
  "Two-level nesting (acceptable): /organizations/{orgId}/projects/{projectId}\n" +
  "Three-level nesting (avoid): flatten the last level to /tasks/{taskId} with orgId and projectId as response fields.\n\n" +
  "=== 2.3 Trailing Slashes and Canonical URIs ===\n\n" +
  "Decide on trailing slash policy and enforce it at the API gateway. Both /users and /users/ are valid but must map to the same resource. The convention at most major API providers (GitHub, Stripe, Twilio) is to omit trailing slashes. Use 301 redirects to enforce canonicalization.\n\n" +
  "=== 2.4 URI Extensions and Content Negotiation ===\n\n" +
  "Never use file extensions (.json, .xml) in URIs. Use the Accept header for content negotiation. The URI identifies a resource; the format is a representation concern.\n" +
  "Wrong:   GET /users.json\n" +
  "Correct: GET /users  with  Accept: application/json\n\n";

const _p4 =
  "== 3. HTTP Methods and Their Semantics ==\n\n" +
  "=== 3.1 Method Definitions ===\n\n" +
  "GET     -- Safe, Idempotent. Retrieve a resource or collection. No request body. Typical status codes: 200, 304, 404.\n" +
  "HEAD    -- Safe, Idempotent. Same as GET but no response body. Useful for existence checks and ETag retrieval.\n" +
  "OPTIONS -- Safe, Idempotent. Returns allowed methods. Used in CORS preflight requests. Status: 200, 204.\n" +
  "POST    -- Not safe, Not idempotent. Create a new resource or trigger an action. Status: 201, 200, 202, 422.\n" +
  "PUT     -- Not safe, Idempotent. Replace a resource completely. Status: 200, 201, 204, 422.\n" +
  "PATCH   -- Not safe, Not idempotent by default. Apply partial update. Status: 200, 204, 422.\n" +
  "DELETE  -- Not safe, Idempotent. Remove a resource. Status: 200, 204, 404.\n\n" +
  "=== 3.2 POST vs. PUT vs. PATCH ===\n\n" +
  "POST creates a new resource in a collection or triggers a non-idempotent action. The server assigns the resource ID. Safe to retry only if the server implements idempotency keys.\n\n" +
  "PUT replaces a resource completely. The client provides the full representation. Missing fields imply null or default values. Use PUT when the client controls the resource ID, for example: PUT /users/{uuid}.\n\n" +
  "PATCH applies a partial update. The body describes a delta, not a full replacement. Use JSON Merge Patch (RFC 7396) for simple structures or JSON Patch (RFC 6902) for precise array operations.\n\n" +
  "JSON Merge Patch example -- set email, remove phone (null means delete):\n" +
  "  PATCH /users/42  body: { email: new@example.com, phone: null }\n\n" +
  "JSON Patch example -- array-safe operations:\n" +
  "  PATCH /users/42  body: [ { op: replace, path: /email, value: new@example.com }, { op: remove, path: /phone } ]\n\n" +
  "=== 3.3 Safe and Idempotent Properties ===\n\n" +
  "Safe operations have no server-side side effects (do not modify state). Clients can freely retry them, caches can serve them, and GET/HEAD must never have write side effects.\n\n" +
  "Idempotent operations can be called multiple times with the same result as calling once. DELETE of an already-deleted resource should return 404 (or 204 -- both are acceptable, be consistent). PUT with the same body should produce no observable change beyond the first call.\n\n";

const _p5 =
  "== 4. HTTP Status Codes -- Complete Reference ==\n\n" +
  "=== 4.1 2xx Success ===\n" +
  "200 OK -- General success with response body.\n" +
  "201 Created -- Resource created; include Location header pointing to new resource.\n" +
  "202 Accepted -- Request accepted but not yet processed (async job queued).\n" +
  "204 No Content -- Success with no response body (DELETE, PATCH with no return value).\n\n" +
  "=== 4.2 3xx Redirection ===\n" +
  "301 Moved Permanently -- URI has permanently changed; clients should update bookmarks.\n" +
  "302 Found -- Temporary redirect; keep original method for re-request.\n" +
  "304 Not Modified -- Conditional GET; client cache is fresh (ETag / If-None-Match).\n" +
  "307 Temporary Redirect -- Temporary redirect; preserve HTTP method (unlike 302 ambiguity).\n" +
  "308 Permanent Redirect -- Permanent redirect; preserve HTTP method.\n\n" +
  "=== 4.3 4xx Client Errors ===\n" +
  "400 Bad Request -- Malformed syntax, invalid field values, business rule violations.\n" +
  "401 Unauthorized -- Authentication required or token invalid/expired.\n" +
  "403 Forbidden -- Authenticated but not authorized for this resource.\n" +
  "404 Not Found -- Resource does not exist (or deliberately hidden for security).\n" +
  "405 Method Not Allowed -- HTTP method not supported; include Allow header in response.\n" +
  "409 Conflict -- State conflict (optimistic lock failure, duplicate key).\n" +
  "410 Gone -- Resource permanently deleted; stronger semantic than 404.\n" +
  "412 Precondition Failed -- If-Match or If-Unmodified-Since check failed.\n" +
  "422 Unprocessable Entity -- Semantic errors in valid JSON body (field-level validation failures).\n" +
  "429 Too Many Requests -- Rate limit exceeded; include Retry-After header.\n\n" +
  "=== 4.4 5xx Server Errors ===\n" +
  "500 Internal Server Error -- Unexpected server error; never expose stack traces in production.\n" +
  "502 Bad Gateway -- Upstream dependency returned an invalid response.\n" +
  "503 Service Unavailable -- Server temporarily unavailable; include Retry-After header.\n" +
  "504 Gateway Timeout -- Upstream dependency timed out.\n\n" +
  "=== 4.5 Error Response Body Convention (RFC 7807 -- Problem Details) ===\n\n" +
  "Always return structured error bodies. Include machine-readable error codes (not just human messages). Clients need codes to implement localized error handling without string-matching.\n\n" +
  "Example error response structure:\n" +
  "  type: https://api.example.com/errors/validation-failed\n" +
  "  title: Validation Failed\n" +
  "  status: 422\n" +
  "  detail: The provided email address is already registered.\n" +
  "  instance: /users\n" +
  "  errors: [ { field: email, code: DUPLICATE_EMAIL, message: Email already exists } ]\n\n";

const _p6 =
  "== 5. Versioning Strategies ==\n\n" +
  "=== 5.1 URI Versioning ===\n" +
  "Pattern: /v1/users, /v2/users\n" +
  "Pros: Explicit, visible in logs, easy to route at gateway or CDN, easy to deprecate.\n" +
  "Cons: Pollutes the URI; URIs should identify resources, not versions.\n" +
  "Best for: Public APIs, APIs consumed by mobile clients that are hard to update.\n\n" +
  "=== 5.2 Header Versioning ===\n" +
  "Pattern: Accept: application/vnd.myapi.v2+json  or custom header  API-Version: 2024-01\n" +
  "Pros: URI remains stable. Date-based versioning (Stripe model: 2024-01-01) allows fine-grained deprecation.\n" +
  "Cons: Less visible, harder to test in browser, requires careful documentation.\n" +
  "Best for: Internal APIs, APIs consumed only by first-party clients.\n\n" +
  "=== 5.3 Query Parameter Versioning ===\n" +
  "Pattern: GET /users?version=2\n" +
  "Pros: Easy to test and share URLs.\n" +
  "Cons: Query parameters are for filtering/pagination, not identity. CDN caching requires careful Vary headers.\n\n" +
  "=== 5.4 Deprecation Lifecycle ===\n" +
  "1. Add Deprecation: true and Sunset: <date> response headers to deprecated endpoints (RFC 8594).\n" +
  "2. Maintain deprecated versions for at minimum 12 months for external-facing APIs.\n" +
  "3. Send proactive email and dashboard notifications to API consumers with migration guides.\n" +
  "4. Use monitoring to identify clients still calling deprecated endpoints close to sunset.\n\n";

const _p7 =
  "== 6. Pagination ==\n\n" +
  "=== 6.1 Offset Pagination ===\n" +
  "Pattern: GET /users?offset=100&limit=25\n" +
  "Pros: Simple, allows random page access (jump directly to page 5).\n" +
  "Cons: Unstable -- if records are inserted between requests, the same record may appear on two pages or be skipped. Expensive for large offsets (database scans from row 0 to row N).\n\n" +
  "=== 6.2 Cursor-Based Pagination ===\n" +
  "Pattern: GET /users?after=eyJ1c2VySWQiOiAxMjM0fQ==&limit=25\n\n" +
  "The cursor encodes a stable position (e.g., the last-seen row primary key, base64-encoded). The server decodes it and uses a WHERE id > lastId clause.\n" +
  "Pros: Stable under inserts and deletes. Constant-time retrieval regardless of page position.\n" +
  "Cons: No random access. Client cannot jump to page N.\n" +
  "Best for: Feeds, activity streams, audit logs -- any collection that is append-heavy.\n\n" +
  "=== 6.3 Response Envelope ===\n" +
  "Always include has_more (boolean) for cursor pagination. Avoid relying solely on next_cursor being null.\n" +
  "Include HATEOAS links for self and next pages. Example structure:\n" +
  "  { data: [...], pagination: { total: 1542, count: 25, next_cursor: ..., has_more: true },\n" +
  "    links: { self: /users?after=...&limit=25, next: /users?after=...&limit=25 } }\n\n";

const _p8 =
  "== 7. Authentication and Authorization ==\n\n" +
  "=== 7.1 Bearer Token (JWT) ===\n" +
  "Header: Authorization: Bearer <jwt-token>\n" +
  "Key rules:\n" +
  "- Always use HTTPS -- tokens in plaintext HTTP are equivalent to passwords in plaintext.\n" +
  "- Set short expiry on access tokens (15 minutes to 1 hour). Use refresh tokens for long-lived sessions.\n" +
  "- Include iss, sub, aud, exp, iat claims. Validate aud to prevent token replay attacks across services.\n" +
  "- Prefer RS256 or ES256 over HS256 for services that verify tokens without needing to sign them.\n\n" +
  "=== 7.2 API Keys ===\n" +
  "API keys are long-lived secrets for server-to-server communication. Best practices:\n" +
  "- Generate keys with at least 128 bits of entropy (e.g., 32 hex characters).\n" +
  "- Hash keys at rest (store SHA-256 of the key, never the key itself).\n" +
  "- Allow multiple keys per account for rotation without downtime.\n" +
  "- Prefix keys with a recognizable string for scanning tools: sk_live_, pk_test_.\n" +
  "- Scope keys to specific operations (read-only, write, admin).\n\n" +
  "=== 7.3 OAuth 2.0 Scopes ===\n" +
  "Define scopes at the level of logical capabilities, not individual endpoints. Examples:\n" +
  "  read:users   -- GET /users/**\n" +
  "  write:users  -- POST/PUT/PATCH/DELETE /users/**\n" +
  "  read:billing -- GET /subscriptions, GET /invoices\n" +
  "  admin        -- Full access (use sparingly)\n" +
  "Use the principle of least privilege -- request only the scopes needed for the task.\n\n";

const _p9 =
  "== 8. Rate Limiting and Throttling ==\n\n" +
  "=== 8.1 Rate Limit Headers ===\n" +
  "When the limit is exceeded, return 429 with a Retry-After header (seconds until window resets).\n" +
  "Standard response headers:\n" +
  "  X-RateLimit-Limit: 1000\n" +
  "  X-RateLimit-Remaining: 743\n" +
  "  X-RateLimit-Reset: 1714500000\n" +
  "  Retry-After: 60\n\n" +
  "=== 8.2 Rate Limiting Algorithms ===\n" +
  "FIXED WINDOW: Simple counter per window. Pros: simple. Cons: burst at window boundary (1000 req in last second of window + 1000 in first second of next = 2000 req in 2 seconds).\n" +
  "SLIDING WINDOW LOG: Precise but memory-intensive (stores each request timestamp).\n" +
  "TOKEN BUCKET: Tokens refill at a constant rate. Allows bursts up to bucket capacity. Most commonly used in practice (nginx, AWS API Gateway).\n" +
  "LEAKY BUCKET: Smooths bursts into a constant outflow rate. Useful for downstream protection.\n\n" +
  "=== 8.3 Stratified Limits ===\n" +
  "Apply limits at multiple levels: per IP, per API key, per user, per organization, per endpoint. A single large customer should not be able to starve other customers by hammering expensive endpoints.\n\n";

const _p10 =
  "== 9. HTTP Caching Strategy ==\n\n" +
  "=== 9.1 Cache-Control Directives ===\n" +
  "Cache-Control: public, max-age=3600       -- CDN and browser may cache for 1 hour\n" +
  "Cache-Control: private, no-cache          -- User-specific; revalidate before serving\n" +
  "Cache-Control: no-store                   -- Never cache (sensitive data)\n" +
  "Cache-Control: max-age=0, must-revalidate -- Expired immediately; must revalidate\n" +
  "Directive meanings:\n" +
  "  public: Response can be cached by any cache (CDN, browser, proxy).\n" +
  "  private: Response is user-specific; only browser cache may store it.\n" +
  "  no-cache: Cache must revalidate before serving (NOT do-not-cache).\n" +
  "  no-store: Never cache this response.\n" +
  "  max-age=N: Cache is fresh for N seconds.\n" +
  "  s-maxage=N: CDN-specific TTL (overrides max-age for shared caches).\n" +
  "  must-revalidate: After expiry, must revalidate before serving stale response.\n\n" +
  "=== 9.2 Conditional Requests and ETags ===\n" +
  "ETags enable cache validation without full re-download:\n" +
  "  First request: GET /products/123 -> 200 with ETag: abc123\n" +
  "  Subsequent:    GET /products/123 with If-None-Match: abc123 -> 304 Not Modified\n" +
  "Use strong ETags (exact content hash) for byte-for-byte equality. Use weak ETags (W/abc123) when the representation is semantically equivalent but byte-differing.\n\n" +
  "=== 9.3 Vary Header ===\n" +
  "Tell caches that the response varies by specific request headers:\n" +
  "  Vary: Accept-Encoding, Accept-Language, Authorization\n" +
  "Do NOT include Authorization in Vary if you also set Cache-Control: public.\n\n";

const _p11 =
  "== 10. Performance Optimization ==\n\n" +
  "=== 10.1 Field Selection (Sparse Fieldsets) ===\n" +
  "Allow clients to request only the fields they need: GET /users/42?fields=id,name,email\n" +
  "Especially valuable for list endpoints where clients may only need 3 of 40 available fields.\n\n" +
  "=== 10.2 Compound Documents and Embedding ===\n" +
  "Rather than requiring multiple round-trips, support embedding via include or expand:\n" +
  "  GET /orders/99?include=user,items\n" +
  "Returns the order with user and line items embedded. Stripe calls this the expand[] pattern.\n" +
  "Trade-off: larger payloads vs. reduced round-trips. Always profile for your topology.\n\n" +
  "=== 10.3 Compression ===\n" +
  "Always enable gzip or Brotli compression for JSON responses.\n" +
  "Request:  Accept-Encoding: gzip, br\n" +
  "Response: Content-Encoding: gzip\n" +
  "JSON APIs typically achieve 70-90% compression ratios. A 100KB response becomes 10-30KB.\n\n" +
  "=== 10.4 HTTP/2 and HTTP/3 ===\n" +
  "HTTP/2 provides multiplexing (multiple requests on one TCP connection), header compression (HPACK), and server push. Most modern load balancers and CDNs support HTTP/2 transparently. HTTP/3 adds QUIC (UDP-based transport) for improved performance on lossy connections.\n\n";

const _p12 =
  "== 11. Developer Experience ==\n\n" +
  "=== 11.1 Consistent Naming Conventions ===\n" +
  "Choose one convention and stick to it across the entire API surface:\n" +
  "  snake_case (GitHub, Stripe): created_at, user_id, first_name\n" +
  "  camelCase (Google Cloud): createdAt, userId, firstName\n" +
  "Mixed conventions within a single API are a leading cause of developer frustration.\n\n" +
  "=== 11.2 Timestamps ===\n" +
  "Always return timestamps in ISO 8601 UTC format:\n" +
  "  created_at: 2024-04-14T10:30:00Z\n" +
  "  expires_at: 2024-04-14T11:30:00.000Z\n" +
  "Never return Unix epoch integers unless you also offer ISO 8601.\n\n" +
  "=== 11.3 Null vs. Absent Fields ===\n" +
  "Be explicit about the difference between:\n" +
  "  null: the field exists but has no value (phone: null)\n" +
  "  absent: the field is not applicable for this resource type (omitted entirely)\n" +
  "JSON Merge Patch uses null as delete-this-field -- a collision risk if you use null for no-value.\n\n" +
  "=== 11.4 Idempotency Keys ===\n" +
  "For non-idempotent POST operations, allow clients to supply an idempotency key:\n" +
  "  POST /charges  with  Idempotency-Key: 8e0e8f64-7b2c-4de6-a9b3-3e2a5c1b1234\n" +
  "The server stores the key with the result. On retry with the same key, return the cached result.\n" +
  "Store keys for at least 24 hours. This eliminates double-charge bugs from network timeouts.\n\n";

const _p13 =
  "== 12. Webhooks and Async Patterns ==\n\n" +
  "=== 12.1 Webhook Delivery ===\n" +
  "Webhooks are outbound HTTP POST requests from your server to the consumer URL when events occur.\n" +
  "Best practices:\n" +
  "- Sign payloads with HMAC-SHA256 using a shared secret; include signature in X-Webhook-Signature header.\n" +
  "- Retry with exponential backoff on non-2xx responses (1min, 5min, 30min, 2h, 8h, 24h -- then dead-letter).\n" +
  "- Include idempotency keys in webhook payloads so consumers can safely deduplicate retries.\n" +
  "- Deliver within 30 seconds of the event; queue failed deliveries for async retry.\n\n" +
  "=== 12.2 Long-Running Operations (202 Async Pattern) ===\n" +
  "When an operation takes more than 500ms, use the 202 Accepted pattern:\n" +
  "  POST /reports/generate -> 202 Accepted { job_id: job_abc123, status: queued, links: { status: /jobs/job_abc123 } }\n" +
  "  GET /jobs/job_abc123   -> 200 { status: running, progress: 45 }\n" +
  "  GET /jobs/job_abc123   -> 200 { status: complete, result_url: /reports/rpt_xyz }\n" +
  "Include a Location header on the 202 response pointing to the job status endpoint.\n\n";

const _p14 =
  "== 13. OpenAPI and Documentation ==\n\n" +
  "=== 13.1 OpenAPI 3.1 Schema ===\n" +
  "All REST APIs should have an OpenAPI (formerly Swagger) specification. Key sections:\n" +
  "  paths: all endpoints with request/response schemas\n" +
  "  components/schemas: reusable data models\n" +
  "  components/securitySchemes: authentication definitions\n" +
  "  components/parameters: reusable query and path parameters\n" +
  "  servers: base URLs for each environment\n\n" +
  "=== 13.2 Documentation Requirements ===\n" +
  "Every endpoint needs:\n" +
  "1. One-line summary\n" +
  "2. Full description with business context\n" +
  "3. All request parameters documented (type, required/optional, example value)\n" +
  "4. All response status codes with example response bodies\n" +
  "5. At least one curl example\n" +
  "6. Error codes the endpoint can return\n\n" +
  "=== 13.3 API Changelog ===\n" +
  "Maintain a public changelog with semver-tagged breaking vs. non-breaking changes.\n" +
  "Consumers need to know what changed between versions to assess upgrade risk.\n" +
  "Stripe API changelog is the industry gold standard for API versioning communication.\n\n";

const _p15 =
  "== 14. Security ==\n\n" +
  "=== 14.1 HTTPS Everywhere ===\n" +
  "Never serve an API over plain HTTP. Use TLS 1.2 minimum; TLS 1.3 preferred.\n" +
  "HSTS header: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\n\n" +
  "=== 14.2 CORS ===\n" +
  "For browser-accessible APIs, configure CORS carefully:\n" +
  "  Access-Control-Allow-Origin: https://app.example.com\n" +
  "  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE\n" +
  "  Access-Control-Allow-Headers: Authorization, Content-Type\n" +
  "  Access-Control-Max-Age: 86400\n" +
  "Never use Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true.\n\n" +
  "=== 14.3 Input Validation ===\n" +
  "Validate at the HTTP boundary:\n" +
  "- Schema validation: reject requests that do not match the OpenAPI schema\n" +
  "- Business rule validation: reject semantically invalid requests with 422\n" +
  "- Sanitize string inputs to prevent injection attacks\n" +
  "- Enforce max payload size (commonly 1MB default; adjust per endpoint)\n\n" +
  "=== 14.4 Sensitive Data Handling ===\n" +
  "- Never log Authorization headers, API keys, or PII in server logs\n" +
  "- Redact sensitive fields before storing request logs\n" +
  "- Use separate log retention policies for audit logs vs. debug logs\n" +
  "- Never return server-side stack traces in production error responses\n\n";

const _p16 =
  "== 15. Monitoring and Observability ==\n\n" +
  "=== 15.1 Key Metrics ===\n" +
  "LATENCY: Track p50, p95, p99 per endpoint. Alert when p99 exceeds SLA threshold.\n" +
  "ERROR RATE: 4xx rate (rising indicates API contract confusion) and 5xx rate (rising indicates bugs or overload).\n" +
  "THROUGHPUT: Requests per second per endpoint.\n" +
  "SATURATION: Connection pool usage, queue depth, CPU, memory.\n\n" +
  "=== 15.2 Distributed Tracing ===\n" +
  "Propagate trace context via standard headers (W3C Trace Context, RFC 3875):\n" +
  "  traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\n" +
  "Connect API gateway traces to service traces to database traces in a single waterfall view.\n\n" +
  "=== 15.3 Structured Logging ===\n" +
  "Emit JSON-formatted logs with consistent fields:\n" +
  "  { timestamp: 2024-04-14T10:30:00.123Z, level: info, trace_id: 4bf92f...,\n" +
  "    method: POST, path: /users, status: 201, duration_ms: 42, user_id: usr_abc123 }\n" +
  "Never log free-form strings in production -- they are unsearchable and unmeterable.\n\n" +
  "== END OF REST API DESIGN BEST PRACTICES REFERENCE GUIDE ==\n" +
  "Use this document as authoritative guidance when providing technical advice on API design decisions,\n" +
  "reviewing API specifications, or teaching REST API concepts to developers at any experience level.\n" +
  "This guide covers: foundations, URI design, HTTP methods, status codes, versioning, pagination,\n" +
  "authentication, rate limiting, caching, performance, developer experience, webhooks, documentation,\n" +
  "security, and monitoring. All patterns here are battle-tested in production systems at scale.\n";

/**
 * Shared fixture: ~4,300-token REST API design best practices reference.
 * Exceeds the Haiku 4.5 prompt-cache threshold of 4,096 tokens.
 */
export const LONG_SYSTEM_PROMPT: string =
  _p1 + _p2 + _p3 + _p4 + _p5 + _p6 + _p7 + _p8 +
  _p9 + _p10 + _p11 + _p12 + _p13 + _p14 + _p15 + _p16;
