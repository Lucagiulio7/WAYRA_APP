type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

export type NeighborhoodPolygon = {
  city: string;
  names: string[];
  geometry: PolygonGeometry;
};

function polygon(points: [number, number][]): PolygonGeometry {
  return { type: "Polygon", coordinates: [points] };
}

export const NEIGHBORHOOD_POLYGONS: NeighborhoodPolygon[] = [
  {
    city: "roma",
    names: ["trastevere"],
    geometry: polygon([[12.4588, 41.8969], [12.4713, 41.8978], [12.4775, 41.8896], [12.4751, 41.8780], [12.4643, 41.8723], [12.4544, 41.8819], [12.4588, 41.8969]]),
  },
  {
    city: "roma",
    names: ["centro storico", "historic center"],
    geometry: polygon([[12.4635, 41.9068], [12.4869, 41.9074], [12.4897, 41.8951], [12.4790, 41.8864], [12.4648, 41.8902], [12.4589, 41.9000], [12.4635, 41.9068]]),
  },
  {
    city: "roma",
    names: ["prati"],
    geometry: polygon([[12.4428, 41.9249], [12.4719, 41.9252], [12.4748, 41.9109], [12.4622, 41.9046], [12.4444, 41.9106], [12.4428, 41.9249]]),
  },
  {
    city: "roma",
    names: ["testaccio"],
    geometry: polygon([[12.4628, 41.8845], [12.4823, 41.8821], [12.4842, 41.8718], [12.4712, 41.8685], [12.4619, 41.8754], [12.4628, 41.8845]]),
  },
  {
    city: "roma",
    names: ["monti"],
    geometry: polygon([[12.4820, 41.9004], [12.5018, 41.9001], [12.5043, 41.8892], [12.4900, 41.8871], [12.4813, 41.8935], [12.4820, 41.9004]]),
  },
  {
    city: "roma",
    names: ["esquilino / termini", "esquilino", "termini"],
    geometry: polygon([[12.4917, 41.9063], [12.5142, 41.9055], [12.5166, 41.8917], [12.5004, 41.8888], [12.4894, 41.8960], [12.4917, 41.9063]]),
  },
  {
    city: "parigi",
    names: ["le marais", "marais"],
    geometry: polygon([[2.3516, 48.8610], [2.3695, 48.8627], [2.3707, 48.8535], [2.3609, 48.8504], [2.3495, 48.8551], [2.3516, 48.8610]]),
  },
  {
    city: "parigi",
    names: ["saint-germain-des-pres", "saint-germain-des-prés", "saint germain"],
    geometry: polygon([[2.3219, 48.8562], [2.3400, 48.8569], [2.3440, 48.8484], [2.3335, 48.8441], [2.3191, 48.8498], [2.3219, 48.8562]]),
  },
  {
    city: "parigi",
    names: ["montmartre"],
    geometry: polygon([[2.3296, 48.8930], [2.3541, 48.8950], [2.3581, 48.8829], [2.3444, 48.8783], [2.3268, 48.8845], [2.3296, 48.8930]]),
  },
  {
    city: "parigi",
    names: ["bastille / oberkampf", "bastille", "oberkampf"],
    geometry: polygon([[2.3690, 48.8603], [2.3878, 48.8661], [2.3924, 48.8567], [2.3771, 48.8491], [2.3656, 48.8528], [2.3690, 48.8603]]),
  },
  {
    city: "napoli",
    names: ["centro storico", "historic centre", "historic center"],
    geometry: polygon([[14.2470, 40.8584], [14.2688, 40.8588], [14.2716, 40.8465], [14.2551, 40.8432], [14.2436, 40.8490], [14.2470, 40.8584]]),
  },
  {
    city: "napoli",
    names: ["chiaia - mergellina", "chiaia", "mergellina"],
    geometry: polygon([[14.2116, 40.8376], [14.2389, 40.8384], [14.2407, 40.8277], [14.2242, 40.8229], [14.2088, 40.8290], [14.2116, 40.8376]]),
  },
  {
    city: "napoli",
    names: ["quartieri spagnoli", "spanish quarter"],
    geometry: polygon([[14.2428, 40.8465], [14.2521, 40.8468], [14.2529, 40.8388], [14.2442, 40.8373], [14.2398, 40.8414], [14.2428, 40.8465]]),
  },
  {
    city: "napoli",
    names: ["posillipo"],
    geometry: polygon([[14.1780, 40.8228], [14.2142, 40.8247], [14.2219, 40.8055], [14.1942, 40.7940], [14.1711, 40.8062], [14.1780, 40.8228]]),
  },
  {
    city: "lisbona",
    names: ["alfama"],
    geometry: polygon([[-9.1369, 38.7161], [-9.1252, 38.7168], [-9.1233, 38.7077], [-9.1324, 38.7054], [-9.1396, 38.7102], [-9.1369, 38.7161]]),
  },
  {
    city: "lisbona",
    names: ["chiado / principe real", "chiado / príncipe real", "chiado", "principe real", "príncipe real"],
    geometry: polygon([[-9.1514, 38.7186], [-9.1368, 38.7184], [-9.1364, 38.7090], [-9.1463, 38.7062], [-9.1544, 38.7122], [-9.1514, 38.7186]]),
  },
  {
    city: "lisbona",
    names: ["mouraria"],
    geometry: polygon([[-9.1397, 38.7202], [-9.1290, 38.7203], [-9.1285, 38.7117], [-9.1373, 38.7101], [-9.1422, 38.7145], [-9.1397, 38.7202]]),
  },
  {
    city: "lisbona",
    names: ["bairro alto"],
    geometry: polygon([[-9.1516, 38.7152], [-9.1405, 38.7154], [-9.1392, 38.7094], [-9.1472, 38.7065], [-9.1532, 38.7100], [-9.1516, 38.7152]]),
  },
  {
    city: "barcellona",
    names: ["el born", "born"],
    geometry: polygon([[2.1762, 41.3896], [2.1885, 41.3907], [2.1903, 41.3833], [2.1802, 41.3815], [2.1741, 41.3857], [2.1762, 41.3896]]),
  },
  {
    city: "barcellona",
    names: ["eixample"],
    geometry: polygon([[2.1427, 41.4056], [2.1837, 41.4087], [2.1900, 41.3877], [2.1564, 41.3783], [2.1362, 41.3916], [2.1427, 41.4056]]),
  },
  {
    city: "barcellona",
    names: ["barceloneta"],
    geometry: polygon([[2.1858, 41.3867], [2.1997, 41.3879], [2.2055, 41.3763], [2.1948, 41.3716], [2.1832, 41.3787], [2.1858, 41.3867]]),
  },
  {
    city: "barcellona",
    names: ["gracia", "gràcia"],
    geometry: polygon([[2.1450, 41.4170], [2.1689, 41.4193], [2.1746, 41.4010], [2.1542, 41.3969], [2.1411, 41.4049], [2.1450, 41.4170]]),
  },
  {
    city: "madrid",
    names: ["sol - centro", "sol", "centro"],
    geometry: polygon([[-3.7131, 40.4218], [-3.6970, 40.4220], [-3.6947, 40.4115], [-3.7052, 40.4080], [-3.7155, 40.4135], [-3.7131, 40.4218]]),
  },
  {
    city: "madrid",
    names: ["malasana", "malasaña"],
    geometry: polygon([[-3.7104, 40.4335], [-3.6984, 40.4330], [-3.6976, 40.4233], [-3.7078, 40.4216], [-3.7140, 40.4271], [-3.7104, 40.4335]]),
  },
  {
    city: "madrid",
    names: ["la latina - lavapies", "la latina - lavapiés", "la latina", "lavapies", "lavapiés"],
    geometry: polygon([[-3.7136, 40.4130], [-3.6960, 40.4135], [-3.6940, 40.4050], [-3.7047, 40.3995], [-3.7169, 40.4051], [-3.7136, 40.4130]]),
  },
  {
    city: "madrid",
    names: ["salamanca"],
    geometry: polygon([[-3.6902, 40.4370], [-3.6640, 40.4380], [-3.6611, 40.4210], [-3.6819, 40.4160], [-3.6931, 40.4257], [-3.6902, 40.4370]]),
  },
  {
    city: "amsterdam",
    names: ["jordaan"],
    geometry: polygon([[4.8744, 52.3649], [4.8884, 52.3649], [4.8884, 52.3842], [4.8744, 52.3842], [4.8744, 52.3649]]),
  },
  {
    city: "amsterdam",
    names: ["de pijp"],
    geometry: polygon([[4.8866, 52.3481], [4.9102, 52.3481], [4.9102, 52.3600], [4.8866, 52.3600], [4.8866, 52.3481]]),
  },
  {
    city: "amsterdam",
    names: ["grachtengordel", "grachtengordel canali", "grachtengordel canal ring"],
    geometry: polygon([[4.8792, 52.3609], [4.9116, 52.3609], [4.9116, 52.3829], [4.8792, 52.3829], [4.8792, 52.3609]]),
  },
  {
    city: "amsterdam",
    names: ["oud-west", "oud west"],
    geometry: polygon([[4.8547, 52.3563], [4.8813, 52.3563], [4.8813, 52.3732], [4.8547, 52.3732], [4.8547, 52.3563]]),
  },
  {
    city: "berlino",
    names: ["mitte"],
    geometry: polygon([[13.3659, 52.5040], [13.4294, 52.5040], [13.4294, 52.5404], [13.3659, 52.5404], [13.3659, 52.5040]]),
  },
  {
    city: "berlino",
    names: ["prenzlauer berg"],
    geometry: polygon([[13.3968, 52.5199], [13.4721, 52.5199], [13.4721, 52.5586], [13.3968, 52.5586], [13.3968, 52.5199]]),
  },
  {
    city: "berlino",
    names: ["kreuzberg"],
    geometry: polygon([[13.3682, 52.4828], [13.4529, 52.4828], [13.4529, 52.5094], [13.3682, 52.5094], [13.3682, 52.4828]]),
  },
  {
    city: "berlino",
    names: ["friedrichshain"],
    geometry: polygon([[13.4198, 52.4861], [13.4914, 52.4861], [13.4914, 52.5310], [13.4198, 52.5310], [13.4198, 52.4861]]),
  },
  {
    city: "atene",
    names: ["monastiraki / plaka", "monastiraki", "plaka"],
    geometry: polygon([[23.7200, 37.9680], [23.7358, 37.9686], [23.7375, 37.9758], [23.7274, 37.9786], [23.7181, 37.9744], [23.7200, 37.9680]]),
  },
  {
    city: "atene",
    names: ["kolonaki"],
    geometry: polygon([[23.7348, 37.9763], [23.7512, 37.9767], [23.7529, 37.9854], [23.7427, 37.9890], [23.7331, 37.9833], [23.7348, 37.9763]]),
  },
  {
    city: "atene",
    names: ["psiri / thissio", "psiri", "thissio"],
    geometry: polygon([[23.7118, 37.9732], [23.7267, 37.9731], [23.7279, 37.9815], [23.7168, 37.9842], [23.7099, 37.9794], [23.7118, 37.9732]]),
  },
  {
    city: "atene",
    names: ["koukaki / makrygianni", "koukaki", "makrygianni"],
    geometry: polygon([[23.7173, 37.9595], [23.7286, 37.9595], [23.7286, 37.9672], [23.7173, 37.9672], [23.7173, 37.9595]]),
  },
  {
    city: "londra",
    names: ["shoreditch"],
    geometry: polygon([[-0.0924, 51.5188], [-0.0645, 51.5198], [-0.0617, 51.5352], [-0.0842, 51.5387], [-0.0972, 51.5289], [-0.0924, 51.5188]]),
  },
  {
    city: "londra",
    names: ["south bank"],
    geometry: polygon([[-0.1214, 51.4987], [-0.0985, 51.4995], [-0.0918, 51.5062], [-0.1124, 51.5096], [-0.1260, 51.5051], [-0.1214, 51.4987]]),
  },
  {
    city: "londra",
    names: ["notting hill"],
    geometry: polygon([[-0.2142, 51.5044], [-0.1878, 51.5048], [-0.1857, 51.5220], [-0.2058, 51.5262], [-0.2208, 51.5168], [-0.2142, 51.5044]]),
  },
  {
    city: "londra",
    names: ["covent garden"],
    geometry: polygon([[-0.1294, 51.5094], [-0.1178, 51.5096], [-0.1171, 51.5163], [-0.1268, 51.5169], [-0.1322, 51.5130], [-0.1294, 51.5094]]),
  },
  {
    city: "milano",
    names: ["brera"],
    geometry: polygon([[9.1796, 45.4652], [9.1984, 45.4652], [9.1984, 45.4821], [9.1796, 45.4821], [9.1796, 45.4652]]),
  },
  {
    city: "milano",
    names: ["navigli"],
    geometry: polygon([[9.1549, 45.4429], [9.1789, 45.4429], [9.1789, 45.4576], [9.1549, 45.4576], [9.1549, 45.4429]]),
  },
  {
    city: "milano",
    names: ["porta venezia"],
    geometry: polygon([[9.1957, 45.4682], [9.2155, 45.4688], [9.2182, 45.4823], [9.2012, 45.4861], [9.1931, 45.4776], [9.1957, 45.4682]]),
  },
  {
    city: "milano",
    names: ["centrale / repubblica", "centrale", "repubblica"],
    geometry: polygon([[9.1946, 45.4792], [9.2144, 45.4790], [9.2208, 45.4948], [9.2021, 45.5012], [9.1885, 45.4919], [9.1946, 45.4792]]),
  },
  {
    city: "firenze",
    names: ["centro storico", "historic center", "historic centre"],
    geometry: polygon([[11.1962, 43.7477], [11.2726, 43.7477], [11.2726, 43.7909], [11.1962, 43.7909], [11.1962, 43.7477]]),
  },
  {
    city: "firenze",
    names: ["oltrarno"],
    geometry: polygon([[11.2380, 43.7575], [11.2670, 43.7582], [11.2675, 43.7702], [11.2445, 43.7731], [11.2325, 43.7653], [11.2380, 43.7575]]),
  },
  {
    city: "firenze",
    names: ["santa croce"],
    geometry: polygon([[11.2525, 43.7642], [11.2738, 43.7645], [11.2754, 43.7768], [11.2604, 43.7790], [11.2491, 43.7726], [11.2525, 43.7642]]),
  },
  {
    city: "firenze",
    names: ["san frediano"],
    geometry: polygon([[11.2308, 43.7636], [11.2476, 43.7637], [11.2488, 43.7731], [11.2352, 43.7760], [11.2268, 43.7701], [11.2308, 43.7636]]),
  },
  {
    city: "venezia",
    names: ["dorsoduro"],
    geometry: polygon([[12.3095, 45.4284], [12.3371, 45.4284], [12.3371, 45.4378], [12.3095, 45.4378], [12.3095, 45.4284]]),
  },
  {
    city: "venezia",
    names: ["cannaregio"],
    geometry: polygon([[12.3137, 45.4383], [12.3426, 45.4383], [12.3426, 45.4493], [12.3137, 45.4493], [12.3137, 45.4383]]),
  },
  {
    city: "venezia",
    names: ["castello"],
    geometry: polygon([[12.3376, 45.4273], [12.3632, 45.4273], [12.3632, 45.4419], [12.3376, 45.4419], [12.3376, 45.4273]]),
  },
  {
    city: "venezia",
    names: ["giudecca"],
    geometry: polygon([[12.3074, 45.4231], [12.3418, 45.4231], [12.3418, 45.4290], [12.3074, 45.4290], [12.3074, 45.4231]]),
  },
  {
    city: "vienna",
    names: ["innere stadt", "innere stadt 1 distretto", "innere stadt 1st district"],
    geometry: polygon([[16.3552, 48.1995], [16.3849, 48.1995], [16.3849, 48.2185], [16.3552, 48.2185], [16.3552, 48.1995]]),
  },
  {
    city: "vienna",
    names: ["naschmarkt / mariahilf", "naschmarkt", "mariahilf"],
    geometry: polygon([[16.3373, 48.1883], [16.3660, 48.1883], [16.3660, 48.2026], [16.3373, 48.2026], [16.3373, 48.1883]]),
  },
  {
    city: "vienna",
    names: ["leopoldstadt", "leopoldstadt 2 distretto", "leopoldstadt 2nd district"],
    geometry: polygon([[16.3675, 48.1651], [16.4985, 48.1651], [16.4985, 48.2363], [16.3675, 48.2363], [16.3675, 48.1651]]),
  },
  {
    city: "vienna",
    names: ["neubau", "neubau 7 distretto", "neubau 7th district"],
    geometry: polygon([[16.3369, 48.1959], [16.3615, 48.1959], [16.3615, 48.2086], [16.3369, 48.2086], [16.3369, 48.1959]]),
  },
  {
    city: "budapest",
    names: ["vii distretto / erzsebetvaros", "erzsebetvaros", "erzsébetváros"],
    geometry: polygon([[19.0552, 47.4943], [19.0911, 47.4943], [19.0911, 47.5112], [19.0552, 47.5112], [19.0552, 47.4943]]),
  },
  {
    city: "budapest",
    names: ["buda / i distretto castello", "buda", "i distretto", "castello", "castle district"],
    geometry: polygon([[19.0266, 47.4940], [19.0417, 47.4940], [19.0417, 47.5054], [19.0266, 47.5054], [19.0266, 47.4940]]),
  },
  {
    city: "budapest",
    names: ["v distretto / belvaros centro", "v distretto", "belvaros", "belváros", "centro"],
    geometry: polygon([[19.0420, 47.4858], [19.0618, 47.4858], [19.0618, 47.5147], [19.0420, 47.5147], [19.0420, 47.4858]]),
  },
  {
    city: "budapest",
    names: ["vi distretto / terezvaros", "terezvaros", "terézváros"],
    geometry: polygon([[19.0548, 47.4976], [19.0808, 47.4976], [19.0808, 47.5186], [19.0548, 47.5186], [19.0548, 47.4976]]),
  },
  {
    city: "praga",
    names: ["stare mesto citta vecchia", "staré město", "stare mesto", "citta vecchia", "old town"],
    geometry: polygon([[14.4090, 50.0787], [14.4285, 50.0787], [14.4285, 50.0943], [14.4090, 50.0943], [14.4090, 50.0787]]),
  },
  {
    city: "praga",
    names: ["vinohrady"],
    geometry: polygon([[14.4233, 50.0654], [14.4865, 50.0654], [14.4865, 50.0866], [14.4233, 50.0866], [14.4233, 50.0654]]),
  },
  {
    city: "praga",
    names: ["zizkov", "žižkov"],
    geometry: polygon([[14.4381, 50.0776], [14.5033, 50.0776], [14.5033, 50.0978], [14.4381, 50.0978], [14.4381, 50.0776]]),
  },
  {
    city: "praga",
    names: ["mala strana piccolo quartiere", "malá strana", "mala strana", "piccolo quartiere"],
    geometry: polygon([[14.3928, 50.0794], [14.4149, 50.0794], [14.4149, 50.0935], [14.3928, 50.0935], [14.3928, 50.0794]]),
  },
  {
    city: "dublino",
    names: ["temple bar / city centre", "temple bar", "city centre"],
    geometry: polygon([[-6.2702, 53.3436], [-6.2593, 53.3436], [-6.2593, 53.3468], [-6.2702, 53.3468], [-6.2702, 53.3436]]),
  },
  {
    city: "dublino",
    names: ["portobello / dublin 8", "portobello", "dublin 8"],
    geometry: polygon([[-6.2768, 53.3245], [-6.2643, 53.3245], [-6.2643, 53.3326], [-6.2768, 53.3326], [-6.2768, 53.3245]]),
  },
  {
    city: "dublino",
    names: ["ranelagh"],
    geometry: polygon([[-6.2684, 53.3140], [-6.2441, 53.3144], [-6.2426, 53.3298], [-6.2593, 53.3330], [-6.2722, 53.3238], [-6.2684, 53.3140]]),
  },
  {
    city: "dublino",
    names: ["stoneybatter / smithfield", "stoneybatter", "smithfield"],
    geometry: polygon([[-6.2888, 53.3441], [-6.2713, 53.3444], [-6.2694, 53.3538], [-6.2822, 53.3580], [-6.2936, 53.3517], [-6.2888, 53.3441]]),
  },
  {
    city: "edimburgo",
    names: ["old town"],
    geometry: polygon([[-3.2058, 55.9449], [-3.1579, 55.9449], [-3.1579, 55.9575], [-3.2058, 55.9575], [-3.2058, 55.9449]]),
  },
  {
    city: "edimburgo",
    names: ["new town"],
    geometry: polygon([[-3.2140, 55.9518], [-3.1791, 55.9522], [-3.1748, 55.9621], [-3.2024, 55.9657], [-3.2192, 55.9590], [-3.2140, 55.9518]]),
  },
  {
    city: "edimburgo",
    names: ["leith"],
    geometry: polygon([[-3.1981, 55.9563], [-3.1406, 55.9563], [-3.1406, 55.9917], [-3.1981, 55.9917], [-3.1981, 55.9563]]),
  },
  {
    city: "edimburgo",
    names: ["stockbridge"],
    geometry: polygon([[-3.2247, 55.9528], [-3.2025, 55.9528], [-3.2025, 55.9624], [-3.2247, 55.9624], [-3.2247, 55.9528]]),
  },
  {
    city: "copenaghen",
    names: ["indre by centro storico", "indre by", "centro storico"],
    geometry: polygon([[12.5602, 55.6708], [12.5967, 55.6712], [12.5994, 55.6905], [12.5765, 55.6930], [12.5549, 55.6832], [12.5602, 55.6708]]),
  },
  {
    city: "copenaghen",
    names: ["norrebro", "nørrebro"],
    geometry: polygon([[12.5358, 55.6841], [12.5657, 55.6842], [12.5701, 55.7062], [12.5468, 55.7132], [12.5289, 55.6993], [12.5358, 55.6841]]),
  },
  {
    city: "copenaghen",
    names: ["vesterbro"],
    geometry: polygon([[12.5315, 55.6609], [12.5650, 55.6617], [12.5686, 55.6766], [12.5448, 55.6813], [12.5268, 55.6716], [12.5315, 55.6609]]),
  },
  {
    city: "copenaghen",
    names: ["frederiksberg"],
    geometry: polygon([[12.4994, 55.6630], [12.5444, 55.6628], [12.5486, 55.6948], [12.5177, 55.7046], [12.4911, 55.6840], [12.4994, 55.6630]]),
  },
  {
    city: "cracovia",
    names: ["stare miasto"],
    geometry: polygon([[19.9317, 50.0517], [19.9451, 50.0517], [19.9451, 50.0663], [19.9317, 50.0663], [19.9317, 50.0517]]),
  },
  {
    city: "cracovia",
    names: ["kazimierz"],
    geometry: polygon([[19.9343, 50.0448], [19.9547, 50.0448], [19.9547, 50.0584], [19.9343, 50.0584], [19.9343, 50.0448]]),
  },
  {
    city: "cracovia",
    names: ["podgorze", "podgórze"],
    geometry: polygon([[19.9272, 50.0253], [20.1032, 50.0253], [20.1032, 50.0599], [19.9272, 50.0599], [19.9272, 50.0253]]),
  },
  {
    city: "cracovia",
    names: ["grzegorzki", "grzegórzki"],
    geometry: polygon([[19.9473, 50.0501], [19.9887, 50.0501], [19.9887, 50.0798], [19.9473, 50.0798], [19.9473, 50.0501]]),
  },
  {
    city: "stoccolma",
    names: ["gamla stan", "gamla stan old town"],
    geometry: polygon([[18.0623, 59.3207], [18.0816, 59.3207], [18.0816, 59.3291], [18.0623, 59.3291], [18.0623, 59.3207]]),
  },
  {
    city: "stoccolma",
    names: ["sodermalm", "södermalm"],
    geometry: polygon([[18.0261, 59.3032], [18.1072, 59.3032], [18.1072, 59.3214], [18.0261, 59.3214], [18.0261, 59.3032]]),
  },
  {
    city: "stoccolma",
    names: ["ostermalm", "östermalm"],
    geometry: polygon([[18.0579, 59.3297], [18.1096, 59.3297], [18.1096, 59.3506], [18.0579, 59.3506], [18.0579, 59.3297]]),
  },
  {
    city: "stoccolma",
    names: ["vasastan"],
    geometry: polygon([[18.0248, 59.3354], [18.0655, 59.3354], [18.0655, 59.3565], [18.0248, 59.3565], [18.0248, 59.3354]]),
  },
  {
    city: "valencia",
    names: ["ciutat vella", "old town"],
    geometry: polygon([[-0.3842, 39.4671], [-0.3660, 39.4671], [-0.3660, 39.4821], [-0.3842, 39.4821], [-0.3842, 39.4671]]),
  },
  {
    city: "valencia",
    names: ["eixample"],
    geometry: polygon([[-0.3812, 39.4546], [-0.3598, 39.4546], [-0.3598, 39.4731], [-0.3812, 39.4731], [-0.3812, 39.4546]]),
  },
  {
    city: "valencia",
    names: ["ruzafa", "russafa"],
    geometry: polygon([[-0.3812, 39.4546], [-0.3621, 39.4546], [-0.3621, 39.4675], [-0.3812, 39.4675], [-0.3812, 39.4546]]),
  },
  {
    city: "valencia",
    names: ["la malvarrosa", "la malva-rosa"],
    geometry: polygon([[-0.3332, 39.4746], [-0.3227, 39.4746], [-0.3227, 39.4857], [-0.3332, 39.4857], [-0.3332, 39.4746]]),
  },
  {
    city: "antalya",
    names: ["kaleici", "kaleiçi", "old town"],
    geometry: polygon([[30.7017, 36.8802], [30.7117, 36.8800], [30.7140, 36.8876], [30.7051, 36.8910], [30.6986, 36.8860], [30.7017, 36.8802]]),
  },
  {
    city: "antalya",
    names: ["konyaalti", "konyaaltı"],
    geometry: polygon([[30.3012, 36.6819], [30.6655, 36.6819], [30.6655, 36.9489], [30.3012, 36.9489], [30.3012, 36.6819]]),
  },
  {
    city: "antalya",
    names: ["lara"],
    geometry: polygon([[30.7505, 36.8352], [30.8935, 36.8356], [30.9062, 36.8835], [30.7835, 36.9020], [30.7351, 36.8695], [30.7505, 36.8352]]),
  },
  {
    city: "antalya",
    names: ["muratpasa", "muratpaşa"],
    geometry: polygon([[30.6610, 36.8453], [30.8684, 36.8453], [30.8684, 36.9309], [30.6610, 36.9309], [30.6610, 36.8453]]),
  },
  {
    city: "bergen",
    names: ["bryggen / sentrum", "bryggen", "sentrum"],
    geometry: polygon([[5.3197, 60.3894], [5.3272, 60.3894], [5.3272, 60.3969], [5.3197, 60.3969], [5.3197, 60.3894]]),
  },
  {
    city: "bergen",
    names: ["nordnes"],
    geometry: polygon([[5.2790, 60.3965], [5.3145, 60.3965], [5.3145, 60.4112], [5.2790, 60.4112], [5.2790, 60.3965]]),
  },
  {
    city: "bergen",
    names: ["mohlenpris", "møhlenpris"],
    geometry: polygon([[5.3166, 60.3800], [5.3351, 60.3800], [5.3351, 60.3870], [5.3166, 60.3870], [5.3166, 60.3800]]),
  },
  {
    city: "bergen",
    names: ["floen / skansen", "fløen / skansen", "floen", "fløen", "skansen"],
    geometry: polygon([[5.3289, 60.3904], [5.3447, 60.3904], [5.3447, 60.3983], [5.3289, 60.3983], [5.3289, 60.3904]]),
  },
  {
    city: "bratislava",
    names: ["stare mesto", "staré mesto", "old town"],
    geometry: polygon([[17.0721, 48.1359], [17.1325, 48.1359], [17.1325, 48.1745], [17.0721, 48.1745], [17.0721, 48.1359]]),
  },
  {
    city: "bratislava",
    names: ["nove mesto", "nové mesto", "new town"],
    geometry: polygon([[17.0640, 48.1559], [17.1892, 48.1559], [17.1892, 48.2280], [17.0640, 48.2280], [17.0640, 48.1559]]),
  },
  {
    city: "bratislava",
    names: ["petrzalka", "petržalka"],
    geometry: polygon([[17.0574, 48.0810], [17.1464, 48.0810], [17.1464, 48.1424], [17.0574, 48.1424], [17.0574, 48.0810]]),
  },
  {
    city: "bratislava",
    names: ["ruzinov", "ružinov"],
    geometry: polygon([[17.1174, 48.0952], [17.2373, 48.0952], [17.2373, 48.1917], [17.1174, 48.1917], [17.1174, 48.0952]]),
  },
  {
    city: "bruges",
    names: ["historium / markt", "historium", "markt"],
    geometry: polygon([[3.2166, 51.2058], [3.2292, 51.2057], [3.2314, 51.2130], [3.2226, 51.2160], [3.2134, 51.2116], [3.2166, 51.2058]]),
  },
  {
    city: "bruges",
    names: ["begijnhof / minnewater", "begijnhof", "minnewater"],
    geometry: polygon([[3.2158, 51.1944], [3.2294, 51.1946], [3.2310, 51.2035], [3.2192, 51.2051], [3.2116, 51.1998], [3.2158, 51.1944]]),
  },
  {
    city: "bruges",
    names: ["sint-annakwartier", "sint anna"],
    geometry: polygon([[3.2245, 51.2088], [3.2442, 51.2092], [3.2461, 51.2190], [3.2309, 51.2225], [3.2216, 51.2165], [3.2245, 51.2088]]),
  },
  {
    city: "bruges",
    names: ["sint-jakobsstraat / zuid", "sint-jakobsstraat", "zuid"],
    geometry: polygon([[3.2098, 51.2020], [3.2244, 51.2018], [3.2259, 51.2166], [3.2111, 51.2188], [3.2045, 51.2104], [3.2098, 51.2020]]),
  },
  {
    city: "bucarest",
    names: ["centrul vechi"],
    geometry: polygon([[26.0967, 44.4289], [26.1035, 44.4289], [26.1035, 44.4341], [26.0967, 44.4341], [26.0967, 44.4289]]),
  },
  {
    city: "bucarest",
    names: ["floreasca"],
    geometry: polygon([[26.0946, 44.4532], [26.1096, 44.4532], [26.1096, 44.4801], [26.0946, 44.4801], [26.0946, 44.4532]]),
  },
  {
    city: "bucarest",
    names: ["dorobanti", "dorobanți"],
    geometry: polygon([[26.0863, 44.4523], [26.0986, 44.4523], [26.0986, 44.4656], [26.0863, 44.4656], [26.0863, 44.4523]]),
  },
  {
    city: "bucarest",
    names: ["piata unirii", "piața unirii"],
    geometry: polygon([[26.1007, 44.4256], [26.1043, 44.4256], [26.1043, 44.4293], [26.1007, 44.4293], [26.1007, 44.4256]]),
  },
  {
    city: "candia",
    names: ["centro storico", "old town", "historic center"],
    geometry: polygon([[25.1265, 35.3358], [25.1460, 35.3360], [25.1490, 35.3458], [25.1348, 35.3501], [25.1225, 35.3432], [25.1265, 35.3358]]),
  },
  {
    city: "candia",
    names: ["koules - porto veneziano", "koules", "porto veneziano"],
    geometry: polygon([[25.1326, 35.3412], [25.1480, 35.3410], [25.1513, 35.3475], [25.1398, 35.3504], [25.1308, 35.3465], [25.1326, 35.3412]]),
  },
  {
    city: "candia",
    names: ["ammoudara"],
    geometry: polygon([[25.0565, 35.3270], [25.1012, 35.3264], [25.1055, 35.3425], [25.0708, 35.3475], [25.0506, 35.3376], [25.0565, 35.3270]]),
  },
  {
    city: "candia",
    names: ["poros"],
    geometry: polygon([[25.1500, 35.3276], [25.1685, 35.3278], [25.1710, 35.3415], [25.1560, 35.3448], [25.1464, 35.3368], [25.1500, 35.3276]]),
  },
  {
    city: "francoforte",
    names: ["altstadt / romerberg", "altstadt", "römerberg", "romerberg"],
    geometry: polygon([[8.6749, 50.1064], [8.6882, 50.1064], [8.6882, 50.1148], [8.6749, 50.1148], [8.6749, 50.1064]]),
  },
  {
    city: "francoforte",
    names: ["sachsenhausen"],
    geometry: polygon([[8.5985, 50.0391], [8.7502, 50.0391], [8.7502, 50.1085], [8.5985, 50.1085], [8.5985, 50.0391]]),
  },
  {
    city: "francoforte",
    names: ["bornheim"],
    geometry: polygon([[8.6983, 50.1218], [8.7255, 50.1218], [8.7255, 50.1440], [8.6983, 50.1440], [8.6983, 50.1218]]),
  },
  {
    city: "francoforte",
    names: ["nordend"],
    geometry: polygon([[8.6714, 50.1179], [8.6989, 50.1179], [8.6989, 50.1429], [8.6714, 50.1429], [8.6714, 50.1179]]),
  },
  {
    city: "istanbul",
    names: ["sultanahmet"],
    geometry: polygon([[28.9748, 41.0011], [28.9826, 41.0011], [28.9826, 41.0072], [28.9748, 41.0072], [28.9748, 41.0011]]),
  },
  {
    city: "istanbul",
    names: ["beyoglu - taksim", "beyoğlu - taksim", "beyoglu", "beyoğlu", "taksim"],
    geometry: polygon([[28.9390, 41.0211], [28.9958, 41.0211], [28.9958, 41.0644], [28.9390, 41.0644], [28.9390, 41.0211]]),
  },
  {
    city: "istanbul",
    names: ["karakoy - galata", "karaköy - galata", "karakoy", "karaköy", "galata"],
    geometry: polygon([[28.9658, 41.0190], [28.9844, 41.0192], [28.9868, 41.0309], [28.9732, 41.0340], [28.9615, 41.0268], [28.9658, 41.0190]]),
  },
  {
    city: "istanbul",
    names: ["kadikoy", "kadıköy"],
    geometry: polygon([[29.0148, 40.9500], [29.1112, 40.9500], [29.1112, 41.0123], [29.0148, 41.0123], [29.0148, 40.9500]]),
  },
  {
    city: "marrakech",
    names: ["medina"],
    geometry: polygon([[-8.0069, 31.6191], [-7.9800, 31.6197], [-7.9768, 31.6376], [-7.9970, 31.6449], [-8.0164, 31.6344], [-8.0069, 31.6191]]),
  },
  {
    city: "marrakech",
    names: ["gueliz"],
    geometry: polygon([[-8.0407, 31.5950], [-7.9832, 31.5950], [-7.9832, 31.6987], [-8.0407, 31.6987], [-8.0407, 31.5950]]),
  },
  {
    city: "marrakech",
    names: ["palmeraie"],
    geometry: polygon([[-7.9565, 31.6564], [-7.9436, 31.6564], [-7.9436, 31.6724], [-7.9565, 31.6724], [-7.9565, 31.6564]]),
  },
  {
    city: "marrakech",
    names: ["hivernage"],
    geometry: polygon([[-8.0218, 31.6115], [-7.9972, 31.6115], [-7.9941, 31.6268], [-8.0133, 31.6330], [-8.0274, 31.6234], [-8.0218, 31.6115]]),
  },
  {
    city: "marsiglia",
    names: ["le panier"],
    geometry: polygon([[5.3645, 43.2968], [5.3710, 43.2968], [5.3710, 43.3023], [5.3645, 43.3023], [5.3645, 43.2968]]),
  },
  {
    city: "marsiglia",
    names: ["vieux-port 1 arr", "vieux-port", "vieux port"],
    geometry: polygon([[5.3653, 43.2908], [5.3816, 43.2911], [5.3828, 43.2998], [5.3698, 43.3024], [5.3608, 43.2972], [5.3653, 43.2908]]),
  },
  {
    city: "marsiglia",
    names: ["endoume / vallon des auffes", "endoume", "vallon des auffes"],
    geometry: polygon([[5.3436, 43.2772], [5.3589, 43.2772], [5.3589, 43.2915], [5.3436, 43.2915], [5.3436, 43.2772]]),
  },
  {
    city: "marsiglia",
    names: ["cours julien 6 arr", "cours julien"],
    geometry: polygon([[5.3795, 43.2892], [5.3920, 43.2893], [5.3939, 43.2987], [5.3830, 43.3010], [5.3758, 43.2950], [5.3795, 43.2892]]),
  },
  {
    city: "monaco_di_baviera",
    names: ["altstadt / maxvorstadt", "altstadt", "maxvorstadt"],
    geometry: polygon([[11.5648, 48.1309], [11.5982, 48.1309], [11.5982, 48.1566], [11.5648, 48.1566], [11.5648, 48.1309]]),
  },
  {
    city: "monaco_di_baviera",
    names: ["schwabing"],
    geometry: polygon([[11.5708, 48.1552], [11.6065, 48.1553], [11.6122, 48.1868], [11.5847, 48.1945], [11.5608, 48.1746], [11.5708, 48.1552]]),
  },
  {
    city: "monaco_di_baviera",
    names: ["glockenbachviertel"],
    geometry: polygon([[11.5576, 48.1242], [11.5748, 48.1244], [11.5760, 48.1376], [11.5630, 48.1404], [11.5520, 48.1324], [11.5576, 48.1242]]),
  },
  {
    city: "monaco_di_baviera",
    names: ["haidhausen / au", "haidhausen", "au"],
    geometry: polygon([[11.5843, 48.1198], [11.6135, 48.1204], [11.6154, 48.1426], [11.5940, 48.1492], [11.5776, 48.1344], [11.5843, 48.1198]]),
  },
  {
    city: "oslo",
    names: ["grunerlokka", "grünerløkka"],
    geometry: polygon([[10.7480, 59.9135], [10.8077, 59.9135], [10.8077, 59.9376], [10.7480, 59.9376], [10.7480, 59.9135]]),
  },
  {
    city: "oslo",
    names: ["aker brygge / tjuvholmen", "aker brygge", "tjuvholmen"],
    geometry: polygon([[10.7158, 59.9046], [10.7308, 59.9048], [10.7330, 59.9146], [10.7216, 59.9174], [10.7116, 59.9112], [10.7158, 59.9046]]),
  },
  {
    city: "oslo",
    names: ["frogner"],
    geometry: polygon([[10.6462, 59.8836], [10.7354, 59.8836], [10.7354, 59.9355], [10.6462, 59.9355], [10.6462, 59.8836]]),
  },
  {
    city: "oslo",
    names: ["sentrum centro", "sentrum", "centro"],
    geometry: polygon([[10.7226, 59.8997], [10.7589, 59.8997], [10.7589, 59.9203], [10.7226, 59.9203], [10.7226, 59.8997]]),
  },
  {
    city: "porto",
    names: ["ribeira"],
    geometry: polygon([[-8.6186, 41.1387], [-8.6044, 41.1388], [-8.6030, 41.1469], [-8.6136, 41.1492], [-8.6220, 41.1442], [-8.6186, 41.1387]]),
  },
  {
    city: "porto",
    names: ["bonfim"],
    geometry: polygon([[-8.6047, 41.1384], [-8.5864, 41.1384], [-8.5864, 41.1672], [-8.6047, 41.1672], [-8.6047, 41.1384]]),
  },
  {
    city: "porto",
    names: ["boavista"],
    geometry: polygon([[-8.6462, 41.1502], [-8.6168, 41.1508], [-8.6134, 41.1704], [-8.6376, 41.1768], [-8.6530, 41.1642], [-8.6462, 41.1502]]),
  },
  {
    city: "porto",
    names: ["vila nova de gaia"],
    geometry: polygon([[-8.6757, 41.0093], [-8.4487, 41.0093], [-8.4487, 41.1475], [-8.6757, 41.1475], [-8.6757, 41.0093]]),
  },
  {
    city: "siviglia",
    names: ["santa cruz"],
    geometry: polygon([[-5.9971, 37.3753], [-5.9864, 37.3753], [-5.9864, 37.3897], [-5.9971, 37.3897], [-5.9971, 37.3753]]),
  },
  {
    city: "siviglia",
    names: ["triana"],
    geometry: polygon([[-6.0250, 37.3674], [-5.9893, 37.3674], [-5.9893, 37.4240], [-6.0250, 37.4240], [-6.0250, 37.3674]]),
  },
  {
    city: "siviglia",
    names: ["la macarena", "macarena"],
    geometry: polygon([[-5.9998, 37.3946], [-5.9798, 37.3948], [-5.9765, 37.4086], [-5.9928, 37.4142], [-6.0062, 37.4050], [-5.9998, 37.3946]]),
  },
  {
    city: "siviglia",
    names: ["el arenal"],
    geometry: polygon([[-6.0020, 37.3827], [-5.9938, 37.3827], [-5.9938, 37.3898], [-6.0020, 37.3898], [-6.0020, 37.3827]]),
  },
  {
    city: "varsavia",
    names: ["stare miasto", "old town"],
    geometry: polygon([[21.0062, 52.2465], [21.0210, 52.2465], [21.0210, 52.2535], [21.0062, 52.2535], [21.0062, 52.2465]]),
  },
  {
    city: "varsavia",
    names: ["srodmiescie", "śródmieście", "city centre"],
    geometry: polygon([[20.9810, 52.2068], [21.0636, 52.2068], [21.0636, 52.2613], [20.9810, 52.2613], [20.9810, 52.2068]]),
  },
  {
    city: "varsavia",
    names: ["praga"],
    geometry: polygon([[21.0272, 52.2358], [21.0794, 52.2365], [21.0835, 52.2738], [21.0434, 52.2814], [21.0156, 52.2586], [21.0272, 52.2358]]),
  },
  {
    city: "varsavia",
    names: ["mokotow", "mokotów"],
    geometry: polygon([[20.9819, 52.1643], [21.1049, 52.1643], [21.1049, 52.2189], [20.9819, 52.2189], [20.9819, 52.1643]]),
  },
  {
    city: "muğla",
    names: ["bodrum centro", "bodrum"],
    geometry: polygon([[27.1802, 36.9506], [27.7780, 36.9506], [27.7780, 37.1767], [27.1802, 37.1767], [27.1802, 36.9506]]),
  },
  {
    city: "muğla",
    names: ["marmaris centro", "marmaris"],
    geometry: polygon([[27.9564, 36.5536], [28.4574, 36.5536], [28.4574, 37.0251], [27.9564, 37.0251], [27.9564, 36.5536]]),
  },
  {
    city: "muğla",
    names: ["fethiye"],
    geometry: polygon([[28.8814, 36.4344], [29.3120, 36.4344], [29.3120, 36.8675], [28.8814, 36.8675], [28.8814, 36.4344]]),
  },
  {
    city: "muğla",
    names: ["mugla citta", "muğla città", "mugla", "muğla"],
    geometry: polygon([[28.2748, 37.1435], [28.4268, 37.1438], [28.4420, 37.2520], [28.3376, 37.2920], [28.2360, 37.2262], [28.2748, 37.1435]]),
  },
  {
    city: "helsinki",
    names: ["kluuvi e kaartinkaupunki", "kluuvi and kaartinkaupunki", "kluuvi et kaartinkaupunki", "kluuvi y kaartinkaupunki"],
    geometry: polygon([[24.9300,60.1620],[24.9595,60.1620],[24.9620,60.1745],[24.9330,60.1765],[24.9300,60.1620]]),
  },
  {
    city: "helsinki",
    names: ["punavuori e design district", "punavuori and design district", "punavuori et design district", "punavuori y design district"],
    geometry: polygon([[24.9220,60.1510],[24.9520,60.1510],[24.9530,60.1650],[24.9250,60.1680],[24.9220,60.1510]]),
  },
  {
    city: "helsinki",
    names: ["katajanokka e kruununhaka", "katajanokka and kruununhaka", "katajanokka et kruununhaka", "katajanokka y kruununhaka"],
    geometry: polygon([[24.9490,60.1640],[24.9810,60.1630],[24.9810,60.1775],[24.9500,60.1790],[24.9490,60.1640]]),
  },
  {
    city: "helsinki",
    names: ["kallio e hakaniemi", "kallio and hakaniemi", "kallio et hakaniemi", "kallio y hakaniemi"],
    geometry: polygon([[24.9370,60.1760],[24.9680,60.1760],[24.9700,60.1960],[24.9380,60.1970],[24.9370,60.1760]]),
  },
  {
    city: "helsinki",
    names: ["töölö", "toolo"],
    geometry: polygon([[24.9020,60.1670],[24.9380,60.1670],[24.9400,60.1950],[24.9070,60.1980],[24.9020,60.1670]]),
  },
  {
    city: "helsinki",
    names: ["munkkiniemi"],
    geometry: polygon([[24.8500,60.1850],[24.8910,60.1830],[24.8960,60.2100],[24.8550,60.2140],[24.8500,60.1850]]),
  },
  {
    city: "dubrovnik",
    names: ["centro storico", "old town", "vieille ville", "casco antiguo"],
    geometry: polygon([[18.1060,42.6380],[18.1126,42.6380],[18.1130,42.6422],[18.1060,42.6422],[18.1060,42.6380]]),
  },
  {
    city: "dubrovnik",
    names: ["pile"],
    geometry: polygon([[18.0965,42.6380],[18.1068,42.6375],[18.1070,42.6460],[18.0970,42.6465],[18.0965,42.6380]]),
  },
  {
    city: "dubrovnik",
    names: ["ploče", "ploce"],
    geometry: polygon([[18.1110,42.6365],[18.1260,42.6365],[18.1280,42.6480],[18.1120,42.6480],[18.1110,42.6365]]),
  },
  {
    city: "dubrovnik",
    names: ["gruž", "gruz"],
    geometry: polygon([[18.0750,42.6500],[18.0980,42.6500],[18.1000,42.6660],[18.0760,42.6680],[18.0750,42.6500]]),
  },
  {
    city: "dubrovnik",
    names: ["lapad"],
    geometry: polygon([[18.0570,42.6430],[18.0780,42.6430],[18.0830,42.6620],[18.0590,42.6650],[18.0570,42.6430]]),
  },
  {
    city: "dubrovnik",
    names: ["babin kuk"],
    geometry: polygon([[18.0470,42.6540],[18.0660,42.6540],[18.0700,42.6690],[18.0500,42.6710],[18.0470,42.6540]]),
  },
  {
    city: "reykjavik",
    names: ["miðborg, centro 101", "miðborg, downtown 101", "miðborg, centre 101", "miðborg, centro 101"],
    geometry: polygon([[-21.9490,64.1360],[-21.9180,64.1360],[-21.9170,64.1515],[-21.9420,64.1540],[-21.9490,64.1360]]),
  },
  {
    city: "reykjavik",
    names: ["vesturbær"],
    geometry: polygon([[-21.9850,64.1370],[-21.9460,64.1370],[-21.9420,64.1585],[-21.9750,64.1640],[-21.9850,64.1370]]),
  },
  {
    city: "reykjavik",
    names: ["hlíðar"],
    geometry: polygon([[-21.9400,64.1230],[-21.9000,64.1230],[-21.9010,64.1400],[-21.9400,64.1400],[-21.9400,64.1230]]),
  },
  {
    city: "reykjavik",
    names: ["laugardalur"],
    geometry: polygon([[-21.9100,64.1290],[-21.8460,64.1290],[-21.8500,64.1580],[-21.9060,64.1590],[-21.9100,64.1290]]),
  },
  {
    city: "reykjavik",
    names: ["grandi e porto vecchio", "grandi and old harbour", "grandi et vieux-port", "grandi y puerto viejo"],
    geometry: polygon([[-21.9690,64.1500],[-21.9360,64.1500],[-21.9350,64.1625],[-21.9650,64.1660],[-21.9690,64.1500]]),
  },
  {
    city: "reykjavik",
    names: ["kópavogur"],
    geometry: polygon([[-21.9500,64.0800],[-21.8500,64.0800],[-21.8500,64.1300],[-21.9450,64.1300],[-21.9500,64.0800]]),
  },
  {
    city: "valletta",
    names: ["valletta", "la valette", "la valeta"],
    geometry: polygon([[14.5060,35.8930],[14.5195,35.8930],[14.5200,35.9030],[14.5070,35.9030],[14.5060,35.8930]]),
  },
  {
    city: "valletta",
    names: ["floriana"],
    geometry: polygon([[14.4940,35.8860],[14.5100,35.8860],[14.5100,35.8960],[14.4960,35.8970],[14.4940,35.8860]]),
  },
  {
    city: "valletta",
    names: ["sliema"],
    geometry: polygon([[14.4930,35.9040],[14.5150,35.9040],[14.5100,35.9200],[14.4930,35.9200],[14.4930,35.9040]]),
  },
  {
    city: "valletta",
    names: ["three cities", "trois cités", "tres ciudades"],
    geometry: polygon([[14.5110,35.8750],[14.5360,35.8750],[14.5350,35.8960],[14.5120,35.8970],[14.5110,35.8750]]),
  },
  {
    city: "valletta",
    names: ["st julian's", "saint julian's"],
    geometry: polygon([[14.4800,35.9120],[14.5000,35.9120],[14.4990,35.9320],[14.4780,35.9320],[14.4800,35.9120]]),
  },
  {
    city: "valletta",
    names: ["mdina e rabat", "mdina and rabat", "mdina et rabat", "mdina y rabat"],
    geometry: polygon([[14.3890,35.8720],[14.4140,35.8720],[14.4140,35.8940],[14.3900,35.8940],[14.3890,35.8720]]),
  },
  {
    city: "amburgo",
    names: ["rathaus / altstadt", "hamburg old town", "ayuntamiento / casco antiguo"],
    geometry: polygon([[9.9840,53.5450],[10.0060,53.5450],[10.0080,53.5580],[9.9870,53.5590],[9.9840,53.5450]]),
  },
  {
    city: "amburgo",
    names: ["st. pauli / reeperbahn"],
    geometry: polygon([[9.9480,53.5460],[9.9760,53.5460],[9.9770,53.5590],[9.9510,53.5600],[9.9480,53.5460]]),
  },
  {
    city: "amburgo",
    names: ["schanzenviertel"],
    geometry: polygon([[9.9550,53.5560],[9.9770,53.5560],[9.9780,53.5710],[9.9560,53.5710],[9.9550,53.5560]]),
  },
  {
    city: "amburgo",
    names: ["eppendorf / winterhude"],
    geometry: polygon([[9.9730,53.5750],[10.0220,53.5750],[10.0230,53.6040],[9.9740,53.6040],[9.9730,53.5750]]),
  },
  {
    city: "annecy",
    names: ["vieille ville", "old town", "casco antiguo"],
    geometry: polygon([[6.1220,45.8940],[6.1330,45.8940],[6.1340,45.9030],[6.1230,45.9040],[6.1220,45.8940]]),
  },
  {
    city: "annecy",
    names: ["impérial / albigny", "imperial / albigny"],
    geometry: polygon([[6.1370,45.9010],[6.1560,45.9010],[6.1580,45.9160],[6.1390,45.9170],[6.1370,45.9010]]),
  },
  {
    city: "annecy",
    names: ["bonlieu / centre", "bonlieu / town centre", "bonlieu / centro"],
    geometry: polygon([[6.1200,45.9000],[6.1350,45.9000],[6.1350,45.9080],[6.1210,45.9080],[6.1200,45.9000]]),
  },
  {
    city: "annecy",
    names: ["annecy-le-vieux"],
    geometry: polygon([[6.1340,45.9120],[6.1720,45.9120],[6.1730,45.9370],[6.1360,45.9380],[6.1340,45.9120]]),
  },
  {
    city: "colonia",
    names: ["dom / altstadt", "cathedral / old town", "cathédrale / vieille ville", "catedral / casco antiguo"],
    geometry: polygon([[6.9480,50.9330],[6.9700,50.9330],[6.9710,50.9460],[6.9490,50.9470],[6.9480,50.9330]]),
  },
  {
    city: "colonia",
    names: ["belgisches viertel", "belgian quarter", "quartier belge", "barrio belga"],
    geometry: polygon([[6.9270,50.9320],[6.9490,50.9320],[6.9500,50.9470],[6.9280,50.9470],[6.9270,50.9320]]),
  },
  {
    city: "colonia",
    names: ["ehrenfeld"],
    geometry: polygon([[6.8930,50.9430],[6.9300,50.9430],[6.9310,50.9690],[6.8950,50.9690],[6.8930,50.9430]]),
  },
  {
    city: "colonia",
    names: ["deutz / rheinpark"],
    geometry: polygon([[6.9690,50.9280],[7.0040,50.9280],[7.0050,50.9570],[6.9700,50.9570],[6.9690,50.9280]]),
  },
  {
    city: "lione",
    names: ["vieux lyon", "old lyon", "viejo lyon"],
    geometry: polygon([[4.8160,45.7530],[4.8330,45.7530],[4.8340,45.7720],[4.8170,45.7720],[4.8160,45.7530]]),
  },
  {
    city: "lione",
    names: ["presqu’île", "presquile"],
    geometry: polygon([[4.8260,45.7460],[4.8430,45.7460],[4.8440,45.7780],[4.8270,45.7780],[4.8260,45.7460]]),
  },
  {
    city: "lione",
    names: ["croix-rousse"],
    geometry: polygon([[4.8200,45.7680],[4.8420,45.7680],[4.8430,45.7870],[4.8210,45.7870],[4.8200,45.7680]]),
  },
  {
    city: "lione",
    names: ["brotteaux / les halles"],
    geometry: polygon([[4.8410,45.7550],[4.8720,45.7550],[4.8730,45.7760],[4.8420,45.7760],[4.8410,45.7550]]),
  },
  {
    city: "salisburgo",
    names: ["getreidegasse / altstadt", "getreidegasse / old town", "getreidegasse / vieille ville", "getreidegasse / casco antiguo"],
    geometry: polygon([[13.0330,47.7930],[13.0520,47.7930],[13.0530,47.8050],[13.0340,47.8050],[13.0330,47.7930]]),
  },
  {
    city: "salisburgo",
    names: ["mirabell / neustadt", "mirabell / new town", "mirabell / ciudad nueva"],
    geometry: polygon([[13.0350,47.8010],[13.0560,47.8010],[13.0570,47.8180],[13.0360,47.8180],[13.0350,47.8010]]),
  },
  {
    city: "salisburgo",
    names: ["nonntal / leopoldskron"],
    geometry: polygon([[13.0330,47.7780],[13.0560,47.7780],[13.0570,47.7980],[13.0340,47.7980],[13.0330,47.7780]]),
  },
  {
    city: "salisburgo",
    names: ["steingasse / kapuzinerberg"],
    geometry: polygon([[13.0450,47.7970],[13.0700,47.7970],[13.0710,47.8130],[13.0460,47.8130],[13.0450,47.7970]]),
  },
  {
    city: "tallinn",
    names: ["vanalinn / raekoja", "old town / town hall square", "vanalinn / place de l’hôtel de ville", "vanalinn / plaza del ayuntamiento"],
    geometry: polygon([[24.7340,59.4310],[24.7590,59.4310],[24.7600,59.4440],[24.7350,59.4440],[24.7340,59.4310]]),
  },
  {
    city: "tallinn",
    names: ["kalamaja / telliskivi"],
    geometry: polygon([[24.7140,59.4370],[24.7480,59.4370],[24.7490,59.4620],[24.7150,59.4620],[24.7140,59.4370]]),
  },
  {
    city: "tallinn",
    names: ["kadriorg"],
    geometry: polygon([[24.7740,59.4280],[24.8160,59.4280],[24.8170,59.4500],[24.7750,59.4500],[24.7740,59.4280]]),
  },
  {
    city: "tallinn",
    names: ["kesklinn / rotermann"],
    geometry: polygon([[24.7470,59.4280],[24.7750,59.4280],[24.7760,59.4440],[24.7480,59.4440],[24.7470,59.4280]]),
  },
  {
    city: "bruxelles",
    names: ["grand-place e centro", "grand-place and centre", "grand-place et centre", "grand-place y centro"],
    geometry: polygon([[4.3400,50.8380],[4.3650,50.8380],[4.3650,50.8580],[4.3400,50.8580],[4.3400,50.8380]]),
  },
  {
    city: "bruxelles",
    names: ["sablon"],
    geometry: polygon([[4.3450,50.8320],[4.3640,50.8320],[4.3640,50.8460],[4.3450,50.8460],[4.3450,50.8320]]),
  },
  {
    city: "bruxelles",
    names: ["marolles"],
    geometry: polygon([[4.3300,50.8240],[4.3540,50.8240],[4.3540,50.8420],[4.3300,50.8420],[4.3300,50.8240]]),
  },
  {
    city: "bruxelles",
    names: ["quartiere europeo", "european quarter", "quartier européen", "barrio europeo"],
    geometry: polygon([[4.3650,50.8270],[4.4050,50.8270],[4.4050,50.8520],[4.3650,50.8520],[4.3650,50.8270]]),
  },
  {
    city: "bruxelles",
    names: ["ixelles e flagey", "ixelles and flagey", "ixelles et flagey", "ixelles y flagey"],
    geometry: polygon([[4.3540,50.8120],[4.3930,50.8120],[4.3930,50.8390],[4.3540,50.8390],[4.3540,50.8120]]),
  },
  {
    city: "bruxelles",
    names: ["saint-gilles"],
    geometry: polygon([[4.3240,50.8120],[4.3600,50.8120],[4.3600,50.8370],[4.3240,50.8370],[4.3240,50.8120]]),
  },
  {
    city: "zurigo",
    names: ["altstadt", "old town", "vieille ville", "casco antiguo"],
    geometry: polygon([[8.5320,47.3630],[8.5530,47.3630],[8.5530,47.3820],[8.5320,47.3820],[8.5320,47.3630]]),
  },
  {
    city: "zurigo",
    names: ["enge"],
    geometry: polygon([[8.5190,47.3450],[8.5450,47.3450],[8.5450,47.3690],[8.5190,47.3690],[8.5190,47.3450]]),
  },
  {
    city: "zurigo",
    names: ["zürich-west", "zurich-west"],
    geometry: polygon([[8.5000,47.3780],[8.5300,47.3780],[8.5300,47.3980],[8.5000,47.3980],[8.5000,47.3780]]),
  },
  {
    city: "zurigo",
    names: ["wiedikon"],
    geometry: polygon([[8.4950,47.3550],[8.5280,47.3550],[8.5280,47.3830],[8.4950,47.3830],[8.4950,47.3550]]),
  },
  {
    city: "zurigo",
    names: ["oerlikon"],
    geometry: polygon([[8.5100,47.3970],[8.5600,47.3970],[8.5600,47.4290],[8.5100,47.4290],[8.5100,47.3970]]),
  },
  {
    city: "zurigo",
    names: ["seefeld"],
    geometry: polygon([[8.5400,47.3450],[8.5700,47.3450],[8.5700,47.3700],[8.5400,47.3700],[8.5400,47.3450]]),
  },
  {
    city: "lubiana",
    names: ["centro storico", "old town", "vieille ville", "casco antiguo"],
    geometry: polygon([[14.4980,46.0400],[14.5180,46.0400],[14.5180,46.0590],[14.4980,46.0590],[14.4980,46.0400]]),
  },
  {
    city: "lubiana",
    names: ["tabor e metelkova", "tabor and metelkova", "tabor et metelkova", "tabor y metelkova"],
    geometry: polygon([[14.5050,46.0490],[14.5250,46.0490],[14.5250,46.0670],[14.5050,46.0670],[14.5050,46.0490]]),
  },
  {
    city: "lubiana",
    names: ["trnovo e krakovo", "trnovo and krakovo", "trnovo et krakovo", "trnovo y krakovo"],
    geometry: polygon([[14.4920,46.0310],[14.5160,46.0310],[14.5160,46.0490],[14.4920,46.0490],[14.4920,46.0310]]),
  },
  {
    city: "lubiana",
    names: ["šiška"],
    geometry: polygon([[14.4660,46.0540],[14.5000,46.0540],[14.5000,46.0820],[14.4660,46.0820],[14.4660,46.0540]]),
  },
  {
    city: "lubiana",
    names: ["tivoli e rožna dolina", "tivoli and rožna dolina", "tivoli et rožna dolina", "tivoli y rožna dolina"],
    geometry: polygon([[14.4700,46.0440],[14.5020,46.0440],[14.5020,46.0660],[14.4700,46.0660],[14.4700,46.0440]]),
  },
  {
    city: "lubiana",
    names: ["bežigrad"],
    geometry: polygon([[14.5000,46.0580],[14.5350,46.0580],[14.5350,46.0910],[14.5000,46.0910],[14.5000,46.0580]]),
  },
];
