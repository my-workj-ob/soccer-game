// This file ensures that server-only code is not imported on the client
// If you see this error on the client, it means you're trying to import a server-only module
throw new Error(
  'You cannot import from "lib/server-only" on the client. ' +
    'This module should only be imported on the server.'
)
