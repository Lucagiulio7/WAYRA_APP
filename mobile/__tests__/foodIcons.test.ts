import {
  curatedFoodIcon,
  curatedFoodIconCities,
  curatedFoodIconCount,
  curatedFoodIconsForCity,
} from "@/data/foodIcons";

describe("curated food icons", () => {
  it("covers all eight dishes in every current city", () => {
    const cities = curatedFoodIconCities();
    expect(cities).toHaveLength(48);
    expect(curatedFoodIconCount()).toBe(384);

    cities.forEach((city) => {
      expect(curatedFoodIconsForCity(city)).toHaveLength(8);
    });
  });

  it("uses a varied icon set inside each city", () => {
    curatedFoodIconCities().forEach((city) => {
      const icons = curatedFoodIconsForCity(city).map(([, icon]) => icon);
      expect(new Set(icons).size).toBe(8);
    });
  });

  it("resolves canonical dishes independently of the selected language", () => {
    expect(curatedFoodIcon("parigi", "Croissant au Beurre")).toBe("🥐");
    expect(curatedFoodIcon("milano", "Campari Soda")).toBe("🍹");
    expect(curatedFoodIcon("dublino", "Soda Bread")).toBe("🍞");
    expect(curatedFoodIcon("istanbul", "Baklava")).toBe("🍯");
  });
});
