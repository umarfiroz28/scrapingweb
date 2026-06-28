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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { lead_id } = await req.json();

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", lead_id).single();
  if (error || !lead) {
    return new Response(JSON.stringify({ error: "Lead not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const submittedAt = new Date(lead.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const telegramText = `🚨 NEW LEAD RECEIVED

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Product: ${lead.product_type}
Quantity: ${lead.quantity ?? ""}
Age: ${lead.product_age ?? ""}

Submitted At: ${submittedAt}`;

  const emailBody = `New Lead Received

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Product: ${lead.product_type}
Quantity: ${lead.quantity ?? ""}
Age: ${lead.product_age ?? ""}

Submitted At: ${submittedAt}`;

  const [telegram_status, email_status] = await Promise.all([
    sendTelegram(telegramText),
    sendEmail(`New Lead - ${lead.product_type} - ${lead.city}`, emailBody),
  ]);

  await supabase.from("leads").update({ telegram_status, email_status }).eq("id", lead.id);

  return new Response(JSON.stringify({ telegram_status, email_status }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function sendEmail(subject: string, text: string) {
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const to = Deno.env.get("NOTIFICATION_EMAIL");
    if (!resendKey || !to) return "not_configured";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cash For Old AC & Battery <leads@resend.dev>",
        to,
        subject,
        text,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
