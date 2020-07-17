/**
 * Gemini status codes.
 * See: gemini://gemini.circumlunar.space/docs/specification.gmi
 */
export enum StatusCode {
  INPUT = 10,
  INPUT_SENSITIVE = 11,
  SUCCESS = 20,
  REDIRECT_TEMPORARY = 30,
  REDIRECT_PERMANENT = 31,
  TEMPORARY_FAILURE = 40,
  SERVER_UNAVAILABLE = 41,
  CGI_ERROR = 42,
  PROXY_ERROR = 43,
  SLOW_DOWN = 44,
  PERMANENT_FAILURE = 50,
  NOT_FOUND = 51,
  GONE = 52,
  PROXY_REQUEST_REFUSED = 53,
  BAD_REQUEST = 54,
  CLIENT_CERT_REQUIRED = 60,
  CLIENT_CERT_UNAUTHORIZED = 61,
  CLIENT_CERT_INVALID = 62
}