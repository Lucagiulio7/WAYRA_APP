import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { buildItinerary, Attraction } from "../_shared/itinerary-builder.ts";

interface RequestBody {
  city: string;
  num_days: number;
  level: number | number[];
  max_walk_km?: number;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Validazione input ────────────────────────────────────────────────────
    const body: RequestBody = await req.json();
    const city = (body.city ?? "roma").toLowerCase().trim();
    const num_days: number = body.num_days;
    const level: number | number[] = body.level;
    const maxWalkKm = Number.isFinite(body.max_walk_km)
      ? Math.min(8, Math.max(2, Number(body.max_walk_km)))
      : 4;

    if (!num_days || num_days < 1 || num_days > 7) {
      return new Response(
        JSON.stringify({ error: "num_days deve essere tra 1 e 7" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validLevels = new Set([1, 2, 3]);
    const levels = Array.isArray(level) ? level : [level];
    if (!levels.every((l) => validLevels.has(l))) {
      return new Response(
        JSON.stringify({ error: "level deve essere 1, 2 o 3 (o lista di questi)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Supabase client ──────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Fetch attrazioni dalla città ─────────────────────────────────────────
    const { data: allAttractions, error: attError } = await supabase
      .from("attractions")
      .select("*")
      .eq("city", city)
      .order("id");

    if (attError) throw new Error(attError.message);
    if (!allAttractions || allAttractions.length === 0) {
      return new Response(
        JSON.stringify({ error: `Nessuna attrazione trovata per '${city}'` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const attractions: Attraction[] = allAttractions
      .filter((a) => !a.is_food_spot)
      .map((a) => ({ ...a, tags: a.tags ?? [] }));

    const foodSpots: Attraction[] = allAttractions
      .filter((a) => a.is_food_spot)
      .map((a) => ({ ...a, tags: a.tags ?? [] }));

    // ── Fetch piatti tradizionali ────────────────────────────────────────────
    const { data: foods, error: foodError } = await supabase
      .from("foods")
      .select("*")
      .eq("city", city)
      .order("id")
      .limit(6);

    if (foodError) throw new Error(foodError.message);

    // ── Fetch culture facts ──────────────────────────────────────────────────
    const { data: cultureFacts, error: cultureError } = await supabase
      .from("culture_facts")
      .select("icon, title, title_en, body, body_en")
      .eq("city", city)
      .order("sort_order");

    if (cultureError) throw new Error(cultureError.message);

    // ── Genera itinerario ────────────────────────────────────────────────────
    const days = buildItinerary(attractions, foodSpots, num_days, level, maxWalkKm);

    if (days.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nessuna attrazione trovata per il livello selezionato" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Risposta ─────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          city,
          num_days,
          level,
          max_walk_km: maxWalkKm,
          days,
          food_recommendations: (foods ?? []).map((f) => ({
            ...f,
            ingredients: f.ingredients ?? [],
          })),
          culture_facts: cultureFacts ?? [],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
