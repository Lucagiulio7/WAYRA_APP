jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import { isTransitNetworkUsable, parseTransitNetwork, supportsTransit } from "@/data/transitNetworks";
import { CITY_REGISTRY } from "@/data/cityRegistry";

const CITY_NETWORK_CASES = [
  ["londra", "Central", "CENTRAL", "subway", "Central line", "London Underground", "metro"],
  ["parigi", "1", "1", "subway", "Metro 1", "RATP", "metro"],
  ["berlino", "U2", "U2", "subway", "U-Bahn U2", "BVG", "metro"],
  ["madrid", "L2", "2", "subway", "Metro L2", "Metro de Madrid", "metro"],
  ["milano", "1", "M1", "subway", "Metro 1", "ATM", "metro"],
  ["amburgo", "U1", "U1", "subway", "U-Bahn U1", "HVV", "metro"],
  ["amsterdam", "M52", "52", "subway", "Metro 52", "GVB", "metro"],
  ["atene", "M2", "M2", "subway", "Metro M2", "STASY", "metro"],
  ["barcellona", "L3", "L3", "subway", "Metro L3", "TMB", "metro"],
  ["bucarest", "M2", "M2", "subway", "Metrou M2", "Metrorex", "metro"],
  ["budapest", "2", "M2", "subway", "Metro 2", "BKK", "metro"],
  ["copenaghen", "M3", "M3", "subway", "Metro M3", "Metroselskabet", "metro"],
  ["francoforte", "U4", "U4", "light_rail", "U-Bahn U4", "VGF", "metro"],
  ["istanbul", "M2", "M2", "subway", "Metro M2", "Metro Istanbul", "metro"],
  ["lione", "D", "D", "subway", "Metro D", "TCL", "metro"],
  ["lisbona", "15E", "15E", "tram", "Electrico 15E", "Carris", "mixed"],
  ["marsiglia", "M1", "M1", "subway", "Metro M1", "RTM", "metro"],
  ["monaco_di_baviera", "U6", "U6", "subway", "U-Bahn U6", "MVV", "metro"],
  ["napoli", "L1", "1", "subway", "Metro L1", "ANM", "metro"],
  ["oslo", "3", "3", "subway", "T-bane 3", "Ruter", "metro"],
  ["porto", "D", "D", "light_rail", "Metro D", "Metro do Porto", "metro"],
  ["praga", "A", "A", "subway", "Metro A", "DPP", "metro"],
  ["roma", "MB", "B", "subway", "Metro B", "ATAC", "metro"],
  ["stoccolma", "14", "14", "subway", "Tunnelbana 14", "SL", "metro"],
  ["valencia", "L5", "5", "light_rail", "Metro L5", "Metrovalencia", "metro"],
  ["varsavia", "M2", "M2", "subway", "Metro M2", "WTP", "metro"],
  ["vienna", "U3", "U3", "subway", "U-Bahn U3", "Wiener Linien", "metro"],
  ["annecy", "2", "2", "bus", "Bus 2", "SIBRA", "bus"],
  ["antalya", "T1", "T1", "tram", "AntRay T1", "AntRay", "tram"],
  ["bergen", "1", "1", "light_rail", "Bybanen 1", "Skyss", "tram"],
  ["bratislava", "4", "4", "tram", "Elektricka 4", "DPB", "tram"],
  ["bruges", "3", "3", "bus", "Lijn 3", "De Lijn", "bus"],
  ["candia", "1", "1", "bus", "CityBus Red", "Heraklion CityBus", "bus"],
  ["colonia", "18", "18", "light_rail", "Stadtbahn 18", "KVB", "tram"],
  ["cracovia", "8", "8", "tram", "Tram 8", "ZTP Krakow", "tram"],
  ["dublino", "Red Line", "RED", "tram", "Luas Red Line", "Luas", "tram"],
  ["edimburgo", "Edinburgh Trams", "T", "tram", "Edinburgh Trams", "Edinburgh Trams", "tram"],
  ["firenze", "1", "T1", "tram", "Tramvia T1", "Gest", "tram"],
  ["marrakech", "19", "19", "bus", "Bus 19", "Alsa", "bus"],
  ["muğla", "1", "1", "bus", "Otobus 1", "Mugla", "bus"],
  ["salisburgo", "3", "3", "trolleybus", "Obus 3", "Salzburg AG", "trolleybus"],
  ["siviglia", "L1", "L1", "subway", "Metro L1", "Metro de Sevilla", "metro"],
  ["tallinn", "2", "T2", "tram", "Tramm 2", "Tallinn", "tram"],
  ["venezia", "2", "2", "ferry", "Vaporetto 2", "ACTV Navigazione", "water"],
] as const;

