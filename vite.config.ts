import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

declare const process: {
  cwd(): string;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), localNetlifyFunctions(env)],
  };
});

function localNetlifyFunctions(env: Record<string, string>): Plugin {
  return {
    name: "local-netlify-functions",
    configureServer(server) {
      server.middlewares.use("/.netlify/functions/notify-lead", async (req: any, res: any) => {
        if (req.method === "OPTIONS") {
          sendJson(res, 200, { ok: true });
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const response = await notifyLead(String(body.lead_id || ""), body.lead as Record<string, string | number | null> | undefined, env);
          sendJson(res, response.statusCode, JSON.parse(String(response.body)));
        } catch (error) {
          console.error(error);
          sendJson(res, 500, { error: "Notification failed" });
        }
      });
    },
  };
}

async function notifyLead(leadId: string, lead: Record<string, string | number | null> | undefined, env: Record<string, string>) {
  if (!leadId || !lead?.name || !lead?.phone) {
    return responseJson(400, { error: "Missing lead details" });
  }

  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const message = `NEW SCRAP PICKUP LEAD

Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Scrap Type: ${lead.product_type}
Quantity / Approx Weight: ${lead.quantity || ""}
Condition / Notes: ${lead.product_age || ""}
Image: ${lead.image_url || ""}

Submitted At: ${submittedAt}`;

  const [telegram_status, email_status] = await Promise.all([
    sendTelegram(message, env),
    sendEmail(`New Scrap Pickup Lead - ${lead.product_type} - ${lead.city}`, message, env),
  ]);

  await updateLeadStatus(leadId, { telegram_status, email_status }, env);

  return responseJson(200, { telegram_status, email_status });
}

async function sendTelegram(text: string, env: Record<string, string>) {
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

async function sendEmail(subject: string, text: string, env: Record<string, string>) {
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

async function updateLeadStatus(leadId: string, statuses: Record<string, string>, env: Record<string, string>) {
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

function readJsonBody(req: any) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: unknown) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function responseJson(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}

function sendJson(res: any, statusCode: number, body: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader?.("Access-Control-Allow-Origin", "*");
  res.setHeader?.("Access-Control-Allow-Headers", "content-type");
  res.setHeader?.("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader?.("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
