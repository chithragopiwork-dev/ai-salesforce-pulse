import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SALESFORCE_INSTANCE_URL = Deno.env.get("SALESFORCE_INSTANCE_URL");
    const SALESFORCE_ACCESS_TOKEN = Deno.env.get("SALESFORCE_ACCESS_TOKEN");

    if (!SALESFORCE_INSTANCE_URL || !SALESFORCE_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({
          error: "Salesforce credentials not configured",
          records: [],
          totalSize: 0,
          done: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { endpoint, params } = await req.json();

    const url = new URL(`${SALESFORCE_INSTANCE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value as string);
      });
    }

    const sfResponse = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${SALESFORCE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!sfResponse.ok) {
      const errorBody = await sfResponse.text();
      console.error(`Salesforce API error [${sfResponse.status}]: ${errorBody}`);
      return new Response(
        JSON.stringify({ error: `Salesforce API error: ${sfResponse.status}`, details: errorBody }),
        { status: sfResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await sfResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
