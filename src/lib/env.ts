interface ServerConfig {
  aviationstackApiKey?: string;
  aviationstackBaseUrl: string;
  adminAviationOverrideJson?: string;
  linkVerificationTimeoutMs: number;
}

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function readNumberEnv(defaultValue: number, ...names: string[]): number {
  const rawValue = readEnv(...names);
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }

  return parsed;
}

export function getServerConfig(): ServerConfig {
  return {
    aviationstackApiKey: readEnv("AVIATIONSTACK_API_KEY", "Aviation_Stack_API_key"),
    aviationstackBaseUrl:
      readEnv("AVIATIONSTACK_BASE_URL") ?? "http://api.aviationstack.com/v1",
    adminAviationOverrideJson: readEnv("ADMIN_AVIATION_OVERRIDE_JSON"),
    linkVerificationTimeoutMs: readNumberEnv(5000, "LINK_VERIFICATION_TIMEOUT_MS"),
  };
}
