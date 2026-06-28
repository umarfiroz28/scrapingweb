import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase service credentials are not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { lead_id } = await req.json();

    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (error || !lead) {
      return json({ error: "Lead not found" }, 404);
    }

    const submittedAt = new Date(lead.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const message = `NEW SCRAP PICKUP LEAD

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Scrap Type: ${lead.product_type}
Quantity / Approx Weight: ${lead.quantity ?? ""}
Condition / Notes: ${lead.product_age ?? ""}
Image: ${lead.image_url ?? ""}

Submitted At: ${submittedAt}`;

    const [telegram_status, email_status] = await Promise.all([
      sendTelegram(message),
      sendEmail(`New Scrap Pickup Lead - ${lead.product_type} - ${lead.city}`, message),
    ]);

    await supabase.from("leads").update({ telegram_status, email_status }).eq("id", lead.id);

    return json({ telegram_status, email_status });
  } catch (error) {
    console.error(error);
    return json({ error: "Notification failed" }, 500);
  }
});

async function sendTelegram(text: string) {
  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!token || !chatId) return "not_configured";

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      console.error("Telegram failed", response.status, await response.text());
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error("Telegram error", error);
    return "failed";
  }
}

async function sendEmail(subject: string, text: string) {
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const to = Deno.env.get("NOTIFICATION_EMAIL");
    const from = Deno.env.get("NOTIFICATION_EMAIL_FROM") || "ScrappingWallah <onboarding@resend.dev>";
    if (!resendKey || !to) return "not_configured";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });

    if (!response.ok) {
      console.error("Email failed", response.status, await response.text());
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error("Email error", error);
    return "failed";
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
