export const srvAddress = process.env.NODE_ENV === "development" ? `192.168.0.185:4002` : window.location.host;
export const srvHost = process.env.NODE_ENV === "development" ? `192.168.0.185` : window.location.hostname;
export const srvPort = process.env.NODE_ENV === "development" ? 4002 : +window.location.port;
export const isDevEnv = process.env.NODE_ENV === "development";
// old till fixed https://github.com/mui/base-ui/issues/167
export const isOldMui = true;

export const NavRoutes = {
  engines: "Engines",
  bundles: "Bundles",
  settings: "Configuration",
  registry: "Registry",
  controller: "Controller",
};

export const linuxDockerCaps = ['AUDIT_CONTROL', 'AUDIT_READ', 'BLOCK_SUSPEND', 'BPF', 'CHECKPOINT_RESTORE', 'DAC_READ_SEARCH', 'IPC_LOCK', 'IPC_OWNER', 'LEASE', 'LINUX_IMMUTABLE', 'MAC_ADMIN', 'MAC_OVERRIDE', 'NET_ADMIN', 'NET_BROADCAST', 'PERFMON', 'SYS_ADMIN', 'SYS_BOOT', 'SYS_MODULE', 'SYS_NICE', 'SYS_PACCT', 'SYS_PTRACE', 'SYS_RAWIO', 'SYS_RESOURCE', 'SYS_TIME', 'SYS_TTY_CONFIG', 'SYSLOG', 'WAKE_ALARM'];
