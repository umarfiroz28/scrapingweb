const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const { lead_id, lead } = JSON.parse(event.body || "{}");
    return await notifyLead(lead_id, lead, process.env);
  } catch (error) {
    console.error(error);
    return json(500, { error: "Notification failed" });
  }
};

async function notifyLead(leadId, lead, env) {
  if (!leadId || !lead?.name || !lead?.phone) {
    return json(400, { error: "Missing lead details" });
  }

  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const message = buildMessage(lead, submittedAt);

  const [telegram_status, email_status] = await Promise.all([
    sendTelegram(message, env),
    sendEmail(`New Scrap Pickup Lead - ${lead.product_type} - ${lead.city}`, message, env),
  ]);

  await updateLeadStatus(leadId, { telegram_status, email_status }, env);

  return json(200, { telegram_status, email_status });
}

function buildMessage(lead, submittedAt) {
  return `NEW SCRAP PICKUP LEAD

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Scrap Type: ${lead.product_type}
Quantity / Approx Weight: ${lead.quantity || ""}
Condition / Notes: ${lead.product_age || ""}
Image: ${lead.image_url || ""}

Submitted At: ${submittedAt}`;
}

async function sendTelegram(text, env) {
  try {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;
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

async function sendEmail(subject, text, env) {
  try {
    const resendKey = env.RESEND_API_KEY;
    const to = env.NOTIFICATION_EMAIL;
    const from = env.NOTIFICATION_EMAIL_FROM || "ScrappingWallah <onboarding@resend.dev>";
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

async function updateLeadStatus(leadId, statuses, env) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  const response = await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(statuses),
  });

  if (!response.ok) {
    console.error("Lead status update failed", response.status, await response.text());
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
