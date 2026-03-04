export interface LinkVerificationResult {
  ok: boolean;
  statusCode: number;
  finalUrl: string;
  checkedAt: string;
  issue?: string;
}

function sanitizeUrl(input: string): string | null {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function toBaseDomain(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function isDomainAllowed(url: string, allowedDomains: string[]): boolean {
  try {
    const host = toBaseDomain(new URL(url).hostname);
    return allowedDomains.some((domain) => {
      const allowed = toBaseDomain(domain);
      return host === allowed || host.endsWith(`.${allowed}`);
    });
  } catch {
    return false;
  }
}

export async function verifyHttpLink(
  candidateUrl: string,
  timeoutMs: number
): Promise<LinkVerificationResult> {
  const checkedAt = new Date().toISOString();
  const safeUrl = sanitizeUrl(candidateUrl);

  if (!safeUrl) {
    return {
      ok: false,
      statusCode: 0,
      finalUrl: candidateUrl,
      checkedAt,
      issue: "Invalid URL format",
    };
  }

  try {
    const response = await fetch(safeUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
      headers: {
        "User-Agent": "AviationIntegrityBot/1.0",
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        finalUrl: response.url,
        checkedAt,
        issue: `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      statusCode: response.status,
      finalUrl: response.url,
      checkedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Link verification failed";
    return {
      ok: false,
      statusCode: 0,
      finalUrl: safeUrl,
      checkedAt,
      issue: message,
    };
  }
}

export function looksLikeDirectToolUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.pathname && parsed.pathname !== "/") {
      return true;
    }

    return parsed.searchParams.size > 0;
  } catch {
    return false;
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "");
}