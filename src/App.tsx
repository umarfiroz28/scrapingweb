import {
  BatteryCharging,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Fan,
  HelpCircle,
  ImagePlus,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { initTracking, trackLead } from "./lib/tracking";

const phonePrimary = "7310886906";
const phoneWhatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "918802227860";
const whatsappLink = `https://wa.me/${phoneWhatsapp}?text=${encodeURIComponent(
  "Hi, I want to sell my old AC or battery. Please share the best price.",
)}`;

const products = [
  { title: "Split AC", desc: "Indoor and outdoor units picked up from home.", icon: Fan },
  { title: "Window AC", desc: "Quick quote for working or non-working units.", icon: Zap },
  { title: "Inverter Battery", desc: "Fair price based on brand, age, and condition.", icon: BatteryCharging },
  { title: "Car Battery", desc: "Doorstep collection for used vehicle batteries.", icon: Car },
  { title: "UPS Battery", desc: "Bulk and single UPS batteries accepted.", icon: CreditCard },
];

const cities = ["Delhi", "Noida", "Ghaziabad", "Meerut", "Gurgaon", "Faridabad"];

const testimonials = [
  {
    name: "Rohit Sharma",
    city: "Noida",
    text: "Quick pickup and instant payment. The quote was clear on the call and the team arrived the same day.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
  },
  {
    name: "Pooja Arora",
    city: "Delhi",
    text: "Got a better price than local scrap dealers for my old split AC. Very professional service.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
  },
  {
    name: "Amit Verma",
    city: "Ghaziabad",
    text: "Professional and trustworthy service. Pickup was free and payment came immediately.",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
  },
];

type LeadForm = {
  name: string;
  phone: string;
  city: string;
  product_type: string;
  quantity: string;
  product_age: string;
  image: File | null;
};

type FormErrors = Partial<Record<keyof LeadForm, string>>;

const initialForm: LeadForm = {
  name: "",
  phone: "",
  city: "",
  product_type: "Split AC",
  quantity: "1",
  product_age: "",
  image: null,
};

function validateLead(form: LeadForm) {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(form.phone.trim())) errors.phone = "Enter a valid 10 digit mobile number.";
  if (!form.city) errors.city = "Please choose your city.";
  if (!form.product_type) errors.product_type = "Please choose what you want to sell.";
  return errors;
}

