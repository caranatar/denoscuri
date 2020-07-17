/**
 * Denoscuri A simple [Gemini] server written using [Deno] and [Typescript].
 *
 * # Features:
 * * Virtual host support
 * * Static file serving
 *   * Visiting a directory serves index.gmi or index.gemini if it exists
 *   * Returns a gemtext listing of the directory if no index file exists
 * * Request, response, and error logging
 *
 * # Planned features:
 * * Redirect/"Gone" support
 * * Psuedo-CGI using dynamic import of typescript files
 * * Input/query support
 * * Breakout into libraries
 *
 * # Unsupported features (likely won't implement):
 * * Proxying
 * * Rate limiting
 * * Client certificates - subject to change, pending Deno support for them
 *
 * # Configuration
 * Create a configuration with one or more server blocks:
 * ```json
 * {
 *   "servers": [
 *     {
 *       "hostname": "host_one",
 *       "port": 5555,
 *       "certFile": "/var/gemini/certs/host_one_cert.pem",
 *       "keyFile": "/var/gemini/certs/host_one_key.pem",
 *       "documentRoot": "/var/gemini/host_one",
 *       "logFile": "/var/gemini/logs/host_one.log"
 *     },
 *     {
 *       "hostname": "host_two",
 *       "certFile": "/var/gemini/certs/host_two_cert.pem",
 *       "keyFile": "/var/gemini/certs/host_two_key.pem",
 *       "documentRoot": "/var/gemini/host_two",
 *       "logFile": "/var/gemini/logs/host_two.log",
 *       "requireCRLF": false
 *     }
 *   ]
 * }
 * ```
 *
 * `port`, `requireCRLF`, and `logFile` are optional configuration items, which
 * will default to `1965`, `true`, and the `./<hostname>.log`, respectively, if
 * they are not present. All other options are required.
 *
 * # Running
 * Requires installation of [Deno].
 *
 * ## Using local copy
 * Clone the repository, then run the following commands, substituting
 * appropriate values for the allow-read and allow-write parameters and passing
 * the path to your config file:
 *
 * `deno run --allow-net --allow-read=/var/gemini --allow-write=/var/gemini/logs denoscuri.ts /var/gemini/config.json`
 *
 * ## Using an auto-fetched copy
 * TODO
 *
 * # Trivia
 * "Denoscuri" is a portmanteau of Deno and Dioscuri - the Greek name for the
 * twins Castor and Pollux, who became the constellation Gemini
 *
 * [Gemini]: https://gemini.circumlunar.space/
 * [Deno]: https://deno.land/
 * [Typescript]: https://www.typescriptlang.org/
 */
import { Config } from "./config.ts";
import { Server } from "./server.ts";
import * as log from "https://deno.land/std/log/mod.ts";

// Ensure a config file was passed in
const configFile = Deno.args[0] || null;
if (!configFile) {
  console.error("Must supply a config file");
  Deno.exit(1);
}

// Parse the config
const config: Config = await Config.fromConfigFile(configFile);

// Create the default console logger
const logHandlers: any = {
  console: new log.handlers.ConsoleHandler("DEBUG"),
};

// Create object to hold virtual-server-specific loggers
const loggers: any = {};

// For each configured server, create a file handler and logger for it
config.servers.forEach((c) => {
  logHandlers[`${c.hostname}_file`] = new log.handlers.FileHandler("INFO", {
    filename: c.logFile,
  });
  loggers[`${c.hostname}`] = {
    level: "DEBUG",
    handlers: ["console", `${c.hostname}_file`],
  };
});

// Setup the loggers
const logSetup = {
  handlers: logHandlers,
  loggers: loggers,
};
await log.setup(logSetup);

// Start each server
config.servers.forEach((c) => {
  const server = new Server(c);
  server.start();
});


