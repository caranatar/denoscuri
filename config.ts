/// Interface for a server config block
interface IServerConfig {
  /// The hostname for this virtual host
  hostname: string;
  /// Option port to listen on (default: 1965)
  port?: number;
  /// Server certificate
  certFile: string;
  /// Server private key
  keyFile: string;
  /// Filesystem location of the root for the server
  documentRoot: string;
  /// If true, reject requests ending in only '\n' (default: true)
  requireCRLF?: boolean;
  /// Log file location (default: ./<hostname>.log)
  logFile?: string;
}

/**
 * Interface for the config file.
 *
 * The IServerConfig members are duplicated here due to a typescript issue I
 * couldn't figure out another way to work around.
 */
interface IConfig {
  servers: {
    hostname: string;
    port?: number;
    certFile: string;
    keyFile: string;
    documentRoot: string;
    requireCRLF?: boolean;
    logFile?: string;
  }[];
}

/// Concrete server config
export class ServerConfig {
  public hostname: string;
  public port: number;
  public certFile: string;
  public keyFile: string;
  public documentRoot: string;
  public requireCRLF: boolean;
  public logFile: string;

  constructor(c: IServerConfig) {
    this.hostname = c.hostname;
    this.port = c.port || 1965;
    this.certFile = c.certFile;
    this.keyFile = c.keyFile;
    this.documentRoot = c.documentRoot;
    this.requireCRLF = c.requireCRLF === false ? false : true;
    this.logFile = c.logFile || `./${this.hostname}.log`;
  }
}

/// Concrete config file
export class Config {
  public servers: Array<ServerConfig>;
  constructor(c: IConfig) {
    this.servers = c.servers.map((s: IServerConfig) => new ServerConfig(s));
  }

  static async fromConfigFile(configFile: string): Promise<Config> {
    const config: IConfig = JSON.parse(new TextDecoder("utf-8").decode(await Deno.readFile(configFile)));
    return new Config(config);
  }
}
