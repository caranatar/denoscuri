import { urlParse } from 'https://deno.land/x/url_parse/mod.ts';

/// The necessary components of a parsed request
export class GeminiRequest {
  /// The protocol (gemini:, http:, etc...)
  public protocol: string;
  /// The requested hostname
  public hostname: string;
  /// The requested path (/, /a/b/c, /x.gmi, etc...)
  public path: string;
  /// Optional params after a ?. Currently unused.
  public params?: URLSearchParams;

  /// Parses a request from the given string
  constructor(input: string) {
    const url = urlParse(input);
    this.protocol = url.protocol || "gemini:";
    this.hostname = url.hostname;
    this.path = url.pathname || "/";
    if (url.search) {
      this.params = url.searchParams;
    }
  }
}
