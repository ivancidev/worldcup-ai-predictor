import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { predictionId } = body;

    if (!predictionId) {
      return Response.json({ error: "predictionId is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("shared_predictions")
      .select("slug")
      .eq("prediction_id", predictionId)
      .single();

    if (existing) {
      return Response.json({ slug: existing.slug });
    }

    const slug = generateSlug();
    const { data, error } = await supabase
      .from("shared_predictions")
      .insert({ prediction_id: predictionId, slug })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ slug: data.slug });
  } catch (error) {
    console.error("Share API error:", error);
    return Response.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return Response.json({ error: "slug is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shared_predictions")
      .select(`
        *,
        prediction:predictions(
          *,
          user:users(username)
        )
      `)
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return Response.json({ error: "Prediction not found" }, { status: 404 });
    }

    return Response.json({ data });
  } catch (error) {
    console.error("Share GET error:", error);
    return Response.json({ error: "Failed to fetch prediction" }, { status: 500 });
  }
}
