export function initTracking() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID;

  if (gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", gaId);
  }

  if (metaPixelId) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    window.fbq = function fbq(...args: unknown[]) {
      window.fbqQueue = window.fbqQueue || [];
      window.fbqQueue.push(args);
    };
    window.fbq("init", metaPixelId);
    window.fbq("track", "PageView");
  }
}

export function trackLead(productType: string, city: string) {
  window.gtag?.("event", "generate_lead", {
    product_type: productType,
    city,
  });
  window.fbq?.("track", "Lead", {
    content_name: productType,
    city,
  });
}
