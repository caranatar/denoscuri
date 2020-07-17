import { StatusCode } from "./status.ts";
import { extname } from "https://deno.land/std/path/mod.ts";
import { lookup } from "https://deno.land/x/media_types/mod.ts";
import { NotFoundError, ForbiddenError, DError, InternalError } from "./errors.ts";

/**
 * Response header, consisting of a status code and "meta" string.
 */
export class ResponseHeader {
  constructor(public code: StatusCode, public meta: string) {
  }

  /**
   * Encode the header into a byte array
   */
  public encode(): Uint8Array {
    return new TextEncoder().encode(`${this.code} ${this.meta}\r\n`);
  }

  /**
   * Create a new header with the Success (20) status and given mime type
   */
  public static ok(mime: string): ResponseHeader {
    return new ResponseHeader(StatusCode.SUCCESS, mime);
  }
}

/**
 * Response body (which is just a byte array)
 */
export class ResponseBody {
  constructor(public contents: Uint8Array) {
  }
}

/**
 * A server response, with a required header and an optional body. No body is
 * present in the event of an error.
 */
export class GeminiResponse {
  constructor(public header: ResponseHeader, public body?: ResponseBody) {
  }

  /**
   * Encode whole response as a byte array
   */
  public encode(): Uint8Array {
    const header = this.header.encode();

    if (!this.body) return header;

    const body = this.body.contents;
    const encoded = new Uint8Array(header.length + body.length);
    encoded.set(header);
    encoded.set(body, header.length);
    return encoded;
  }

  /**
   * Creates a new Success (code 20) response with the given mime type and body
   */
  public static ok(mime: string, body: ResponseBody) {
    return new GeminiResponse(ResponseHeader.ok(mime), body);
  }
}

/**
 * Helper methods for building responses from an error or path
 */
export class ResponseBuilder {
  public static async buildFromError(e: DError): Promise<GeminiResponse> {
    return new GeminiResponse(new ResponseHeader(e.code, e.message));
  }

  /**
   * Builds a response from a given url path. If it matches a file, return the
   * file with the appropriate mime type. If it matches a directory, return
   * index.gmi or index.gemini if it exists, otherwise return a gemtext document
   * representing a listing of the directory.
   * 
   * Can throw the following:
   *   NotFoundError - file or directory not found
   *   ForbiddenError - permissions error
   *   InternalError - some unknown error was caught
   */
  public static async buildFromPath(docRoot: string, path: string): Promise<GeminiResponse> {
    // Get the named path on the filesystem
    const filePath = [docRoot, path].join('');
    try {
      // Get the fileinfo
      const pathInfo = await Deno.stat(filePath);

      if (pathInfo.isFile) {
        // If it's a path, get the mime type
        let mime;
        const extension = extname(filePath);
        if (extension === ".gmi" || extension === ".gemini") {
          mime = "text/gemini";
        } else {
          mime = lookup(filePath);
        }

        // Read the contents of the file
        const contents = await Deno.readFile(filePath);

        // Create and return the response
        const body = new ResponseBody(contents);
        return GeminiResponse.ok(mime || "text/utf-8", body);
      } else if (pathInfo.isDirectory) {
        // Build a listing of entries in the directory in case there's no index.
        // Start with .. since it won't show up otherwise.
        const listing = [".."];
        for await (const entry of Deno.readDir(filePath)) {
          if (entry.isFile && (entry.name === "index.gmi" || entry.name === "index.gemini")) {
            // Found an index file, return it
            return ResponseBuilder.buildFromPath(docRoot, [path, entry.name].join('/'));
          } else {
            // Add this non-index-file into the listing
            listing.push(entry.name + (entry.isDirectory ? "/" : ""));
          }
        }

        // We didn't find an index file, so let's turn the directory listing into
        // a list of gemtext links
        const links = listing.sort().map((entry) => {
          const relPath = [path, entry].join("/").replaceAll("//", "/");
          return "=> " + relPath + " " + relPath;
        });

        // Encode the listing and return the response
        const response = new TextEncoder().encode([`Listing of ${path}\n`, ...links].join("\n"));
        return GeminiResponse.ok("text/gemini", new ResponseBody(response));
      }
    } catch (e) {
      if (e.name === "NotFound") {
        // Thrown by Deno.stat if the path doesn't exist
        throw new NotFoundError(path);
      } else if (e.name === "PermissionDenied") {
        // Thrown by Deno.stat if there's a permission error
        throw new ForbiddenError(path);
      } else {
        // ??? Just in case there's another error
        throw new InternalError(e);
      }
    }

    // ??? In case the entry isn't a file or directory? I don't think this should
    // happen because symlinks are followed?
    throw new NotFoundError(path);
  }
}
