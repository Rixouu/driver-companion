# API Route Documentation

This document provides details for all API routes in the Vehicle Inspection System.

## Conventions

- **Authentication**: Unless otherwise specified, all routes require user authentication via Supabase Auth (JWT in Authorization header).
- **Error Responses**: Standard error responses follow this format:
  ```json
  {
    "error": "Error message",
    "details": "Optional additional details or validation errors",
    "statusCode": HTTP_STATUS_CODE
  }
  ```

## API Routes

### Authentication (`/api/auth/*`)

Authentication is handled by NextAuth.js. The primary route is `/api/auth/[...nextauth]/route.ts`.

NextAuth.js provides several standard endpoints under `/api/auth/`:

- **`/api/auth/signin`**: Initiates the sign-in process. Redirects to the configured provider's sign-in page or a custom sign-in page.
- **`/api/auth/signout`**: Signs the user out.
- **`/api/auth/session`**: Returns the current session status and user data (e.g., JWT, user info).
- **`/api/auth/callback/[provider]`**: Handles the callback from an OAuth provider after successful authentication.
- **`/api/auth/providers`**: Returns a list of configured OAuth providers.
- **`/api/auth/csrf`**: Returns a CSRF token, used for CSRF protection on forms.
- **`/api/auth/error`**: Displays error messages related to authentication.

For detailed configuration of providers (e.g., Google, Credentials), JWT settings, session management, and callbacks, refer to the NextAuth.js configuration file (typically located at `auth.ts`, `lib/auth.ts`, or similar, and referenced in your main Next.js configuration or root layout).

### Notifications (`/api/notifications/*`)

#### GET `/api/notifications`

- **Purpose**: Fetches all notifications for the currently authenticated user.
- **Method**: `GET`
- **Authentication**: Required.
- **Request Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (uuid)",
      "user_id": "string (uuid)",
      "type": "string (e.g., 'new_booking', 'booking_update')",
      "message": "string",
      "is_read": "boolean",
      "link_to": "string (optional URL)",
      "created_at": "string (timestampz)",
      "updated_at": "string (timestampz)"
      // ... any other notification fields
    }
    // ... more notifications
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If there's an issue fetching notifications.

#### POST `/api/notifications/mark-all-as-read`

- **Purpose**: Marks all notifications for the currently authenticated user as read.
- **Method**: `POST`
- **Authentication**: Required.
- **Request Body**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "message": "All notifications marked as read"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If there's an issue updating the notifications.

#### GET `/api/notifications/unread-count`

- **Purpose**: Fetches the count of unread notifications for the currently authenticated user.
- **Method**: `GET`
- **Authentication**: Required.
- **Request Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "count": 123 
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If there's an issue fetching the count.

### Sentry Example API (`/api/sentry-example-api`)

This route is for testing Sentry error monitoring capabilities.

#### GET `/api/sentry-example-api`

- **Purpose**: Intentionally throws an error to test Sentry error reporting on the backend.
- **Method**: `GET`
- **Authentication**: Not required.
- **Request Parameters**: None.
- **Success Response (200 OK)**: _This route is designed to fail and will not return a success response._
  ```json
  // Hypothetical success response if the error wasn't thrown:
  // {
  //   "data": "Testing Sentry Error..."
  // }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: Always occurs, as the route throws a `SentryExampleAPIError`.

### Quotations (`/api/quotations/*`)

These routes manage quotation data.

#### GET `/api/quotations`

- **Purpose**: Fetches a list of quotations, with optional filtering (status, search term) and pagination (limit, offset).
- **Method**: `GET`
- **Authentication**: Required.
- **Query Parameters**:
  - `status` (string, optional): Filter quotations by status (e.g., 'draft', 'sent', 'approved', 'all').
  - `search` (string, optional): Search term to filter by customer name, email, or quotation title.
  - `limit` (number, optional, default: 50): The maximum number of quotations to return.
  - `offset` (number, optional, default: 0): The number of quotations to skip for pagination.
- **Success Response (200 OK)**:
  ```json
  {
    "quotations": [
      { /* Quotation object, see your 'quotations' table schema */ }
    ],
    "count": 123, // Total number of quotations matching the query
    "limit": 50,
    "offset": 0
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### POST `/api/quotations`

