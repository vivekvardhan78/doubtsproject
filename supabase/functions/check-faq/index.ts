import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: faqs, error: faqError } = await supabase
      .from("faqs")
      .select("*");

    if (faqError) {
      console.error("FAQ fetch error:", faqError);
      return new Response(
        JSON.stringify({ matched: false, faq: null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let bestMatch = null;
    let bestSimilarity = 0;

    for (const faq of faqs || []) {
      const similarity = calculateSimilarity(question, faq.question);
      if (similarity > bestSimilarity && similarity > 0.7) {
        bestSimilarity = similarity;
        bestMatch = faq;
      }
    }

    if (bestMatch) {
      await supabase.from("doubt_similarity_log").insert({
        doubt_question: question,
        matched_faq_id: bestMatch.id,
      });

      await supabase
        .from("faqs")
        .update({ ask_count: bestMatch.ask_count + 1 })
        .eq("id", bestMatch.id);

      return new Response(
        JSON.stringify({
          matched: true,
          faq: bestMatch,
          similarity: bestSimilarity,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: logs, error: logsError } = await supabase
      .from("doubt_similarity_log")
      .select("doubt_question")
      .ilike("doubt_question", `%${question}%`);

    if (!logsError && logs && logs.length >= 2) {
      const { data: newFaq } = await supabase
        .from("faqs")
        .insert({
          question: question,
          answer: "This question is frequently asked. A teacher will provide a detailed answer soon.",
          ask_count: 3,
        })
        .select()
        .single();

      if (newFaq) {
        return new Response(
          JSON.stringify({
            matched: true,
            faq: newFaq,
            newFaq: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    await supabase.from("doubt_similarity_log").insert({
      doubt_question: question,
      matched_faq_id: null,
    });

    return new Response(
      JSON.stringify({ matched: false, faq: null }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});