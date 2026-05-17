/**
 * Test statici degli hook TanStack Query.
 * Verifica: queryKey corretti, enabled flag, shape del risultato.
 * Non fa fetch reali — usa mock di fetch.
 */

// ── Mock dipendenze ───────────────────────────────────────────────────────────

// useRef e useCallback devono funzionare fuori da un componente React
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: (init: any) => ({ current: init }),
  useCallback: (fn: any) => fn,
}));

jest.mock("@/constants/supabase", () => ({
  SUPABASE_URL: "https://fake.supabase.co",
  SUPABASE_ANON_KEY: "fakekey",
  FUNCTIONS_URL: "https://fake-functions.supabase.co",
}), { virtual: true });

jest.mock("@tanstack/react-query", () => {
  return {
    useQuery: jest.fn(),
    useMutation: jest.fn(),
  };
}, { virtual: true });

import { useQuery, useMutation } from "@tanstack/react-query";

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;

// Risultato default per useQuery: loading
const defaultQueryResult = {
  data: undefined, isLoading: true, error: null,
  isError: false, isSuccess: false, status: "pending",
} as any;

// Risultato default per useMutation
const defaultMutationResult = {
  data: undefined, isPending: false, error: null,
  mutateAsync: jest.fn(), reset: jest.fn(),
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQuery.mockReturnValue(defaultQueryResult);
  mockUseMutation.mockReturnValue(defaultMutationResult);
});

// ─── useAttractions ───────────────────────────────────────────────────────────

describe("useAttractions", () => {
  const { useAttractions } = require("../hooks/useAttractions");

  it("chiama useQuery con queryKey ['attractions', city]", () => {
    useAttractions("roma");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["attractions", "roma"] })
    );
  });

  it("è disabilitato quando city è stringa vuota", () => {
    useAttractions("");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("restituisce array vuoto durante loading", () => {
    const result = useAttractions("roma");
    expect(result.attractions).toEqual([]);
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it("restituisce attrazioni quando data è presente", () => {
    const fakeData = [{ id: 1, name: "Colosseo" }];
    mockUseQuery.mockReturnValue({ ...defaultQueryResult, data: fakeData, isLoading: false } as any);
    const result = useAttractions("roma");
    expect(result.attractions).toEqual(fakeData);
    expect(result.loading).toBe(false);
  });

  it("mappa error.message a error string", () => {
    mockUseQuery.mockReturnValue({
      ...defaultQueryResult,
      isLoading: false,
      error: new Error("HTTP 503"),
    } as any);
    const result = useAttractions("roma");
    expect(result.error).toBe("HTTP 503");
  });
});

// ─── useFoodSpots ─────────────────────────────────────────────────────────────

describe("useFoodSpots", () => {
  const { useFoodSpots } = require("../hooks/useFoodSpots");

  it("chiama useQuery con queryKey ['foodSpots', city]", () => {
    useFoodSpots("venezia");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["foodSpots", "venezia"] })
    );
  });

  it("è disabilitato quando city è vuota", () => {
    useFoodSpots("");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("restituisce foodSpots vuoto durante loading", () => {
    const result = useFoodSpots("venezia");
    expect(result.foodSpots).toEqual([]);
  });
});

// ─── useCityInfo ──────────────────────────────────────────────────────────────

describe("useCityInfo", () => {
  const { useCityInfo } = require("../hooks/useCityInfo");

  it("chiama useQuery con queryKey ['cityInfo', city]", () => {
    useCityInfo("firenze");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["cityInfo", "firenze"] })
    );
  });

  it("restituisce max_days_iconico=5 come fallback", () => {
    const result = useCityInfo("firenze");
    expect(result.max_days_iconico).toBe(5);
    expect(result.max_days_esploratore).toBe(7);
    expect(result.cityInfo).toBeNull();
  });

  it("estrae max_days dal cityInfo quando disponibile", () => {
    mockUseQuery.mockReturnValue({
      ...defaultQueryResult,
      isLoading: false,
      data: { max_days_iconico: 3, max_days_esploratore: 5 },
    } as any);
    const result = useCityInfo("firenze");
    expect(result.max_days_iconico).toBe(3);
    expect(result.max_days_esploratore).toBe(5);
  });
});

// ─── useCityExtras ────────────────────────────────────────────────────────────

describe("useCityExtras", () => {
  const { useCityExtras } = require("../hooks/useCityExtras");

  it("chiama useQuery con queryKey ['cityExtras', city]", () => {
    useCityExtras("napoli");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["cityExtras", "napoli"] })
    );
  });

  it("restituisce array vuoti durante loading", () => {
    const result = useCityExtras("napoli");
    expect(result.foods).toEqual([]);
    expect(result.cultureFacts).toEqual([]);
  });

  it("mappa foods e cultureFacts quando data è pronta", () => {
    mockUseQuery.mockReturnValue({
      ...defaultQueryResult,
      isLoading: false,
      data: { foods: [{ id: 1 }], cultureFacts: [{ icon: "🍕" }] },
    } as any);
    const result = useCityExtras("napoli");
    expect(result.foods).toHaveLength(1);
    expect(result.cultureFacts).toHaveLength(1);
  });
});

// ─── useNeighborhoods ─────────────────────────────────────────────────────────

describe("useNeighborhoods", () => {
  const { useNeighborhoods } = require("../hooks/useNeighborhoods");

  it("chiama useQuery con queryKey ['neighborhoods', city]", () => {
    useNeighborhoods("bologna");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["neighborhoods", "bologna"] })
    );
  });

  it("restituisce array vuoto durante loading", () => {
    const result = useNeighborhoods("bologna");
    expect(result.neighborhoods).toEqual([]);
  });
});

// ─── useItinerary ─────────────────────────────────────────────────────────────

describe("useItinerary", () => {
  const { useItinerary } = require("../hooks/useItinerary");

  beforeEach(() => {
    mockUseMutation.mockReturnValue({
      ...defaultMutationResult,
      isPending: false,
      error: null,
      data: undefined,
    } as any);
  });

  it("chiama useMutation (non useQuery)", () => {
    useItinerary();
    expect(mockUseMutation).toHaveBeenCalled();
    expect(mockUseQuery).not.toHaveBeenCalled();
  });

  it("espone l'interfaccia pubblica corretta", () => {
    const result = useItinerary();
    expect(typeof result.generate).toBe("function");
    expect(typeof result.cancel).toBe("function");
    expect(typeof result.reset).toBe("function");
    expect(result.itinerary).toBeNull();
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it("riporta loading=true quando isPending=true", () => {
    mockUseMutation.mockReturnValue({ ...defaultMutationResult, isPending: true } as any);
    const result = useItinerary();
    expect(result.loading).toBe(true);
  });

  it("mappa AbortError al messaggio di timeout", () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    mockUseMutation.mockReturnValue({ ...defaultMutationResult, error: abortErr } as any);
    const result = useItinerary();
    expect(result.error).toMatch(/Timeout/);
  });

  it("mappa errore generico al messaggio", () => {
    mockUseMutation.mockReturnValue({
      ...defaultMutationResult,
      error: new Error("Network down"),
    } as any);
    const result = useItinerary();
    expect(result.error).toBe("Network down");
  });
});