- **Purpose**: Creates a new quotation.
- **Method**: `POST`
- **Authentication**: Required.
- **Request Body (JSON)**:
  ```json
  {
    "title": "string (required)",
    "customer_email": "string (required)",
    "vehicle_type": "string (required)",
    "customer_name": "string (optional)",
    "amount": "number (optional)",
    "status": "string (optional, e.g., 'draft')",
    "expiry_date": "string (ISO 8601 format, optional, defaults to 48 hours from now)",
    "service_type_id": "string (uuid, optional)",
    // ... other fields matching the 'quotations' table schema
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The newly created quotation object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If required fields (`title`, `customer_email`, `vehicle_type`) are missing.
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during creation.

#### GET `/api/quotations/{id}`

- **Purpose**: Fetches a specific quotation by its ID, including its associated line items.
- **Method**: `GET`
- **Authentication**: Required.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the quotation.
- **Success Response (200 OK)**:
  ```json
  {
    // Quotation object based on your 'quotations' table schema,
    // including an array of 'quotation_items' if joined.
    "id": "string",
    "title": "string",
    // ...other quotation fields
    "quotation_items": [
      { /* Quotation item object */ }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If no quotation matches the provided ID.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### PATCH `/api/quotations/{id}`

- **Purpose**: Updates an existing quotation.
- **Method**: `PATCH`
- **Authentication**: Required.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the quotation to update.
- **Request Body (JSON)**: An object containing the quotation fields to be updated. Empty strings for UUID fields (`customer_id`, `service_type_id`, `merchant_id`) are converted to `null`.
  ```json
  {
    "title": "string (optional)",
    "customer_email": "string (optional)",
    // ... any other updatable fields from the 'quotations' table
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The updated quotation object */ }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during the update (e.g., quotation not found, database error).

#### POST `/api/quotations/{id}/items`

- **Purpose**: Adds a new line item to a specific quotation.
- **Method**: `POST`
- **Authentication**: Required.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation to which the item will be added.
- **Request Body (JSON)**: An object representing the new quotation item. Key fields include:
  - `description` (string, optional, default: "Item")
  - `quantity` (number, optional, default: 1)
  - `unit_price` (number, optional, default: 0)
  - `total_price` (number, optional, default: 0)
  - `sort_order` (number, optional, default: 0)
  - `service_type_id` (string, UUID, optional)
  - `service_type_name` (string, optional)
  - `vehicle_type` (string, optional)
  - `vehicle_category` (string, optional)
  - `duration_hours` (number, optional)
  - `service_days` (string[], optional, e.g. ["Mon", "Wed"])
  - `hours_per_day` (number, optional)
  - `is_service_item` (boolean, optional, default: false)
  ```json
  {
    "description": "Detailed service work",
    "quantity": 1,
    "unit_price": 150.00,
    "total_price": 150.00
    // ... other optional fields
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { /* The newly created quotation item object */ }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the parent quotation with the given `id` is not found.
  - `500 Internal Server Error`: If item creation fails.

#### GET `/api/quotations/{id}/items`

- **Purpose**: Retrieves all line items associated with a specific quotation, ordered by `sort_order`.
- **Method**: `GET`
- **Authentication**: Required.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation whose items are to be fetched.
- **Success Response (200 OK)**:
  ```json
  [
    { /* Quotation item object */ },
    { /* Another quotation item object */ }
    // ... more items
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### DELETE `/api/quotations/{id}/items/delete-all`

- **Purpose**: Deletes all line items associated with a specific quotation.
- **Method**: `DELETE`
- **Authentication**: Required.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation from which all items will be removed.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Deleted all items for quotation {id}"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the parent quotation with the given `id` is not found.
  - `500 Internal Server Error`: If an error occurs during deletion.

#### PATCH `/api/quotations/{id}/service-type`

- **Purpose**: Updates the `service_type_id` and `service_type` (name) for a specific quotation. This route is intended to allow updates to the service type without triggering certain backend processes (e.g., `pricing_calculation_logs` trigger).
- **Method**: `PATCH`
- **Authentication**: Required. The user must be the owner (`merchant_id`) of the quotation or have admin privileges.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation to update.
- **Request Body (JSON)**:
  ```json
  {
    "service_type_id": "string (UUID, required)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { /* The updated quotation object, including the new service_type_id and service_type name */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `quotationId` (from path) or `service_type_id` (in body) is missing.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user does not own the quotation and is not an admin.
  - `404 Not Found`: If the quotation with the specified `id` is not found.
  - `500 Internal Server Error`: If an error occurs during the update process.

#### GET `/api/quotations/{id}/activities`

- **Purpose**: Fetches all activity logs associated with a specific quotation, ordered by creation date (newest first).
- **Method**: `GET`
- **Authentication**: Uses a service client, implying it may bypass standard user authentication (e.g., for internal use or admin access). No explicit user session check is performed in this route.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation for which to retrieve activities.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (UUID)",              // Activity log ID
      "quotation_id": "string (UUID)",    // ID of the related quotation
      "user_id": "string (UUID)",        // ID of the user who performed the action
      "action": "string",               // Type of action (e.g., "created", "updated", "status_changed", "sent")
      "details": { /* JSON object containing details specific to the action */ },
      "created_at": "string (timestampz)" // Timestamp of when the activity occurred
    }
    // ... more activity log entries
  ]
  ```
- **Error Responses**:
  - `500 Internal Server Error`: If an error occurs during fetching. 

#### GET `/api/quotations/{id}/pdf`

- **Purpose**: Fetches the data for a specific quotation, intended to be used by a client-side mechanism for generating a PDF document. This route itself does not generate the PDF file.
- **Method**: `GET`
- **Authentication**: Required (uses Supabase server client which handles auth cookies).
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation for which to fetch data.
- **Success Response (200 OK)**:
  ```json
  {
    "quotation": {
      // Full quotation object, including joined customer details
      "id": "string",
      "title": "string",
      // ... other quotation fields
      "customers": { // Joined from the 'customers' table via 'customer_id'
        "name": "string (optional)",
        "email": "string (optional)",
        "phone": "string (optional)"
      }
      // ... potentially other joined data like quotation_items
    },
    "message": "Quotation found. Use client-side generation for PDF."
  }
  ```
- **Error Responses**:
  - `404 Not Found`: If the quotation with the specified `id` is not found.
  - `500 Internal Server Error`: If an error occurs during fetching. 

### Quotations (`/api/quotations/*`) - Continued

#### GET `/api/quotations/{id}/messages`

- **Purpose**: Fetches all messages associated with a specific quotation, ordered by their creation time (oldest first).
- **Method**: `GET`
- **Authentication**: Uses a service client, suggesting it might bypass standard user authentication (e.g., for internal system use).
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation for which to fetch messages.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (UUID)",
      "quotation_id": "string (UUID)",
      "user_id": "string (UUID)",         // ID of the user who sent the message
      "message": "string",
      "is_from_customer": "boolean",
      "is_read": "boolean",
      "created_at": "string (timestampz)",
      "updated_at": "string (timestampz)"
      // ... other fields from 'quotation_messages' table
    }
    // ... more messages
  ]
  ```
- **Error Responses**:
  - `500 Internal Server Error`: If there's an issue fetching messages.

#### POST `/api/quotations/{id}/messages`

- **Purpose**: Creates a new message for a specific quotation and logs a corresponding activity.
- **Method**: `POST`
- **Authentication**: Uses a service client. Requires `userId` in the request body but does not perform session-based auth itself.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation to which the message will be added.
- **Request Body (JSON)**:
  ```json
  {
    "message": "string (required, will be trimmed)",
    "userId": "string (UUID, required)"
    // `is_from_customer` defaults to false
    // `is_read` defaults to false
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The newly created quotation_messages object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `message` or `userId` is missing from the body.
  - `404 Not Found`: If the specified quotation does not exist.
  - `500 Internal Server Error`: If there's an issue creating the message or activity log.

#### POST `/api/quotations/send-email`

- **Purpose**: Sends a quotation email to a specified email address, attaching a dynamically generated PDF of the quotation. Updates the quotation status to 'sent' and logs the activity.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body**: `multipart/form-data` containing:
  - `email` (string, required): The recipient's email address.
  - `quotation_id` (string, UUID, required): The ID of the quotation to send.
  - `language` (string, optional, default: 'en'): Language for the email and PDF content (supports 'en', 'ja').
- **Process Overview**:
  1. Authenticates the user session.
  2. Fetches the full quotation data, including customer and line item details.
  3. Dynamically generates a PDF version of the quotation using an HTML-to-PDF generator (`@/lib/html-pdf-generator`), supporting localization.
  4. Constructs localized HTML and plain text email content using templates.
  5. Sends the email via Resend, with the generated PDF as an attachment.
  6. Updates the quotation's status to 'sent', sets `last_sent_at`, `last_sent_to`, and extends `expiry_date`.
  7. Records an 'email_sent' activity for the quotation.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Email sent successfully",
    "emailId": "string (ID of the sent email from Resend)"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `email` or `quotation_id` is missing in the form data.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the specified quotation does not exist.
  - `500 Internal Server Error`: Can occur due to various reasons, including:
    - Failure to generate the PDF.
    - `RESEND_API_KEY` not being configured.
    - Errors during email transmission via Resend.
    - Issues updating the quotation in the database.

#### GET `/api/quotations/direct-items`

- **Purpose**: Fetches all line items for a specific quotation, ordered by `sort_order`. This route appears to be an alternative way to get quotation items directly under the `/api/quotations/` path, differing from `/api/quotations/{id}/items`.
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Query Parameters**:
  - `id` (string, UUID, required): The ID of the quotation for which to fetch items.
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      { /* Quotation item object, matching 'quotation_items' table schema */ }
      // ... more items
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `id` query parameter (quotation ID) is missing.
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### POST `/api/quotations/send-invoice-email`

- **Purpose**: Sends an invoice email to a customer, including a PDF attachment of the invoice. This route is part of an invoicing workflow related to quotations. *Note: Current implementation in the codebase relies on mocked database interactions.*
- **Method**: `POST`
- **Authentication**: Required (NextAuth session). The authenticated user's email must end with `@japandriver.com`.
- **Request Body (JSON)**:
  ```json
  {
    "quotationId": "string (required)",   // ID of the related quotation
    "invoiceId": "string (required)",     // ID of the invoice
    "customerEmail": "string (required)", // Recipient's email
    "customerName": "string (optional)"    // Recipient's name
  }
  ```
- **Process Overview**:
  1. Authenticates the user via NextAuth and verifies their email domain.
  2. *(Currently Mocked)* Fetches invoice and quotation data from the database.
  3. Generates a PDF for the invoice using a dedicated function (`@/lib/pdf/generate-invoice-pdf`) with (potentially mocked) data.
  4. Sends the email using a helper function (`@/lib/email/send-email`), attaching the generated PDF.
  5. *(Currently Mocked)* Updates the invoice status to 'sent' in the database.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Invoice sent successfully (mocked DB)" // Message indicates mocked DB operations
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If required fields are missing or if (mocked) invoice data is invalid (e.g., no payment link).
  - `401 Unauthorized`: If the NextAuth session is not valid.
  - `403 Forbidden`: If the user's email does not meet the domain requirement.
  - `500 Internal Server Error`: If PDF generation fails or email sending fails.

#### POST `/api/quotations/create-invoice`

- **Purpose**: Creates an invoice (currently mocked in the database) and generates a payment link using a third-party payment provider (IPPS). *Note: Current implementation in the codebase relies heavily on mocked database interactions.*
- **Method**: `POST`
- **Authentication**: Required (NextAuth session). The authenticated user's email must end with `@japandriver.com`.
- **Request Body (JSON)**:
  ```json
  {
    "quotationId": "string (required)",
    "customerId": "string (required)",
    "customerName": "string (optional)",
    "customerEmail": "string (required)",
    "customerPhone": "string (optional)", // Phone number, will be formatted
    "amount": "number (required)"          // Invoice amount
  }
  ```
- **Process Overview**:
  1. Authenticates the user via NextAuth and verifies their email domain and user ID.
  2. *(Currently Mocked)* Simulates the creation of an invoice record in the database.
  3. Initializes an `IPPSClient` (presumably for a payment service) using credentials from environment variables.
  4. Calls the IPPS client to generate a payment link (`paymentUrl`) for the invoice.
  5. *(Currently Mocked)* If paylink generation is successful, updates the simulated invoice record with the `paymentUrl`.
- **Success Response (200 OK)**:
  - If payment link generation is successful:
    ```json
    {
      "success": true,
      "invoice": { /* (Mocked) Invoice object, including payment_url */ }
    }
    ```
  - If payment link generation fails (but mocked invoice creation succeeds):
    ```json
    {
      "invoice": { /* (Mocked) Invoice object, payment_url will be null */ },
      "warning": "Invoice created (mocked) but payment link generation failed."
    }
    ```
- **Error Responses**:
  - `400 Bad Request`: If required fields are missing from the request body.
  - `401 Unauthorized`: If the NextAuth session is not valid or the user ID cannot be determined.
  - `403 Forbidden`: If the authenticated user's email does not meet the domain requirement.
  - `500 Internal Server Error`: For other unexpected errors during the process.

#### POST `/api/quotations/direct-update/{id}`

- **Purpose**: Directly updates the `amount` and `total_amount` fields for a specific quotation. This route requires the authenticated user to be the owner (merchant) of the quotation.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session). User must be the `merchant_id` of the quotation.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the quotation to update.
- **Request Body (JSON)**:
  ```json
  {
    "amount": "number (required)",
    "total_amount": "number (required)"
  }
  ```