function App() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showMore, setShowMore] = useState(false);

  const canSubmit = useMemo(() => status !== "loading", [status]);

  useEffect(() => {
    initTracking();
  }, []);

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLead(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("loading");
    try {
      let image_url = "";
      if (form.image && supabase) {
        const safeName = `${Date.now()}-${form.image.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("lead-images").upload(safeName, form.image);
        if (!uploadError) {
          const { data } = supabase.storage.from("lead-images").getPublicUrl(safeName);
          image_url = data.publicUrl;
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from("leads")
          .insert({
            name: form.name.trim(),
            phone: form.phone.trim(),
            city: form.city,
            product_type: form.product_type,
            quantity: Number(form.quantity || 1),
            product_age: form.product_age || null,
            image_url,
          })
          .select("id")
          .single();

        if (error) throw error;
        await supabase.functions.invoke("notify-lead", { body: { lead_id: data.id } });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      trackLead(form.product_type, form.city);
      setForm(initialForm);
      setShowMore(false);
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#" className="flex items-center gap-2 font-black tracking-tight text-ink">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-ocean to-mint text-white shadow-mint">
              <Zap size={22} />
            </span>
            <span className="leading-tight">
              Cash For Old
              <span className="block text-ocean">AC & Battery</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <a className="icon-btn hidden sm:inline-flex" href={`tel:${phonePrimary}`} aria-label="Call">
              <Phone size={18} />
            </a>
            <a className="btn-primary px-4 py-2 text-sm" href="#quote">
              Get Quote
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-8 md:grid-cols-[1fr_.88fr] md:items-center md:pt-14">
          <div className="animate-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <Sparkles size={16} /> Best market rates in Delhi NCR
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-normal text-ink sm:text-5xl md:text-6xl">
              Sell Your Old AC & Battery at the Best Price
            </h1>
            <p className="mt-5 text-xl font-bold text-slate-600">Free Pickup • Instant Quote • Same-Day Payment</p>
            <div className="mt-7 grid gap-3 sm:flex">
              <a className="btn-primary text-base" href="#quote">
                Get Free Quote <ChevronRight size={20} />
              </a>
              <a className="btn-whatsapp text-base" href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle size={20} /> WhatsApp Us
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
              {["500+ Successful Pickups", "Best Market Rates", "Instant Payment"].map((item) => (
                <span key={item} className="pill">
                  <CheckCircle2 size={16} /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[430px] animate-float">
            <div className="absolute inset-x-5 bottom-4 h-48 rounded-[2rem] bg-gradient-to-r from-ocean via-cyan-400 to-mint opacity-20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white bg-white/70 p-5 shadow-glow backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <VisualCard icon={Fan} label="Old AC" tone="blue" />
                  <VisualCard icon={BatteryCharging} label="Battery" tone="green" />
                  <div className="col-span-2 rounded-3xl bg-white p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-500">Pickup today</p>
                        <p className="text-2xl font-black text-ink">Cash on hand</p>
                      </div>
                      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-sun text-ink shadow-lg">
                        <Wallet size={42} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-4 rounded-3xl bg-ink p-4 text-white shadow-lg">
                    <Truck className="text-mint" size={52} />
                    <div>
                      <p className="text-sm font-bold text-slate-300">Free doorstep pickup</p>
                      <p className="text-xl font-black">Delhi • Noida • Gurgaon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status === "success" && <ThankYou />}

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { value: "500+", label: "Successful Pickups", Icon: Truck },
          { value: "Top", label: "Market Rates", Icon: Sparkles },
          { value: "Same Day", label: "Pickup", Icon: Clock3 },
          { value: "Instant", label: "Payment", Icon: Wallet },
          { value: "Trusted", label: "Local Service", Icon: ShieldCheck },
        ].map(({ value, label, Icon }) => (
          <div className="stat-card" key={`${value}-${label}`}>
            <Icon size={26} className="text-ocean" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section id="quote" className="bg-gradient-to-b from-white to-sky-50 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[.8fr_1fr] lg:items-start">
          <div>
            <p className="section-kicker">Fast lead form</p>
            <h2 className="section-title">Tell us 4 things. We call with the best price.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Fill fewer details now. Our team confirms the condition, pickup slot, and final quote on call.
            </p>
            <div className="mt-6 grid gap-3">
              <a className="contact-strip" href={`tel:${phonePrimary}`}>
                <Phone size={21} /> Call {phonePrimary}
              </a>
              <a className="contact-strip" href="tel:8802227860">
                <Phone size={21} /> Call 8802227860
              </a>
              <a className="contact-strip bg-emerald-50 text-emerald-800" href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle size={21} /> WhatsApp 8802227860
              </a>
            </div>
          </div>

          <form className="form-card" onSubmit={submitLead} noValidate>
            {!hasSupabaseConfig && (
              <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                Demo mode: add Supabase environment variables to save real leads.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </Field>
              <Field label="Mobile Number" error={errors.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10 digit number"
                  inputMode="numeric"
                />
              </Field>
              <Field label="City" error={errors.city}>
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  <option value="">Choose city</option>
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </Field>
              <Field label="Product Type" error={errors.product_type}>
                <select value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })}>
                  {products.map((product) => (
                    <option key={product.title}>{product.title}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button className="mt-4 text-sm font-black text-ocean" type="button" onClick={() => setShowMore(!showMore)}>
              {showMore ? "Hide optional details" : "Add optional details"}
            </button>

            {showMore && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Quantity">
                  <input
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Product Age">
                  <input value={form.product_age} onChange={(e) => setForm({ ...form, product_age: e.target.value })} placeholder="2 years" />
                </Field>
                <label className="upload-field">
                  <ImagePlus size={20} />
                  <span>{form.image ? form.image.name : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
                </label>
              </div>
            )}

            {status === "error" && <p className="mt-4 rounded-2xl bg-red-50 p-3 font-semibold text-red-700">Something went wrong. Please call or WhatsApp us and we will help right away.</p>}

            <button disabled={!canSubmit} className="btn-primary mt-6 w-full justify-center text-lg" type="submit">
              {status === "loading" ? "Sending..." : "Get Best Price"} <Send size={20} />
            </button>
          </form>
        </div>
      </section>

      <Section title="How It Works" kicker="Simple process">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Submit Your Details", "Share name, phone, city, and product."],
            ["Receive Call From Our Team", "We confirm condition and expected rate."],
            ["Free Inspection", "Our pickup team checks the item at your place."],
            ["Instant Payment & Pickup", "Get paid immediately after final approval."],
          ].map(([title, desc], index) => (
            <div className="step-card" key={title}>
              <span>{index + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Products We Buy" kicker="Old ACs and batteries">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {products.map((product) => (
            <article className="product-card" key={product.title}>
              <product.icon size={34} />
              <h3>{product.title}</h3>
              <p>{product.desc}</p>
              <a href="#quote">Get quote</a>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Happy Customers" kicker="Realistic reviews">
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <img src={item.photo} alt={item.name} loading="lazy" />
              <p>"{item.text}"</p>
              <strong>{item.name}</strong>
              <span>{item.city}</span>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Service Areas" kicker="Free pickup locations">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {cities.map((city) => (
            <a className="city-card" href="#quote" key={city}>
              <MapPin size={22} /> {city}
            </a>
          ))}
        </div>
      </Section>

      <Section title="Questions People Ask" kicker="FAQ">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["How much can I get for my old AC?", "The final price depends on AC type, brand, tonnage, age, copper condition, and current market rate."],
            ["Do you provide free pickup?", "Yes, pickup is free in Delhi, Noida, Ghaziabad, Meerut, Gurgaon, and Faridabad."],
            ["How quickly do I get paid?", "Payment is made immediately after inspection and price approval."],
            ["What battery types do you purchase?", "We buy inverter batteries, car batteries, UPS batteries, and similar used batteries."],
            ["Is inspection free?", "Yes, inspection is free. There is no hidden visit charge."],
          ].map(([q, a]) => (
            <details className="faq-card" key={q}>
              <summary>
                <HelpCircle size={20} /> {q}
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <footer className="bg-ink px-4 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Cash For Old AC & Battery</h2>
            <p className="mt-2 text-slate-300">Free pickup. Instant quote. Same-day payment.</p>
          </div>
          <div className="grid gap-2 font-bold">
            <a href={`tel:${phonePrimary}`}>Call: {phonePrimary}</a>
            <a href="tel:8802227860">Call: 8802227860</a>
          </div>
        </div>
      </footer>

      <a className="floating-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer" aria-label="Open WhatsApp">
        <MessageCircle size={28} />
      </a>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="section-kicker">{kicker}</p>
      <h2 className="section-title mb-7">{title}</h2>
      {children}
    </section>
  );
}

function VisualCard({ icon: Icon, label, tone }: { icon: typeof Fan; label: string; tone: "blue" | "green" }) {
  return (
    <div className={`rounded-3xl p-5 shadow-lg ${tone === "blue" ? "bg-ocean text-white" : "bg-mint text-ink"}`}>
      <Icon size={58} />
      <p className="mt-8 text-2xl font-black">{label}</p>
      <span className="text-sm font-bold opacity-80">Best price</span>
    </div>
  );
}

function ThankYou() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="rounded-[1.5rem] bg-gradient-to-r from-ocean to-mint p-5 text-white shadow-mint">
        <h2 className="text-2xl font-black">Thank You! Your Request Has Been Received</h2>
        <p className="mt-2 font-semibold">Our team will contact you shortly with the best available price.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-full bg-white px-5 py-3 font-black text-ocean" href={`tel:${phonePrimary}`}>Call Now</a>
          <a className="rounded-full bg-ink px-5 py-3 font-black text-white" href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

export default App;
