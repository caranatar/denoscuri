import { ServerConfig } from "./config.ts";
import { GeminiRequest } from "./request.ts";
import { ResponseBuilder } from "./response.ts";
import { LineEndingError, ProxyRefusedError } from "./errors.ts";
import { Logger, getLogger } from "https://deno.land/std/log/mod.ts";
import { StatusCode } from "./status.ts";

/// A Denoscuri virtual server, which receives and services incoming requests
export class Server {
  /// The configuration for this server
  config: ServerConfig;
  /// This server's logger
  logger: Logger;

  /// Creates a new server from the given config
  constructor(c: ServerConfig) {
    this.config = c;
    this.logger = getLogger(this.config.hostname);
  }

  /// Starts the server
  public async start(): Promise<void> {
    // Create a TLS socket
    const listener = Deno.listenTls({
      hostname: this.config.hostname,
      port: this.config.port,
      certFile: this.config.certFile,
      keyFile: this.config.keyFile
    });

    this.logger.info("♊ Listening on " + this.config.hostname + ":" + this.config.port);

    // Loop until the server is killed
    while (true) {
      try {
        for await (const conn of listener) {
          this.handle_connection(conn);
        }
      } catch (err) {
        if (err.name === 'BadResource') {
          // Ugly but expected when a connection is closed
        } else {
          // Because this error occurs outside of the connection servicing code
          // we cannot send a response to it
          this.logger.critical(`Unexpected error in Server::start ${err}`);
        }
      }
    }
  }

  /// Receives a request and then responds appropriately
  async handle_connection(conn: Deno.Conn) {
    // A request can only be 1024 bytes plus two bytes for CRLF. Technically,
    // this allows for a 1025 byte request if requireCRLF is false in the server
    // config, but such a server is already noncompliant with the standard :)
    let buffer = new Uint8Array(1026);
    const count = await conn.read(buffer);

    // Nothing received. Don't reply.
    if (!count) return;

    // Get the actual request contents
    const msg = buffer.subarray(0, count);

    // Parse the request then build a response, including if an error occurred
    const res = await this.parse_request(msg)
      .then(async (req) => ResponseBuilder.buildFromPath(this.config.documentRoot, req.path))
      .catch(async (e) => {
        if (e.code === StatusCode.PERMANENT_FAILURE) {
          this.logger.critical(`Internal error: ${e.error}`);
        }
        return ResponseBuilder.buildFromError(e);
      });

    this.logger.debug(`Sending response header: ${JSON.stringify(res.header)}`);

    // Write the response
    await conn.write(res.encode());

    // Close the connection
    conn.close();
  }

  /// Parses the incoming request into a GeminiRequest object
  async parse_request(buffer: Uint8Array): Promise<GeminiRequest> {
    // Decode the request as UTF-8
    const req_str = new TextDecoder("utf-8").decode(buffer);
    this.logger.debug(() => `Received request: ${req_str.replace("\r", "\\r").replace("\n", "\\n")}`);

    // Check for valid line ending in request
    if ((this.config.requireCRLF && req_str.substr(-2) !== "\r\n")
      || req_str.substr(-1) !== "\n") {
      throw new LineEndingError(this.config.requireCRLF ? "\\r\\n" : "\\n");
    }

    // Create the actual request object
    const req = new GeminiRequest(req_str);

    // Check for unsupported proxying
    if (req.hostname !== this.config.hostname || req.protocol !== "gemini:") {
      throw new ProxyRefusedError(req_str);
    }

    // Return the request
    return req;
  }
}
