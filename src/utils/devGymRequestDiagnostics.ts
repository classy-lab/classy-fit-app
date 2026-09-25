type GymRequestContext = {
  screen: string;
  endpoint: string;
  gymId?: string | number | null;
  userId?: string | number | null;
};

type GymRequestStage = "request" | "response" | "refresh-request" | "refresh-response" | "retry";

const isDevDiagnosticsEnabled = () => typeof __DEV__ !== "undefined" && __DEV__ === true;

const safeValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
};

const summarizeResponseText = (responseText: string) => {
  const trimmed = String(responseText ?? "").trim();

  if (!trimmed) {
    return { type: "empty" };
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      const firstItem = parsed[0];
      return {
        type: "array",
        length: parsed.length,
        firstItemKeys: firstItem && typeof firstItem === "object" ? Object.keys(firstItem).slice(0, 20) : [],
      };
    }

    if (parsed && typeof parsed === "object") {
      const responseObject = parsed as Record<string, unknown>;
      return {
        type: "object",
        keys: Object.keys(responseObject).slice(0, 20),
        status: responseObject.status ?? null,
        message: safeValue(responseObject.message),
      };
    }

    return {
      type: typeof parsed,
      value: safeValue(parsed),
    };
  } catch {
    return {
      type: "text",
      length: trimmed.length,
      preview: trimmed.slice(0, 180),
    };
  }
};

export const logGymRequestDiagnostics = (
  context: GymRequestContext,
  stage: GymRequestStage,
  details: Record<string, unknown> = {},
) => {
  if (!isDevDiagnosticsEnabled()) {
    return;
  }

  console.log("[DEV][GymRequest]", {
    screen: context.screen,
    endpoint: context.endpoint,
    gym_id: safeValue(context.gymId),
    user_id: safeValue(context.userId),
    stage,
    ...details,
  });
};

export const logGymRequestResponse = (
  context: GymRequestContext,
  responseStatus: number,
  responseText: string,
  details: Record<string, unknown> = {},
) => {
  logGymRequestDiagnostics(context, "response", {
    status: responseStatus,
    response: summarizeResponseText(responseText),
    ...details,
  });
};

export const logGymRefreshResponse = (
  context: GymRequestContext,
  refreshStatus: number,
  refreshText: string,
  details: Record<string, unknown> = {},
) => {
  logGymRequestDiagnostics(context, "refresh-response", {
    status: refreshStatus,
    response: summarizeResponseText(refreshText),
    ...details,
  });
};

export type { GymRequestContext };
