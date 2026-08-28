const hasServicesEnabledAsync = jest.fn();
const getForegroundPermissionsAsync = jest.fn();
const requestForegroundPermissionsAsync = jest.fn();
const getCurrentPositionAsync = jest.fn();

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  hasServicesEnabledAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
}));

import {
  classifyWebLocationError,
  isValidUserCoordinates,
  requestOptionalUserLocation,
} from "../services/userLocation";

beforeEach(() => {
  jest.clearAllMocks();
  hasServicesEnabledAsync.mockResolvedValue(true);
  getForegroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
  requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
  getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 41.9, longitude: 12.49 } });
});

describe("optional user location", () => {
  it("valida le coordinate prima di mostrarle", () => {
    expect(isValidUserCoordinates({ latitude: 41.9, longitude: 12.49 })).toBe(true);
    expect(isValidUserCoordinates({ latitude: 120, longitude: 12.49 })).toBe(false);
    expect(isValidUserCoordinates({ latitude: Number.NaN, longitude: 12.49 })).toBe(false);
  });

  it("distingue gli errori standard del browser", () => {
    expect(classifyWebLocationError({ code: 1 })).toBe("denied");
    expect(classifyWebLocationError({ code: 3 })).toBe("timeout");
    expect(classifyWebLocationError({ code: 2 })).toBe("unavailable");
  });

  it("non chiede il permesso se i servizi di posizione sono spenti", async () => {
    hasServicesEnabledAsync.mockResolvedValue(false);

    await expect(requestOptionalUserLocation({ platform: "android" })).resolves.toEqual({
      status: "services_disabled",
    });
    expect(requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("chiede il permesso soltanto quando non e ancora stato deciso", async () => {
    getForegroundPermissionsAsync.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false });

    await expect(requestOptionalUserLocation({ platform: "ios" })).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("restituisce una posizione nativa valida senza conservarla", async () => {
    await expect(requestOptionalUserLocation({ platform: "android" })).resolves.toEqual({
      status: "available",
      coordinates: { latitude: 41.9, longitude: 12.49 },
    });
  });

  it("interrompe una lettura nativa che non risponde", async () => {
    getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));

    await expect(requestOptionalUserLocation({ platform: "android", timeoutMs: 100 })).resolves.toEqual({
      status: "timeout",
    });
  });

  it("gestisce web senza geolocalizzazione e web con coordinate", async () => {
    await expect(requestOptionalUserLocation({ platform: "web", webGeolocation: null })).resolves.toEqual({
      status: "unsupported",
    });

    const webGeolocation = {
      getCurrentPosition: (success: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 48.86, longitude: 2.35 } });
      },
    };
    await expect(requestOptionalUserLocation({ platform: "web", webGeolocation })).resolves.toEqual({
      status: "available",
      coordinates: { latitude: 48.86, longitude: 2.35 },
    });
  });
});
