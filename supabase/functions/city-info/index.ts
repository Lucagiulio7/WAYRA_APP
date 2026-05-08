import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const city = (url.searchParams.get("city") ?? "roma").toLowerCase().trim();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch solo category_level per tutte le attrazioni non-food della città
    const { data, error } = await supabase
      .from("attractions")
      .select("category_level")
      .eq("city", city)
      .eq("is_food_spot", false);

    if (error) throw new Error(error.message);

    const total = data.length;
    const l1Count = data.filter((a) => a.category_level === 1).length;

    const max_days_iconico = l1Count > 0 ? 5 : 1;
    const max_days_esploratore = total > 0 ? 7 : 1;

    return new Response(
      JSON.stringify({ city, attraction_count: total, max_days_iconico, max_days_esploratore }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
