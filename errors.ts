import { StatusCode } from "./status.ts";

/// Abstract base error with a stupid name to avoid conflict with built-in Error
export abstract class DError {
  /// Requires a message and Gemini status code
  constructor(public message: string,
    public code: StatusCode) { }
}

/// Unexpected line ending (e.g., server requires '\r\n' but received '\n')
export class LineEndingError extends DError {
  constructor(expected: string) {
    super(`Server expects ${expected} line endings`,
      StatusCode.BAD_REQUEST);
  }
}

/// Requested resource does not exist
export class NotFoundError extends DError {
  constructor(path: string) {
    super(`${path} does not exist`,
      StatusCode.NOT_FOUND);
  }
}

/// Insufficient permissions to access requested resource 
export class ForbiddenError extends DError {
  constructor(path: string) {
    super(`you do not have permissions to access ${path}`,
      StatusCode.NOT_FOUND);
  }
}

/// Proxy request received, but proxying is unsupported
export class ProxyRefusedError extends DError {
  constructor(url: string) {
    super(`this server does not support proxying ${url}`,
      StatusCode.PROXY_REQUEST_REFUSED);
  }
}

/// Resource is Gone
export class GoneError extends DError {
  constructor(path: string) {
    super(`${path} is Gone. Doneso. Caput.`,
      StatusCode.GONE);
  }
}

/// Temporary or permanent redirect
export class RedirectError extends DError {
  constructor(path: string, permanent: boolean) {
    super(`${path}`,
      permanent ? StatusCode.REDIRECT_PERMANENT : StatusCode.REDIRECT_TEMPORARY);
  }
}

/// Catch-all internal error. Bad news.
export class InternalError extends DError {
  public error: Error;

  constructor(e: Error) {
    super("An internal error occurred",
      StatusCode.PERMANENT_FAILURE);
    this.error = e;
  }
}
