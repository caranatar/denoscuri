# Denoscuri
A simple [Gemini] server written using [Deno] and [Typescript].

## Features:
* Virtual host support
* Static file serving
  * Visiting a directory serves index.gmi or index.gemini if it exists
  * Returns a gemtext listing of the directory if no index file exists
* Request, response, and error logging

## Planned features:
* Redirect/"Gone" support
* Psuedo-CGI using dynamic import of typescript files
* Input/query support
* Breakout into libraries

## Unsupported features (likely won't implement):
* Proxying
* Rate limiting
* Client certificates - subject to change, pending Deno support for them

## Configuration
Create a configuration with one or more server blocks:
```json
{
  "servers": [
    {
      "hostname": "host_one",
      "port": 5555,
      "certFile": "/var/gemini/certs/host_one_cert.pem",
      "keyFile": "/var/gemini/certs/host_one_key.pem",
      "documentRoot": "/var/gemini/host_one",
      "logFile": "/var/gemini/logs/host_one.log"
    },
    {
      "hostname": "host_two",
      "certFile": "/var/gemini/certs/host_two_cert.pem",
      "keyFile": "/var/gemini/certs/host_two_key.pem",
      "documentRoot": "/var/gemini/host_two",
      "logFile": "/var/gemini/logs/host_two.log",
      "requireCRLF": false
    }
  ]
}
```

`port`, `requireCRLF`, and `logFile` are optional configuration items, which
will default to `1965`, `true`, and `./<hostname>.log`, respectively, if they
are not present. All other options are required.

## Running
Requires installation of [Deno].

### Using local copy
Clone the repository, then run the following commands, substituting
appropriate values for the allow-read and allow-write parameters and passing
the path to your config file:

`deno run --allow-net --allow-read=/var/gemini --allow-write=/var/gemini/logs denoscuri.ts /var/gemini/config.json`

### Using an auto-fetched copy
To fetch the latest version from master and run it:

`deno run --allow-net --allow-read=/var/gemini --allow-write=/var/gemini/logs https://raw.githubusercontent.com/caranatar/denoscuri/master/denoscuri.ts /var/gemini/config.json`

To fetch a tagged version (such as the current one):

`deno run --allow-net --allow-read=/var/gemini --allow-write=/var/gemini/logs https://raw.githubusercontent.com/caranatar/denoscuri/v0.1.0/denoscuri.ts /var/gemini/config.json`

## Trivia
"Denoscuri" is a portmanteau of Deno and Dioscuri - the Greek name for the
twins Castor and Pollux, who became the constellation Gemini

[Gemini]: https://gemini.circumlunar.space/
[Deno]: https://deno.land/
[Typescript]: https://www.typescriptlang.org/