describe("transit network normalization", () => {
  it.each(CITY_NETWORK_CASES)("mantiene integra la rete rappresentativa di %s", (city, ref, expectedRef, route, name, networkName, expectedMode) => {
    const network = parseTransitNetwork(city, [
      { type: "node", id: 9001, lat: 45, lon: 9, tags: { name: "Prima fermata" } },
      { type: "node", id: 9002, lat: 45.01, lon: 9.01, tags: { name: "Seconda fermata con un nome volutamente molto lungo" } },
      {
        type: "relation", id: 9003,
        tags: { type: "route", route, ref, name, network: networkName },
        members: [{ type: "node", ref: 9001, role: "stop" }, { type: "node", ref: 9002, role: "stop" }],
      },
    ] as any);

    expect(network).not.toBeNull();
    expect(network?.mode).toBe(expectedMode);
    expect(network?.lines).toHaveLength(1);
    expect(network?.lines[0].id).toBe(expectedRef);
    expect(network?.lines[0].id.length).toBeLessThanOrEqual(12);
    expect(network?.lines[0].color).toMatch(/^#[0-9A-F]{6}$/i);
    expect(network?.stations).toHaveLength(2);
    expect(isTransitNetworkUsable(network, city)).toBe(true);
    const stationCoordinates = new Set(network?.stations.map((station) => `${station.latitude}:${station.longitude}`));
    network?.lines[0].paths.forEach((path) => {
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(stationCoordinates.has(`${path[0][0]}:${path[0][1]}`)).toBe(true);
      const end = path[path.length - 1];
      expect(stationCoordinates.has(`${end[0]}:${end[1]}`)).toBe(true);
    });
  });

  it("rifiuta una cache incompleta o con segmenti privi del nodo terminale", () => {
    const valid = parseTransitNetwork("roma", [
      { type: "node", id: 9101, lat: 41.89, lon: 12.49, tags: { name: "A" } },
      { type: "node", id: 9102, lat: 41.90, lon: 12.50, tags: { name: "B" } },
      {
        type: "relation", id: 9103,
        tags: { type: "route", route: "subway", ref: "MA", name: "Metro A", network: "ATAC" },
        members: [{ type: "node", ref: 9101, role: "stop" }, { type: "node", ref: 9102, role: "stop" }],
      },
    ] as any);
    expect(isTransitNetworkUsable(valid, "roma")).toBe(true);
    expect(isTransitNetworkUsable({ ...valid, city: "parigi" }, "roma")).toBe(false);
    expect(isTransitNetworkUsable({ ...valid, lines: [{ ...valid!.lines[0], paths: [[[41.89, 12.49], [42.2, 13.1]]] }] }, "roma")).toBe(false);
    expect(isTransitNetworkUsable({ ...valid, stations: [] }, "roma")).toBe(false);
  });

  it("unisce le linee di una stazione di interscambio e applica i colori ufficiali", () => {
    const network = parseTransitNetwork("milano", [
      { type: "node", id: 1, lat: 45.4642, lon: 9.19, tags: { name: "Duomo" } },
      { type: "node", id: 2, lat: 45.466, lon: 9.186, tags: { name: "Cordusio" } },
      { type: "node", id: 3, lat: 45.46, lon: 9.189, tags: { name: "Missori" } },
      {
        type: "relation", id: 10,
        tags: { type: "route", route: "subway", ref: "M1", name: "Metropolitana M1", network: "ATM" },
        members: [{ type: "node", ref: 2, role: "stop" }, { type: "node", ref: 1, role: "stop" }],
      },
      {
        type: "relation", id: 11,
        tags: { type: "route", route: "subway", ref: "M3", name: "Metropolitana M3", network: "ATM" },
        members: [{ type: "node", ref: 3, role: "stop" }, { type: "node", ref: 1, role: "stop" }],
      },
    ] as any);

    expect(network?.lines.map((line) => [line.id, line.color])).toEqual([
      ["M1", "#E31E24"],
      ["M3", "#F8C300"],
    ]);
    expect(network?.stations.find((station) => station.name === "Duomo")?.lineIds).toEqual(["M1", "M3"]);
  });

  it("abilita una rete di trasporto utile per tutte le citta", () => {
    [
      "amburgo", "amsterdam", "atene", "barcellona", "berlino", "bucarest", "budapest",
      "copenaghen", "francoforte", "istanbul", "lione", "lisbona", "londra", "madrid", "marsiglia",
      "milano", "monaco_di_baviera", "napoli", "oslo", "parigi", "porto", "praga", "roma",
      "stoccolma", "valencia", "varsavia", "vienna", "annecy", "antalya", "bergen", "bratislava",
      "bruges", "candia", "colonia", "cracovia", "dublino", "edimburgo", "firenze", "marrakech",
      "muğla", "salisburgo", "siviglia", "tallinn", "venezia",
    ].forEach((city) => {
      expect(supportsTransit(city)).toBe(true);
    });
    expect(CITY_REGISTRY.filter((city) => !supportsTransit(city.id))).toEqual([]);
  });

  it.each([
    ["amburgo", "U1", "U1"], ["amsterdam", "M52", "52"], ["atene", "M2", "M2"],
    ["barcellona", "L3", "L3"], ["bucarest", "M2", "M2"], ["budapest", "2", "M2"],
    ["copenaghen", "M3", "M3"], ["francoforte", "U4", "U4"], ["istanbul", "M2", "M2"],
    ["lione", "D", "D"], ["lisbona", "Azul", "AZUL"], ["marsiglia", "M1", "M1"],
    ["monaco_di_baviera", "U6", "U6"], ["napoli", "L1", "1"], ["oslo", "3", "3"],
    ["porto", "D", "D"], ["praga", "A", "A"], ["roma", "MB", "B"],
    ["stoccolma", "14", "14"], ["valencia", "L5", "5"], ["varsavia", "M2", "M2"],
    ["vienna", "U3", "U3"],
  ])("normalizza una linea reale supportata per %s", (city, ref, expectedRef) => {
    const network = parseTransitNetwork(city, [
      { type: "node", id: 1001, lat: 45, lon: 9, tags: { name: "Alpha" } },
      { type: "node", id: 1002, lat: 45.01, lon: 9.01, tags: { name: "Beta" } },
      {
        type: "relation", id: 1003,
        tags: { type: "route", route: city === "porto" ? "light_rail" : "subway", ref, name: `${ref} Metro`, network: city === "porto" ? "Metro do Porto" : "Metro" },
        members: [{ type: "node", ref: 1001, role: "stop" }, { type: "node", ref: 1002, role: "stop" }],
      },
    ] as any);

    expect(network?.lines[0].id).toBe(expectedRef);
    expect(network?.stations).toHaveLength(2);
  });

  it.each([
    ["annecy", "2", "2", "bus", "Bus 2", "SIBRA", "bus"],
    ["antalya", "T1", "T1", "tram", "AntRay T1", "AntRay", "tram"],
    ["bergen", "1", "1", "tram", "Bybanen 1", "Skyss", "light_rail"],
    ["bratislava", "4", "4", "tram", "Elektricka 4", "DPB", "tram"],
    ["bruges", "3", "3", "bus", "Lijn 3", "De Lijn", "bus"],
    ["candia", "1", "1", "bus", "CityBus Red", "Heraklion CityBus", "bus"],
    ["colonia", "18", "18", "tram", "Stadtbahn 18", "KVB", "light_rail"],
    ["cracovia", "8", "8", "tram", "Tram 8", "ZTP Krakow", "tram"],
    ["dublino", "Red Line", "RED", "tram", "Luas Red Line", "Luas", "tram"],
    ["edimburgo", "Edinburgh Trams", "T", "tram", "Edinburgh Trams", "Edinburgh Trams", "tram"],
    ["firenze", "1", "T1", "tram", "Tramvia T1", "Gest", "tram"],
    ["marrakech", "19", "19", "bus", "Bus 19", "Alsa", "bus"],
    ["muğla", "1", "1", "bus", "Otobus 1", "Mugla", "bus"],
    ["salisburgo", "3", "3", "trolleybus", "Obus 3", "Salzburg AG", "trolleybus"],
    ["siviglia", "L1", "L1", "metro", "Metro L1", "Metro de Sevilla", "subway"],
    ["tallinn", "2", "T2", "tram", "Tramm 2", "Tallinn", "tram"],
    ["venezia", "2", "2", "water", "Vaporetto 2", "ACTV Navigazione", "ferry"],
  ])("gestisce la rete urbana di %s", (city, ref, expectedRef, mode, name, networkName, route) => {
    const network = parseTransitNetwork(city, [
      { type: "node", id: 2001, lat: 45, lon: 9, tags: { name: "Alpha" } },
      { type: "node", id: 2002, lat: 45.01, lon: 9.01, tags: { name: "Beta" } },
      {
        type: "relation", id: 2003,
        tags: { type: "route", route, ref, name, network: networkName },
        members: [{ type: "node", ref: 2001, role: "stop" }, { type: "node", ref: 2002, role: "stop" }],
      },
    ] as any);

    expect(network).toMatchObject({ mode, lines: [{ id: expectedRef }] });
    expect(network?.stations).toHaveLength(2);
  });

  it("riconosce il nome francese accentato della rete parigina", () => {
    const network = parseTransitNetwork("parigi", [
      { type: "node", id: 21, lat: 48.856, lon: 2.352, tags: { name: "Chatelet" } },
      { type: "node", id: 22, lat: 48.86, lon: 2.34, tags: { name: "Louvre-Rivoli" } },
      {
        type: "relation", id: 20,
        tags: { type: "route", route: "subway", ref: "1", name: "Metro 1", network: "Métro de Paris" },
        members: [{ type: "node", ref: 21, role: "stop" }, { type: "node", ref: 22, role: "stop" }],
      },
    ] as any);

    expect(network?.lines[0]).toMatchObject({ id: "1", color: "#FFCD00" });
  });

  it("combina metro, tram e treni nella rete di Lisbona", () => {
    const network = parseTransitNetwork("lisbona", [
      { type: "node", id: 301, lat: 38.707, lon: -9.145, tags: { name: "Cais do Sodre" } },
      { type: "node", id: 302, lat: 38.697, lon: -9.205, tags: { name: "Belem" } },
      { type: "node", id: 305, lat: 38.688, lon: -9.148, tags: { name: "Cacilhas" } },
      {
        type: "relation", id: 303,
        tags: { type: "route", route: "tram", ref: "15E", name: "Electrico 15E", network: "Carris" },
        members: [{ type: "node", ref: 301, role: "stop" }, { type: "node", ref: 302, role: "stop" }],
      },
      {
        type: "relation", id: 304,
        tags: { type: "route", route: "train", ref: "Linha de Cascais", name: "Linha de Cascais", network: "CP" },
        members: [{ type: "node", ref: 301, role: "stop" }, { type: "node", ref: 302, role: "stop" }],
      },
      {
        type: "relation", id: 306,
        tags: { type: "route", route: "ferry", name: "Cais do Sodre - Cacilhas", network: "Transtejo" },
        members: [{ type: "node", ref: 301, role: "stop" }, { type: "node", ref: 305, role: "stop" }],
      },
    ] as any);

    expect(network).toMatchObject({ mode: "mixed", badge: "T" });
    expect(network?.lines.map((line) => [line.id, line.mode])).toEqual(expect.arrayContaining([
      ["15E", "tram"],
      ["CASCAIS", "train"],
      ["CACILHAS", "water"],
    ]));
    expect(network?.stations).toHaveLength(3);
  });

  it("elimina il verso opposto e fa passare la linea dai marker delle stazioni", () => {
    const elements = [
      { type: "node", id: 31, lat: 48.85, lon: 2.34, tags: { name: "Alpha" } },
      { type: "node", id: 32, lat: 48.851, lon: 2.346 },
      { type: "node", id: 33, lat: 48.852, lon: 2.35, tags: { name: "Beta" } },
      { type: "way", id: 40, nodes: [31, 32] },
      { type: "way", id: 43, nodes: [32, 33] },
      {
        type: "relation", id: 41,
        tags: { type: "route", route: "subway", ref: "1", name: "Metro 1", network: "Metro de Paris" },
        members: [{ type: "node", ref: 31, role: "stop" }, { type: "node", ref: 33, role: "stop" }, { type: "way", ref: 40, role: "" }, { type: "way", ref: 43, role: "" }],
      },
      {
        type: "relation", id: 42,
        tags: { type: "route", route: "subway", ref: "1", name: "Metro 1 retour", network: "Metro de Paris" },
        members: [{ type: "node", ref: 33, role: "stop" }, { type: "node", ref: 31, role: "stop" }, { type: "way", ref: 43, role: "" }, { type: "way", ref: 40, role: "" }],
      },
    ] as any;

    const network = parseTransitNetwork("parigi", elements);
    expect(network?.lines[0].paths).toHaveLength(1);
    expect(network?.lines[0].paths[0]).toHaveLength(2);
    expect(network?.lines[0].paths[0]).toEqual(expect.arrayContaining([[48.85, 2.34], [48.852, 2.35]]));
    network?.stations.forEach((station) => {
      expect(network.lines[0].paths.flat()).toContainEqual([station.latitude, station.longitude]);
    });
    const stationCoordinates = new Set(network?.stations.map((station) => `${station.latitude}:${station.longitude}`));
    network?.lines.flatMap((line) => line.paths).forEach((path) => {
      expect(stationCoordinates.has(`${path[0][0]}:${path[0][1]}`)).toBe(true);
      const end = path[path.length - 1];
      expect(stationCoordinates.has(`${end[0]}:${end[1]}`)).toBe(true);
    });
  });

  it("usa lo stesso centro per il marker di interscambio e per tutte le linee", () => {
    const network = parseTransitNetwork("milano", [
      { type: "node", id: 51, lat: 45.464, lon: 9.19, tags: { name: "Duomo" } },
      { type: "node", id: 52, lat: 45.465, lon: 9.191, tags: { name: "Duomo" } },
      { type: "node", id: 53, lat: 45.466, lon: 9.186, tags: { name: "Cordusio" } },
      { type: "node", id: 54, lat: 45.46, lon: 9.189, tags: { name: "Missori" } },
      {
        type: "relation", id: 55,
        tags: { type: "route", route: "subway", ref: "M1", name: "Metropolitana M1", network: "ATM" },
        members: [{ type: "node", ref: 53, role: "stop" }, { type: "node", ref: 51, role: "stop" }],
      },
      {
        type: "relation", id: 56,
        tags: { type: "route", route: "subway", ref: "M3", name: "Metropolitana M3", network: "ATM" },
        members: [{ type: "node", ref: 54, role: "stop" }, { type: "node", ref: 52, role: "stop" }],
      },
    ] as any);

    const interchange = network?.stations.find((station) => station.name === "Duomo");
    expect(interchange?.lineIds).toEqual(["M1", "M3"]);
    network?.lines.forEach((line) => {
      expect(line.paths.flat()).toContainEqual([interchange?.latitude, interchange?.longitude]);
    });
  });

  it("non fonde fermate lontane che condividono lo stesso nome", () => {
    const network = parseTransitNetwork("berlino", [
      { type: "node", id: 71, lat: 52.50, lon: 13.30, tags: { name: "Zentrum" } },
      { type: "node", id: 72, lat: 52.51, lon: 13.31, tags: { name: "West" } },
      { type: "node", id: 73, lat: 52.62, lon: 13.55, tags: { name: "Zentrum" } },
      { type: "node", id: 74, lat: 52.63, lon: 13.56, tags: { name: "Ost" } },
      {
        type: "relation", id: 75,
        tags: { type: "route", route: "subway", ref: "U2", name: "U-Bahn U2", network: "BVG" },
        members: [{ type: "node", ref: 71, role: "stop" }, { type: "node", ref: 72, role: "stop" }],
      },
      {
        type: "relation", id: 76,
        tags: { type: "route", route: "subway", ref: "U2", name: "U-Bahn U2 branch", network: "BVG" },
        members: [{ type: "node", ref: 73, role: "stop" }, { type: "node", ref: 74, role: "stop" }],
      },
    ] as any);

    const sameNameStations = network?.stations.filter((station) => station.name === "Zentrum") ?? [];
    expect(sameNameStations).toHaveLength(2);
    expect(sameNameStations[0].id).not.toBe(sameNameStations[1].id);
    expect(network?.lines[0].paths).toHaveLength(2);
  });

  it.each([
    ["londra", "Central line", "London Underground", "subway", "CENTRAL"],
    ["parigi", "Ligne 1", "RATP", "subway", "1"],
    ["antalya", "AntRay T1", "AntRay", "tram", "T1"],
    ["dublino", "Luas Red Line", "Luas", "tram", "RED"],
    ["firenze", "Tramvia T1", "Gest", "tram", "T1"],
  ])("ricava una sigla breve dal nome quando manca ref a %s", (city, name, networkName, route, expectedRef) => {
    const network = parseTransitNetwork(city, [
      { type: "node", id: 81, lat: 45, lon: 9, tags: { name: "Alpha" } },
      { type: "node", id: 82, lat: 45.01, lon: 9.01, tags: { name: "Beta" } },
      {
        type: "relation", id: 83,
        tags: { type: "route", route, name, network: networkName },
        members: [{ type: "node", ref: 81, role: "stop" }, { type: "node", ref: 82, role: "stop" }],
      },
    ] as any);
    expect(network?.lines[0].id).toBe(expectedRef);
  });

  it("mantiene le diramazioni senza duplicare il tronco comune", () => {
    const network = parseTransitNetwork("londra", [
      { type: "node", id: 61, lat: 51.5, lon: -0.1, tags: { name: "A" } },
      { type: "node", id: 62, lat: 51.51, lon: -0.09, tags: { name: "B" } },
      { type: "node", id: 63, lat: 51.52, lon: -0.08, tags: { name: "C" } },
      { type: "node", id: 64, lat: 51.52, lon: -0.06, tags: { name: "D" } },
      {
        type: "relation", id: 65,
        tags: { type: "route", route: "subway", ref: "Central", name: "Central line", network: "London Underground" },
        members: [{ type: "node", ref: 61, role: "stop" }, { type: "node", ref: 62, role: "stop" }, { type: "node", ref: 63, role: "stop" }],
      },
      {
        type: "relation", id: 66,
        tags: { type: "route", route: "subway", ref: "Central", name: "Central line branch", network: "London Underground" },
        members: [{ type: "node", ref: 61, role: "stop" }, { type: "node", ref: 62, role: "stop" }, { type: "node", ref: 64, role: "stop" }],
      },
    ] as any);

    const paths = network?.lines[0].paths ?? [];
    const renderedEdges = paths.flatMap((path) => path.slice(1).map((point, index) =>
      [path[index], point].map((coordinate) => coordinate.join(",")).sort().join("|"),
    ));
    expect(new Set(renderedEdges).size).toBe(3);
    expect(renderedEdges).toHaveLength(3);
  });
});
