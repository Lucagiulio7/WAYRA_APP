import * as Location from "expo-location";
import { Platform } from "react-native";

export type UserLocationStatus =
  | "available"
  | "denied"
  | "services_disabled"
  | "timeout"
  | "unavailable"
  | "unsupported";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type UserLocationResult = {
  status: UserLocationStatus;
  coordinates?: UserCoordinates;
  canAskAgain?: boolean;
};

type WebGeolocation = {
  getCurrentPosition: (
    success: (position: { coords: UserCoordinates }) => void,
    error: (error: { code?: number }) => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
  ) => void;
};

type RequestOptions = {
  platform?: string;
  timeoutMs?: number;
  webGeolocation?: WebGeolocation | null;
};

const DEFAULT_TIMEOUT_MS = 7000;
let activeDefaultRequest: Promise<UserLocationResult> | null = null;

export function isValidUserCoordinates(value: unknown): value is UserCoordinates {
  if (!value || typeof value !== "object") return false;
  const coordinates = value as UserCoordinates;
  return Number.isFinite(coordinates.latitude)
    && Number.isFinite(coordinates.longitude)
    && coordinates.latitude >= -90
    && coordinates.latitude <= 90
    && coordinates.longitude >= -180
    && coordinates.longitude <= 180;
}

export function classifyWebLocationError(error: { code?: number } | null | undefined): UserLocationStatus {
  if (error?.code === 1) return "denied";
  if (error?.code === 3) return "timeout";
  return "unavailable";
}

function withLocationTimeout(
  request: Promise<UserLocationResult>,
  ms: number,
): Promise<UserLocationResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: UserLocationResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ status: "timeout" }), ms);
    request.then(finish, () => finish({ status: "unavailable" }));
  });
}

async function requestWebLocation(
  geolocation: WebGeolocation | null,
  timeoutMs: number,
): Promise<UserLocationResult> {
  if (!geolocation) return { status: "unsupported" };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: UserLocationResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ status: "timeout" }), timeoutMs);

    try {
      geolocation.getCurrentPosition(
        (position) => finish(
          isValidUserCoordinates(position.coords)
            ? { status: "available", coordinates: position.coords }
            : { status: "unavailable" },
        ),
        (error) => finish({ status: classifyWebLocationError(error) }),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 0 },
      );
    } catch {
      finish({ status: "unavailable" });
    }
  });
}

async function requestNativeLocation(timeoutMs: number): Promise<UserLocationResult> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) {
      return { status: "services_disabled" };
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status === "undetermined") {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== "granted") {
      return { status: "denied", canAskAgain: permission.canAskAgain };
    }

    const positionResult = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).then<UserLocationResult>((position) => {
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      return isValidUserCoordinates(coordinates)
        ? { status: "available", coordinates }
        : { status: "unavailable" };
    }).catch<UserLocationResult>(() => ({ status: "unavailable" }));

    return await withLocationTimeout(positionResult, timeoutMs);
  } catch {
    return { status: "unavailable" };
  }
}

async function performLocationRequest(options: RequestOptions): Promise<UserLocationResult> {
  const platform = options.platform ?? Platform.OS;
  const timeoutMs = Math.max(100, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (platform === "web") {
    const browserGeolocation = options.webGeolocation !== undefined
      ? options.webGeolocation
      : typeof navigator !== "undefined"
        ? navigator.geolocation as WebGeolocation | undefined
        : undefined;
    return requestWebLocation(browserGeolocation ?? null, timeoutMs);
  }
  if (platform !== "ios" && platform !== "android") {
    return { status: "unsupported" };
  }
  return requestNativeLocation(timeoutMs);
}

/**
 * Reads the current location only for the active user action. Coordinates are
 * returned to the caller and are never cached or persisted by this service.
 */
export function requestOptionalUserLocation(options: RequestOptions = {}): Promise<UserLocationResult> {
  const isDefaultRequest = Object.keys(options).length === 0;
  if (!isDefaultRequest) return performLocationRequest(options);
  if (activeDefaultRequest) return activeDefaultRequest;

  activeDefaultRequest = performLocationRequest(options).finally(() => {
    activeDefaultRequest = null;
  });
  return activeDefaultRequest;
}