- **Process Overview**:
  1. Authenticates the user.
  2. Fetches the quotation to verify ownership (logged-in user's ID must match `quotation.merchant_id`).
  3. If authorized, updates the `amount` and `total_amount` fields of the quotation.
- **Success Response (200 OK)**:
  ```json
  { /* The fully updated quotation object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `quotationId` is missing from the path, or `amount` or `total_amount` are missing from the body, or if the request body is not valid JSON.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not the owner (merchant) of the quotation.
  - `404 Not Found`: If the quotation with the specified ID does not exist.
  - `500 Internal Server Error`: If there's a database error during fetching or updating, or for other unexpected errors.

#### POST `/api/quotations/convert`

- **Purpose**: Converts an "approved" quotation into a new "booking" record.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body (JSON)**:
  ```json
  {
    "id": "string (UUID, required)" // The ID of the quotation to be converted
  }
  ```
- **Process Overview**:
  1. Authenticates the user.
  2. Fetches the specified quotation.
  3. Validates that the quotation's status is 'approved'. If not, or if already 'converted', an error is returned.
  4. Updates the quotation's status to 'converted'.
  5. Creates a new record in the `bookings` table, populating it with data from the quotation (e.g., pickup details, service info, customer details, amount). The booking status is set to 'confirmed' and source to 'quotation'.
  6. If booking creation fails, an attempt is made to revert the quotation's status back to 'approved'.
  7. On success, logs a 'converted' activity for the quotation, including the ID of the newly created booking.
- **Success Response (200 OK)**:
  ```json
  {
    "quotation": { /* The updated quotation object with status 'converted' */ },
    "booking": { /* The newly created booking object */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `id` is missing in the request body, or if the quotation is not in 'approved' status, or if it has already been converted.
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If any database operation (fetching quotation, updating quotation, creating booking) fails. Error messages may be generic (e.g., from localization keys like `t('notifications.error')`).

#### GET `/api/quotations/send-test`

- **Purpose**: Sends a test email to the currently authenticated user. This is used to verify that the email sending service (Resend) is configured and working correctly.
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Request Parameters**: None.
- **Process Overview**:
  1. Authenticates the user.
  2. Checks for the `RESEND_API_KEY` environment variable.
  3. Initializes the Resend client.
  4. Sends a predefined test email (both HTML and plain text versions) to the authenticated user's email address.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Test email sent successfully",
    "emailId": "string (ID of the sent email from Resend, or 'unknown')"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If the `RESEND_API_KEY` is not configured, or if an error occurs during the email sending process via Resend.

#### POST `/api/quotations/send-reminder`

- **Purpose**: Sends a reminder email to the customer for a specific quotation. Can optionally include the quotation PDF as an attachment.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body (JSON)**:
  ```json
  {
    "id": "string (UUID, required)",              // ID of the quotation to send a reminder for
    "language": "string (optional, default: 'en')", // Language for email/PDF ('en', 'ja')
    "includeQuotation": "boolean (optional, default: true)" // Whether to generate and attach the quotation PDF
  }
  ```
- **Process Overview**:
  1. Authenticates the user.
  2. Fetches the specified quotation data, including line items.
  3. Checks for the `RESEND_API_KEY` environment variable.
  4. If `includeQuotation` is true, generates a PDF version of the quotation using an HTML-to-PDF generator (`@/lib/html-pdf-generator`), supporting localization.
  5. Constructs localized HTML and plain text reminder email content using predefined templates.
  6. Sends the email via Resend. If a PDF was generated, it's included as an attachment.
  7. On successful email dispatch, updates the `reminder_sent_at` and `updated_at` timestamps for the quotation.
  8. Records a 'reminder_sent' activity for the quotation.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Reminder email sent successfully",
    "emailId": "string (ID of the sent email from Resend)"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `id` is missing, or if no customer email is found associated with the quotation.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the specified quotation does not exist.
  - `500 Internal Server Error`: Can occur due to various reasons, including:
    - Failure to generate the PDF (if requested).
    - `RESEND_API_KEY` not being configured.
    - Errors during email transmission via Resend.
    - Issues updating the quotation in the database.

#### POST `/api/quotations/update-service-type`

- **Purpose**: Updates the `service_type` for quotations that currently have it set to 'charter', changing it to 'Charter Services (Hourly)'. This is a batch update operation.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body**: None.
- **Process Overview**:
  1. Authenticates the user.
  2. Calls a server-side function (`updateCharterServiceType` from `@/lib/api/quotations-service`) to perform the database update on relevant quotations.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Updated {count} quotations with service type 'charter' to 'Charter Services (Hourly)'",
    "updatedQuotations": [ /* Array of updated quotation objects or IDs */ ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If the update operation fails or an unexpected error occurs.

#### POST `/api/quotations/approve`

- **Purpose**: Approves a quotation, updates its status to 'approved', records approval details, and sends an approval notification email to the customer. Optionally attaches the quotation PDF to the email.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session for the staff member performing the approval).
- **Request Body (JSON)**:
  ```json
  {
    "id": "string (UUID, required)",
    "notes": "string (optional)",            // Notes regarding the approval, included in the email
    "customerId": "string (UUID, optional)", // Customer ID, usage not critical for core approval logic
    "skipStatusCheck": "boolean (optional, default: false)", // If true, bypasses checks on current quotation status
    "skipEmail": "boolean (optional, default: false)"       // If true, skips sending the approval email
  }
  ```
- **Process Overview**:
  1. Authenticates the staff user.
  2. Fetches the quotation data, including line items.
  3. Unless `skipStatusCheck` is true, verifies the quotation is not already 'approved' or 'converted'.
  4. Updates the quotation status to 'approved', sets `approved_at`, `approved_by` (staff user ID), and `approval_notes`.
  5. Unless `skipEmail` is true:
     - Checks for the `RESEND_API_KEY` environment variable.
     - Generates a PDF version of the quotation using an HTML-to-PDF generator (`@/lib/html-pdf-generator`), supporting localization ('en', 'ja').
     - Constructs a localized approval email (HTML and plain text) using templates, including any provided `notes`.
     - Sends the email via Resend, with the generated PDF as an attachment.
  6. Records an 'approved' activity for the quotation.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quotation approved successfully" // Or "Quotation approved. Email skipped."
    "quotation": { /* The updated quotation object */ },
    "emailId": "string (ID of the sent email from Resend, if applicable)"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `id` is missing, or if quotation status is invalid (and `skipStatusCheck` is false).
  - `401 Unauthorized`: If the staff user is not authenticated.
  - `404 Not Found`: If the specified quotation does not exist.
  - `500 Internal Server Error`: Can occur due to various reasons, including:
    - Failure to generate the PDF.
    - `RESEND_API_KEY` not being configured.
    - Errors during email transmission via Resend.
    - Issues updating the quotation in the database.

#### GET `/api/quotations/test-pdf`

- **Purpose**: Intended to test PDF generation functionality using a sample quotation. **Currently DISABLED as Puppeteer (the PDF generation library) is noted as uninstalled in the route handler.**
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Request Parameters**: None.
- **Current Behavior**:
  - Returns a `503 Service Unavailable` status with a message indicating that test PDF generation is disabled due to Puppeteer being uninstalled.
- **Original Intended Process (Commented Out in Code)**:
  1. Authenticates the user.
  2. Fetches a sample quotation from the database.
  3. Generates simple HTML content including this sample data.
  4. Was intended to use Puppeteer to convert this HTML to a PDF.
  5. The generated PDF would have been returned directly for download by the client.
- **Success Response (If Enabled and Successful)**:
  - Direct PDF file download (`application/pdf`).
- **Error Responses (If Enabled and Fails)**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If no sample quotation is found for testing.
  - `500 Internal Server Error`: If Puppeteer fails to launch or generate the PDF.

#### POST `/api/quotations/reject`

- **Purpose**: Rejects a quotation, updates its status to 'rejected', records rejection details, and sends a rejection notification email to the customer. Optionally attaches the quotation PDF to the email.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session for the staff member performing the rejection).
- **Request Body (JSON)**:
  ```json
  {
    "id": "string (UUID, required)",
    "reason": "string (optional)",            // Reason for the rejection, included in the email
    "customerId": "string (UUID, optional)", // Customer ID, usage not critical for core rejection logic
    "skipStatusCheck": "boolean (optional, default: false)", // If true, bypasses checks on current quotation status
    "skipEmail": "boolean (optional, default: false)"       // If true, skips sending the rejection email
  }
  ```
- **Process Overview**:
  1. Authenticates the staff user.
  2. Fetches the quotation data, including line items.
  3. Unless `skipStatusCheck` is true, verifies the quotation is not already 'rejected', 'approved', or 'converted'.
  4. Updates the quotation status to 'rejected', sets `rejected_at`, `rejected_by` (staff user ID), and `rejection_reason`.
  5. Unless `skipEmail` is true:
     - Checks for the `RESEND_API_KEY` environment variable.
     - Generates a PDF version of the quotation using an HTML-to-PDF generator (`@/lib/html-pdf-generator`), supporting localization ('en', 'ja').
     - Constructs a localized rejection email (HTML and plain text) using templates, including any provided `reason`.
     - Sends the email via Resend, with the generated PDF as an attachment.
  6. Records a 'rejected' activity for the quotation.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quotation rejected successfully" // Or "Quotation rejected. Email skipped."
    "quotation": { /* The updated quotation object */ },
    "emailId": "string (ID of the sent email from Resend, if applicable)"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `id` is missing, or if quotation status is invalid (and `skipStatusCheck` is false).
  - `401 Unauthorized`: If the staff user is not authenticated.
  - `404 Not Found`: If the specified quotation does not exist.
  - `500 Internal Server Error`: Can occur due to various reasons, including:
    - Failure to generate the PDF.
    - `RESEND_API_KEY` not being configured.
    - Errors during email transmission via Resend.
    - Issues updating the quotation in the database.

#### POST `/api/quotations/items/bulk-create`

- **Purpose**: Bulk creates multiple line items for a specified quotation.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body (JSON)**:
  ```json
  {
    "quotation_id": "string (UUID, required)",
    "items": [
      {
        "description": "string (optional, default: 'Item')",
        "quantity": "number (optional, default: 1)",
        "unit_price": "number (optional, default: 0)",
        "total_price": "number (optional, default: 0)",
        "sort_order": "number (optional, default: array index)",
        "service_type_id": "string (UUID, optional)",
        "service_type_name": "string (optional)",
        "vehicle_type": "string (optional)",
        "vehicle_category": "string (optional)",
        "duration_hours": "number (optional)",
        "service_days": "string[] (optional)",
        "hours_per_day": "number (optional)",
        "is_service_item": "boolean (optional, default: false)"
      }
      // ... more item objects
    ]
  }
  ```
- **Process Overview**:
  1. Authenticates the user.
  2. Validates that `quotation_id` and a non-empty `items` array are provided.
  3. Verifies that the quotation exists and (primarily) belongs to the authenticated user (`merchant_id` check, with a fallback).
  4. Formats each item, applying defaults and linking to the `quotation_id`.
  5. Performs a bulk insert of the `quotation_items`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Created {count} line items for quotation {quotation_id}",
    "data": [ /* Array of newly created quotation item objects */ ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `quotation_id` or `items` array are missing or invalid.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the quotation is not found or the user is not authorized.
  - `500 Internal Server Error`: If the bulk insertion fails or for other unexpected errors.

### Webhooks (`/api/webhooks/*`)

These routes handle incoming webhook notifications from third-party services.

#### POST `/api/webhooks/ipps`

- **Purpose**: Receives payment status updates from the IPPS (third-party payment provider) webhook.
- **Method**: `POST`
- **Authentication**: Implicitly relies on the source IP and payload structure; no explicit signature verification shown. Webhook URL should be kept secret.
- **Request Body (JSON)**: IPPS webhook payload. Key fields used:
  - `status.code` (number): Payment status code (e.g., 51 for success, 52 for failed).
  - `data.client_transaction_id` (string): Transaction ID, expected in a format like `INV-OUR_INTERNAL_INVOICE_ID-TIMESTAMP`, used to identify the invoice.
  - `data.amount` (string/number): The amount of the payment.
- **Process Overview**:
  1. Validates the incoming payload structure and `client_transaction_id` format.
  2. Extracts the internal `invoiceId` from the `client_transaction_id`.
  3. *(Currently Mocked)* Fetches the corresponding invoice and related quotation from the database.
  4. Compares the payment amount from the webhook with the (mocked) invoice amount.
  5. Processes the `status.code` from IPPS to determine the payment outcome (e.g., paid, failed, expired, cancelled).
  6. *(Currently Mocked)* Updates the invoice status in the database and records payment details.
  7. If the payment was successful, sends a payment confirmation email to the customer using `sendPaymentConfirmationEmail`.
- **Success Response (200 OK)**:
  ```json
  { "success": true }
  ```
  This response is sent if the webhook is processed without unhandled errors, even if subsequent actions like email sending fail.
- **Error Responses**:
  - `400 Bad Request`: If the payload is invalid or the `client_transaction_id` format is incorrect.
  - `500 Internal Server Error`: For unexpected errors during webhook processing.
- **Important Notes**:
  - This route currently relies heavily on **mocked database interactions**. For a production system, the commented-out database fetches and updates for invoices and payments would need to be implemented.
  - The logic for extracting `invoiceId` from `client_transaction_id` is specific to the assumed format `INV-OUR_STORED_INVOICE_ID-TIMESTAMP` or similar variations involving nested `INV-` prefixes.

### Debug (`/api/debug/*`)

These routes are intended for debugging and development purposes.

#### GET `/api/debug/quotation-details`

- **Purpose**: Fetches detailed information for a specific quotation, including its line items, and categorizes items into 'service items' and 'regular items'. Primarily used for debugging.
- **Method**: `GET`
- **Authentication**: No explicit user authentication check is performed in this route handler. It creates a Supabase server client but does not validate a user session. Intended for development/debug scenarios.
- **Query Parameters**:
  - `id` (string, UUID, required): The ID of the quotation to fetch details for.
- **Process Overview**:
  1. Fetches the main quotation record by the provided `id`.
  2. Fetches all associated `quotation_items`.
  3. Filters items into `serviceItems` (where `is_service_item` is true) and `regularItems`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "quotation": { /* Full quotation object */ },
    "items_count": 5,              // Total count of all items
    "service_items_count": 1,    // Count of items where is_service_item = true
    "regular_items_count": 4,    // Count of items where is_service_item != true
    "items": [ /* Array of all quotation_item objects */ ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `id` query parameter is missing.
  - `500 Internal Server Error`: If database fetching fails or an unexpected error occurs.

### Pricing (`/api/pricing/*`)

These routes manage pricing configurations, such as categories, service types, and individual pricing items.

#### GET `/api/pricing/categories`

- **Purpose**: Fetches a list of pricing categories, optionally filtered by active status, and ordered by `sort_order`.
- **Method**: `GET`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role in the `admin_users` table.
- **Query Parameters**:
  - `active_only` (boolean, optional, default: `true`): If `true` or omitted, only active categories are returned. If `false`, all categories are returned.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (uuid)",
      "name": "string",
      "description": "string (nullable)",
      "service_type_ids": "string[] (uuid)",
      "sort_order": "number",
      "is_active": "boolean",
      "created_at": "string (timestampz)",
      "updated_at": "string (timestampz)"
    }
    // ... more categories
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not an admin.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### POST `/api/pricing/categories`

- **Purpose**: Creates a new pricing category.
- **Method**: `POST`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role in the `admin_users` table.
- **Request Body (JSON)**:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional, nullable)",
    "service_type_ids": "string[] (uuid, optional, default: [])",
    "sort_order": "number (optional, default: 1)",
    "is_active": "boolean (optional, default: true)"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  { /* The newly created pricing category object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the `name` field is missing.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not an admin.
  - `500 Internal Server Error`: If an error occurs during creation.

#### GET `/api/pricing/items`

- **Purpose**: Fetches a list of pricing items, with optional filtering by category, service type, vehicle type, and active status. Ordered by `sort_order`.
- **Method**: `GET`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role in the `admin_users` table.
- **Query Parameters**:
  - `category_id` (string, UUID, optional): Filter by the ID of the pricing category.
  - `service_type_id` (string, UUID, optional): Filter by the ID of the service type.
  - `vehicle_type` (string, optional): Filter by vehicle type (e.g., 'Sedan', 'Van').
  - `active_only` (boolean, optional, default: `true`): If `true` or omitted, only active items are returned.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (uuid)",
      "category_id": "string (uuid, nullable)",
      "service_type": "string (uuid)", // ID of the service type
      "vehicle_type": "string",
      "duration_hours": "number (nullable)",
      "price": "number",
      "currency": "string",
      "is_active": "boolean",
      "sort_order": "number",
      "created_at": "string (timestampz)",
      "updated_at": "string (timestampz)"
      // ... other fields from 'pricing_items' table
    }
    // ... more pricing items
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not an admin.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### POST `/api/pricing/items`

- **Purpose**: Creates a new pricing item.
- **Method**: `POST`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role in the `admin_users` table.
- **Request Body (JSON)**:
  ```json
  {
    "service_type_id": "string (uuid, required)", // Linked to service_types table
    "vehicle_type": "string (required)",
    "price": "number (required)",
    "category_id": "string (uuid, optional, nullable)", // Linked to pricing_categories table
    "duration_hours": "number (optional, default: 1, nullable)",
    "currency": "string (optional, default: 'JPY')",
    "is_active": "boolean (optional, default: true)",
    "sort_order": "number (optional, default: 1)"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  { /* The newly created pricing_items object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `service_type_id`, `vehicle_type` are missing, or if `price` is not a number.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not an admin.
  - `500 Internal Server Error`: If an error occurs during creation.

#### GET `/api/pricing/items/{id}`

- **Purpose**: Fetches a specific pricing item by its unique ID.
- **Method**: `GET`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role in the `admin_users` table.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the pricing item.
- **Success Response (200 OK)**:
  ```json
  { /* The pricing_items object, see GET /api/pricing/items for schema */ }
  ```
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the authenticated user is not an admin.
  - `404 Not Found`: If no pricing item matches the provided ID.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### PATCH `/api/pricing/items/{id}`

- **Purpose**: Partially updates an existing pricing item. Only the fields provided in the request body will be updated.
- **Method**: `PATCH`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the pricing item to update.
- **Request Body (JSON)**: An object containing a subset of `pricing_items` fields to update.
  ```json
  {
    "price": "number (optional)",
    "is_active": "boolean (optional)",
    "currency": "string (optional)",
    "duration_hours": "number (optional, nullable)"
    // ... other updatable fields from 'pricing_items' table
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The updated pricing_items object */ }
  ```
- **Error Responses**:
  - `401 Unauthorized`.
  - `403 Forbidden` (not admin).
  - `404 Not Found`: If the pricing item does not exist.
  - `500 Internal Server Error`.

#### PUT `/api/pricing/items/{id}`

- **Purpose**: Fully updates/replaces an existing pricing item.
- **Method**: `PUT`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the pricing item to update.
- **Request Body (JSON)**: An object containing all fields for the pricing item.
  ```json
  {
    "category_id": "string (uuid, optional, nullable)",
    "service_type_id": "string (uuid, optional)", // Maps to 'service_type' in DB
    "vehicle_type": "string (optional)",
    "duration_hours": "number (optional, nullable)",
    "price": "number (optional)",
    "currency": "string (optional)",
    "is_active": "boolean (optional)",
    "sort_order": "number (optional)"
    // ... all fields for a pricing_items record
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The updated pricing_items object */ }
  ```
- **Error Responses**:
  - `401 Unauthorized`.
  - `403 Forbidden` (not admin).
  - `404 Not Found`: If the pricing item does not exist.
  - `500 Internal Server Error`.

#### DELETE `/api/pricing/items/{id}`

- **Purpose**: Deletes a specific pricing item by its ID.
- **Method**: `DELETE`
- **Authentication**: Required. User must be authenticated and possess an 'admin' role.
- **Path Parameters**:
  - `id` (string, UUID): The ID of the pricing item to delete.
- **Success Response (200 OK or 204 No Content)**:
  ```json
  // May return the deleted object or no content
  { "message": "Pricing item deleted successfully" } 
  ```
  _Or an empty response with status 204._
- **Error Responses**:
  - `401 Unauthorized`.
  - `403 Forbidden` (not admin).
  - `404 Not Found`: If the pricing item does not exist or deletion fails.
  - `500 Internal Server Error`.

#### GET `/api/pricing/service-types`

- **Purpose**: Fetches a list of all service types, ordered by name.
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Query Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (uuid)",
      "name": "string",
      "description": "string (nullable)",
      "is_active": "boolean",
      "created_at": "string (timestampz)",
      "updated_at": "string (timestampz)"
    }
    // ... more service types
  ]
  ```
  _Includes headers to prevent caching._
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### POST `/api/pricing/service-types`

- **Purpose**: Creates a new service type.
- **Method**: `POST`
- **Authentication**: Required (Supabase user session).
- **Request Body (JSON)**:
  ```json
  {
    "name": "string (required, trimmed)",
    "description": "string (optional, nullable)",
    "is_active": "boolean (optional, default: true)"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  { /* The newly created service_type object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `name` is missing or invalid.
  - `401 Unauthorized`: If the user is not authenticated.
  - `409 Conflict`: If a service type with the same name already exists.
  - `500 Internal Server Error`: If an error occurs during creation.

#### GET `/api/pricing/service-types/{id}`

- **Purpose**: Fetches a specific service type by its unique ID.
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the service type (must be a valid UUID).
- **Success Response (200 OK)**:
  ```json
  { /* The service_type object, see GET /api/pricing/service-types for schema */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the provided `id` is not a valid UUID.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If no service type matches the provided ID.
  - `500 Internal Server Error`: If an error occurs during fetching.

#### PUT `/api/pricing/service-types/{id}`

- **Purpose**: Updates an existing service type. Only fields present in the request body will be updated. `updated_at` is automatically set.
- **Method**: `PUT`
- **Authentication**: Required (Supabase user session).
- **Path Parameters**:
  - `id` (string, UUID): The ID of the service type to update (must be a valid UUID).
- **Request Body (JSON)**:
  ```json
  {
    "name": "string (optional, trimmed, cannot be empty if provided)",
    "description": "string (optional, nullable, empty string becomes null)",
    "is_active": "boolean (optional)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The updated service_type object */ }
  ```
- **Error Responses**:
  - `400 Bad Request`: If `id` is not a valid UUID, `name` is provided but empty, or no valid fields for update are present.
  - `401 Unauthorized`: If the user is not authenticated.
  - `404 Not Found`: If the service type with the specified ID does not exist.
  - `409 Conflict`: If updating the `name` results in a duplicate with another service type.
  - `500 Internal Server Error`: If an error occurs during the update.

#### DELETE `/api/pricing/service-types/{id}`

- **Purpose**: Deletes a specific service type by its ID.
- **Method**: `DELETE`
- **Authentication**: Required (Supabase user session).
- **Path Parameters**:
  - `id` (string, UUID): The ID of the service type to delete (must be a valid UUID).
- **Current Status**: **Partially Implemented.** The route handler includes authentication and ID validation, but the actual database deletion logic is missing and returns a placeholder response.
- **Intended Success Response**: Typically `200 OK` with a success message or `204 No Content`.
- **Current Placeholder Response (200 OK)**:
  ```json
  { "message": "DELETE operation for {id} needs to be fully implemented." }
  ```
- **Error Responses (for implemented part)**:
  - `400 Bad Request`: If the `id` is not a valid UUID.
  - `401 Unauthorized`: If the user is not authenticated.
  - `500 Internal Server Error`: For unexpected errors in the implemented part.

### Vehicles (`/api/vehicles/*`)

These routes manage vehicle data.

#### GET `/api/vehicles`

- **Purpose**: Fetches a list of vehicles, with support for pagination, sorting, full-text search (on name, license plate, VIN), and filtering by status.
- **Method**: `GET`
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Query Parameters**:
  - `page` (number, optional, default: 1): The page number for pagination.
  - `pageSize` (number, optional, default: 10): The number of vehicles to return per page.
  - `sortBy` (string, optional, default: 'created_at'): The field to sort the vehicles by.
  - `sortOrder` (string, optional, default: 'desc'): The sort order ('asc' or 'desc').
  - `search` (string, optional): A search term to filter vehicles by name, license plate, or VIN (case-insensitive).
  - `status` (string, optional): Filter vehicles by a specific status.
- **Success Response (200 OK)**:
  ```json
  {
    "vehicles": [
      {
        "id": "string (uuid)",
        "name": "string (nullable)",
        "make": "string (nullable)",
        "model": "string (nullable)",
        "year": "number (nullable)",
        "license_plate": "string (nullable)",
        "vin": "string (nullable)",
        "status": "string (nullable)",
        "created_at": "string (timestampz)",
        "updated_at": "string (timestampz)"
      }
      // ... more vehicle objects
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 120, // Total number of vehicles matching the query
      "totalPages": 12
    }
  }
  ```
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper, typically returning a JSON object with an error message (e.g., "Error fetching vehicles") and an appropriate HTTP status code.

#### GET `/api/vehicles/{id}/stats`

- **Purpose**: Retrieves aggregate statistics for a specific vehicle, including the total number of fuel logs, mileage logs, maintenance tasks, and inspections associated with it.
- **Method**: `GET`
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Process Overview**:
  - Concurrently queries `fuel_entries`, `mileage_entries`, `maintenance_tasks`, and `inspections` tables.
  - Fetches the count of records for each, filtered by the provided `vehicle_id`.
- **Success Response (200 OK)**:
  ```json
  {
    "fuelLogs": 0,         // Total count of fuel entries
    "mileageLogs": 0,      // Total count of mileage entries
    "maintenanceTasks": 0, // Total count of maintenance tasks
    "inspections": 0       // Total count of inspections
  }
  ```
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper, typically returning a JSON object with an error message (e.g., "Error fetching vehicle stats") and an appropriate HTTP status code.

#### GET `/api/vehicles/{id}/mileage`

- **Purpose**: Fetches a paginated list of mileage entries for a specific vehicle, ordered by date (newest first).
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Query Parameters**:
  - `page` (number, optional, default: 1): The page number for pagination (must be >= 1).
  - `pageSize` (number, optional, default: 10): The number of entries per page (must be between 1 and 100).
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "string (uuid)",
        "date": "string (date/timestampz)",       // Date of the mileage reading
        "reading": "number",                 // The mileage reading value
        "notes": "string (nullable)",
        "vehicle_id": "string (uuid)"
      }
      // ... more mileage entries
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 100, // Total number of mileage entries for the vehicle
      "totalPages": 10
    }
  }
  ```
- **Error Responses**: Uses a custom `handleApiError` function. Can return:
  - `AuthenticationError`: If the user is not authenticated.
  - `ValidationError`: If `page` or `pageSize` parameters are invalid.
  - `DatabaseError`: If there's an issue fetching data from the database.
  (These likely result in structured JSON error responses with appropriate HTTP status codes).

#### POST `/api/vehicles/{id}/assign-driver`

- **Purpose**: Assigns a specified driver to a vehicle. If the vehicle already has an active assignment, that assignment is marked as 'inactive' before the new one is created as 'active'.
- **Method**: `POST`
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Request Body (JSON)**:
  ```json
  {
    "driverId": "string (uuid, required)" // The ID of the driver to assign
  }
  ```
- **Process Overview**:
  1. Checks for an existing active assignment for the vehicle.
  2. If found, updates the existing active assignment's status to 'inactive'.
  3. Creates a new vehicle assignment record with the provided `vehicle_id`, `driverId`, and sets its status to 'active'.
- **Success Response (200 OK)**:
  ```json
  {
    // The newly created vehicle_assignments object, e.g.:
    "id": "string (uuid)",         // ID of the new assignment
    "vehicle_id": "string (uuid)", // Vehicle ID
    "driver_id": "string (uuid)",  // Assigned driver's ID
    "status": "active",
    "assigned_at": "string (timestampz)" // Or created_at, etc.
    // ... other fields from vehicle_assignments table
  }
  ```
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper, typically returning a JSON object with an error message (e.g., "Error assigning driver to vehicle") and an appropriate HTTP status code. This can occur if `driverId` is missing or database operations fail.

#### GET `/api/vehicles/{id}/assignments`

- **Purpose**: Fetches all vehicle assignments for a specific vehicle, including details of the assigned driver. Assignments are ordered by creation date (newest first).
- **Method**: `GET`
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Success Response (200 OK)**:
  ```json
  {
    "assignments": [
      {
        "id": "string (uuid)",         // Assignment ID
        "vehicleId": "string (uuid)",
        "driverId": "string (uuid)",
        "status": "string",            // e.g., 'active', 'inactive'
        "startDate": "string (date/timestampz, nullable)",
        "endDate": "string (date/timestampz, nullable)",
        "notes": "string (nullable)",
        "createdAt": "string (timestampz)",
        "updatedAt": "string (timestampz)",
        "driver": {                   // Joined driver details
          "id": "string (uuid)",
          "first_name": "string (nullable)",
          "last_name": "string (nullable)",
          "email": "string (nullable)",
          "status": "string (nullable)",
          "profile_image_url": "string (nullable)"
        }
      }
      // ... more assignments
    ]
  }
  ```
  _(Note: Response field names are camelCased, differing from database snake_case)._
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper (e.g., "Error fetching vehicle assignments").

#### POST `/api/vehicles/{id}/assignments`

- **Purpose**: Creates a new active assignment for a driver to a vehicle. If an existing active assignment for the vehicle exists, it is first deactivated (status set to 'inactive', `end_date` updated). Additionally, this updates any inspections for the vehicle that currently have a null `driver_id` to the newly assigned driver.
- **Method**: `POST`
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Request Body (JSON)** (`VehicleAssignmentInput`):
  ```json
  {
    "driverId": "string (uuid, required)",
    "startDate": "string (date/timestampz, optional, default: current time)",
    "notes": "string (optional, nullable)"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  { /* The newly created vehicle_assignments object (database snake_case fields) */ }
  ```
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper (e.g., "Error assigning driver to vehicle").

#### DELETE `/api/vehicles/{id}/assignments`

- **Purpose**: Deactivates a specific vehicle assignment by its `assignmentId`. This is effectively ending an assignment rather than a hard delete.
- **Method**: `DELETE` (logically acts as a PATCH/PUT to update status).
- **Authentication**: Assumed to be handled via Supabase policies or the `createAPIClient` helper.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle (used to scope the update).
- **Request Body (JSON)**:
  ```json
  {
    "assignmentId": "string (uuid, required)" // The ID of the assignment to deactivate
  }
  ```
- **Process Overview**:
  - Updates the specified `vehicle_assignments` record (matching `assignmentId` from body and `vehicle_id` from path).
  - Sets `status` to 'inactive', `end_date` to current time, and `updated_at` to current time.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { /* The updated (deactivated) vehicle_assignments object (database snake_case fields) */ }
  }
  ```
- **Error Responses**: Errors are handled by a `withErrorHandling` wrapper (e.g., "Error ending vehicle assignment").

#### GET `/api/vehicles/{id}/fuel`

- **Purpose**: Fetches a paginated list of fuel entries for a specific vehicle, ordered by date (newest first).
- **Method**: `GET`
- **Authentication**: Required (Supabase user session).
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Query Parameters**:
  - `page` (number, optional, default: 1): The page number for pagination (must be >= 1).
  - `pageSize` (number, optional, default: 10): The number of entries per page (must be between 1 and 100).
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "string (uuid)",
        "date": "string (date/timestampz)",       // Date of the fuel entry
        "odometer_reading": "number (nullable)",
        "fuel_amount": "number (nullable)",      // Amount of fuel added
        "fuel_cost": "number (nullable)",        // Total cost of the fuel
        "full_tank": "boolean (nullable)",     // Whether the tank was filled
        "notes": "string (nullable)",
        "vehicle_id": "string (uuid)"
      }
      // ... more fuel entries
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalCount": 50, // Total number of fuel entries for the vehicle
      "totalPages": 5
    }
  }
  ```
- **Error Responses**: Uses a custom `handleApiError` function. Can return:
  - `AuthenticationError`: If the user is not authenticated.
  - `ValidationError`: If `page` or `pageSize` parameters are invalid.
  - `DatabaseError`: If there's an issue fetching data from the database.
  (These likely result in structured JSON error responses with appropriate HTTP status codes).

#### GET `/api/vehicles/{id}/statistics`

- **Purpose**: Intended to fetch pre-aggregated or specific statistics for a vehicle from a `vehicle_statistics` table.
- **Method**: `GET`
- **Authentication**: Uses Supabase server client with cookie handling; however, no explicit user session validation (e.g., `auth.getUser()`) is performed in the active part of the route handler.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Current Status**: **Partially Implemented / Placeholder.**
  - The database query to `vehicle_statistics` is commented out.
  - The route currently returns an empty `stats` object.
- **Intended Success Response (200 OK)** (based on commented code):
  ```json
  {
    "stats": { /* Data from the 'vehicle_statistics' table for the vehicle */ }
  }
  ```
- **Actual Current Success Response (200 OK)**:
  ```json
  {
    "stats": {}
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: If an unexpected error occurs (returns plain text error message).

#### GET `/api/vehicles/{id}/maintenance/overview`

- **Purpose**: Fetches all maintenance tasks associated with a specific vehicle, ordered by their due date (ascending).
- **Method**: `GET`
- **Authentication**: Uses Supabase server client with cookie handling; no explicit user session validation in this handler.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Success Response (200 OK)**:
  ```json
  {
    "tasks": [
      {
        "id": "string (uuid)",
        "vehicle_id": "string (uuid)",
        "task_name": "string",
        "description": "string (nullable)",
        "status": "string", // e.g., 'pending', 'completed'
        "priority": "string (nullable)",
        "due_date": "string (date/timestampz, nullable)",
        "completion_date": "string (date/timestampz, nullable)",
        "cost": "number (nullable)",
        "created_at": "string (timestampz)",
        "updated_at": "string (timestampz)"
        // ... other fields from 'maintenance_tasks' table
      }
      // ... more tasks
    ]
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: If an error occurs during fetching (returns plain text error message "Error fetching maintenance overview").

#### GET `/api/vehicles/{id}/maintenance/upcoming`

- **Purpose**: Fetches scheduled maintenance tasks for a specific vehicle, ordered by due date (ascending). It dynamically calculates a `priority` for each task based on its proximity.
- **Method**: `GET`
- **Authentication**: Uses Supabase server client with cookie handling; no explicit user session validation in this handler.
- **Path Parameters**:
  - `id` (string, UUID): The unique identifier of the vehicle.
- **Process Overview**:
  1. Fetches tasks from the `maintenance_tasks` table where `vehicle_id` matches and `status` is 'scheduled'.
  2. If no tasks are found, returns a 404.
  3. For each task, calculates `priority`:
     - 'high' if `due_date` is within the next 7 days (inclusive of today).
     - 'normal' otherwise.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "string (uuid)",
      "title": "string (nullable)", // From task.title; DB schema showed task_name
      "dueDate": "string (date/timestampz, nullable)",
      "estimatedDuration": "any (nullable)", // Type from DB not specified in this route
      "priority": "string ('normal' | 'high')"
    }
    // ... more upcoming maintenance tasks
  ]
  ```
- **Error Responses**:
  - `404 Not Found`: If no scheduled maintenance tasks are found for the vehicle.
  - `500 Internal Server Error`: If an error occurs during fetching (returns plain text error message "Error fetching upcoming maintenance").

### Seed (`/api/seed`)

This route is for seeding the database with initial or test data.

#### POST `/api/seed`

- **Purpose**: Triggers a database seeding process by calling the `seedDatabase()` function.
- **Method**: `POST`
- **Authentication**: No explicit authentication is shown in the route handler. Access control should be managed through environment restrictions or within the `seedDatabase` function if intended for production-like environments.
- **Request Body**: None.
- **Process Overview**:
  - Calls the `seedDatabase()` function (located at `@/lib/db/seed`).
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Database seeded successfully"
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: If the `seedDatabase()` function throws an error.
    ```json
    {
      "error": "Failed to seed database"
    }
    ```