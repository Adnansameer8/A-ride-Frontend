import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Bike,
  Shield,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Users,
  Star,
  FileText,
  ChevronRight,
} from "lucide-react";

/*
  Palette from screenshot:
  --cream:   #f5ede6
  --surface: #fdf8f4
  --brand:   #e85d04
  --ink:     #3b2a1a
  --muted:   #8c7060
  --line:    #e8d9ce
  --warn-bg: #fef9ec
  --warn-br: #f5d97a
  --info-bg: #eef5fb
  --info-br: #b8d4ec
  --crit-bg: #fdf0ee
  --crit-br: #f4c4ba
*/

const S = {
  root: {
    minHeight: "100vh",
    background: "#f5ede6",
      fontFamily: '"Times New Roman", Times, serif',
    color: "#3b2a1a",
  },

  /* ── HEADER ── */
  header: {
    background: "#fdf8f4",
    borderBottom: "2px solid #e85d04",
    padding: "0 48px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 16px rgba(232,93,4,0.08)",
  },
  logoText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    letterSpacing: "3px",
    color: "#e85d04",
  },
  headerLabel: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    color: "#8c7060",
  },

  /* ── HERO ── */
  hero: {
    background: "linear-gradient(135deg, #fdf8f4 0%, #f5ede6 60%, #f0e0d2 100%)",
    borderBottom: "1px solid #e8d9ce",
    padding: "72px 48px 64px",
    position: "relative",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    right: "-40px",
    top: "-20px",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "280px",
    color: "rgba(232,93,4,0.05)",
    lineHeight: 1,
    pointerEvents: "none",
    userSelect: "none",
  },
  heroInner: { maxWidth: "820px", position: "relative", zIndex: 1 },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(232,93,4,0.1)",
    border: "1.5px solid rgba(232,93,4,0.25)",
    borderRadius: "999px",
    padding: "6px 18px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#e85d04",
    marginBottom: "24px",
  },
  heroTitle: {
      fontFamily: '"Times New Roman", Times, serif',
    fontSize: "clamp(3rem, 6vw, 5.5rem)",
    lineHeight: 0.95,
    color: "#3b2a1a",
    letterSpacing: "2px",
    marginBottom: "20px",
  },
  heroTitleSpan: { color: "#e85d04" },
  heroDesc: {
    fontSize: "15px",
    color: "#6b5040",
    lineHeight: "1.75",
    maxWidth: "540px",
    marginBottom: "32px",
  },
  metaRow: { display: "flex", gap: "32px", flexWrap: "wrap" },
  metaItem: { display: "flex", flexDirection: "column", gap: "2px" },
  metaLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "#8c7060",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#3b2a1a",
  },

  /* ── LAYOUT ── */
  layout: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "56px 40px 100px",
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "48px",
    alignItems: "start",
  },

  /* ── TOC ── */
  toc: {
    position: "sticky",
    top: "88px",
    background: "#fdf8f4",
    borderRadius: "16px",
    padding: "24px",
    border: "1.5px solid #e8d9ce",
    boxShadow: "0 4px 20px rgba(59,42,26,0.06)",
  },
  tocTitle: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#8c7060",
    marginBottom: "14px",
  },
  tocLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 10px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#6b5040",
    textDecoration: "none",
    transition: "all 0.18s",
    cursor: "pointer",
    border: "none",
    background: "none",
    width: "100%",
    textAlign: "left",
    marginBottom: "2px",
  },
  tocDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#e8d9ce",
    flexShrink: 0,
  },
  tocDivider: {
    height: "1px",
    background: "#e8d9ce",
    margin: "10px 0",
  },

  /* ── CONTENT ── */
  content: { minWidth: 0 },

  introBanner: {
    background: "#fdf8f4",
    borderRadius: "18px",
    padding: "28px 32px",
    borderLeft: "4px solid #e85d04",
    boxShadow: "0 4px 20px rgba(59,42,26,0.06)",
    marginBottom: "48px",
    border: "1.5px solid #e8d9ce",
    borderLeftWidth: "4px",
    borderLeftColor: "#e85d04",
  },
  introText: {
    fontSize: "14px",
    color: "#6b5040",
    lineHeight: "1.8",
  },

  /* ── SECTION ── */
  section: {
    marginBottom: "52px",
    scrollMarginTop: "100px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1.5px solid #e8d9ce",
  },
  sectionIcon: (orange) => ({
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: orange ? "#e85d04" : "#3b2a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  }),
  sectionNum: {
      fontFamily: '"Times New Roman", Times, serif',
    fontSize: "12px",
    letterSpacing: "2px",
    color: "#e85d04",
    display: "block",
    marginBottom: "2px",
  },
  sectionTitle: {
      fontFamily: '"Times New Roman", Times, serif',
    fontSize: "28px",
    letterSpacing: "1.5px",
    color: "#3b2a1a",
    lineHeight: 1,
  },

  /* ── CLAUSE CARDS ── */
  clause: (variant) => {
    const base = {
      borderRadius: "14px",
      padding: "22px 26px",
      marginBottom: "12px",
      border: "1.5px solid",
      transition: "border-color 0.2s",
    };
    if (variant === "warn") return { ...base, background: "#fef9ec", borderColor: "#f5d97a" };
    if (variant === "info") return { ...base, background: "#eef5fb", borderColor: "#b8d4ec" };
    if (variant === "critical") return { ...base, background: "#fdf0ee", borderColor: "#f4c4ba", borderLeftWidth: "4px", borderLeftColor: "#e85d04" };
    return { ...base, background: "#fdf8f4", borderColor: "#e8d9ce" };
  },
  clauseLabel: (variant) => {
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "10px",
      fontWeight: "800",
      letterSpacing: "2px",
      textTransform: "uppercase",
      marginBottom: "8px",
    };
    if (variant === "warn")     return { ...base, color: "#b45309" };
    if (variant === "info")     return { ...base, color: "#0369a1" };
    if (variant === "critical") return { ...base, color: "#c2410c" };
    return { ...base, color: "#e85d04" };
  },
  clauseH4: (variant) => {
    const base = { fontSize: "15px", fontWeight: "700", marginBottom: "8px", lineHeight: "1.3" };
    if (variant === "warn")     return { ...base, color: "#78350f" };
    if (variant === "info")     return { ...base, color: "#0c4a6e" };
    if (variant === "critical") return { ...base, color: "#7c2d12" };
    return { ...base, color: "#3b2a1a" };
  },
  clauseP: (variant) => {
    const base = { fontSize: "14px", lineHeight: "1.75", margin: 0 };
    if (variant === "warn")     return { ...base, color: "#92400e" };
    if (variant === "info")     return { ...base, color: "#075985" };
    if (variant === "critical") return { ...base, color: "#9a3412" };
    return { ...base, color: "#6b5040" };
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  subTag: (dark) => ({
    display: "inline-flex",
    alignItems: "center",
      fontFamily: '"Times New Roman", Times, serif',
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "9px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "14px",
    background: dark ? "rgba(59,42,26,0.08)" : "rgba(232,93,4,0.1)",
    color: dark ? "#3b2a1a" : "#e85d04",
    border: dark ? "1px solid #e8d9ce" : "1px solid rgba(232,93,4,0.2)",
  }),

  /* ── ACCEPTANCE ── */
  acceptance: {
    background: "linear-gradient(135deg, #fdf8f4 0%, #f5ede6 100%)",
    border: "2px solid #e8d9ce",
    borderRadius: "20px",
    padding: "44px",
    textAlign: "center",
    marginTop: "56px",
  },
  acceptTitle: {
      fontFamily: '"Times New Roman", Times, serif',
    fontSize: "32px",
    color: "#3b2a1a",
    letterSpacing: "2px",
    marginBottom: "12px",
  },
  acceptTitleSpan: { color: "#e85d04" },
  acceptDesc: {
    fontSize: "14px",
    color: "#8c7060",
    maxWidth: "500px",
    margin: "0 auto 28px",
    lineHeight: "1.7",
      fontFamily: '"Times New Roman", Times, serif',
  },
  pillsRow: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" },
  pill: (active) => ({
    background: active ? "#e85d04" : "#fdf8f4",
    border: active ? "1.5px solid #e85d04" : "1.5px solid #e8d9ce",
    borderRadius: "999px",
    padding: "8px 18px",
    fontSize: "12px",
    fontWeight: "700",
    color: active ? "#fff" : "#8c7060",
  }),

  /* ── FOOTER ── */
  footer: {
    background: "#fdf8f4",
    borderTop: "1px solid #e8d9ce",
    padding: "28px 48px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "12px",
    color: "#8c7060",
    lineHeight: "1.8",
  },
  footerStrong: { color: "#e85d04", fontWeight: "700" },
};

/* ── Reusable Clause ── */
const Clause = ({ icon: Icon, label, title, body, variant = "default" }) => (
  <div style={S.clause(variant)}>
    <div style={S.clauseLabel(variant)}>
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <h4 style={S.clauseH4(variant)}>{title}</h4>
    <p style={S.clauseP(variant)}>{body}</p>
  </div>
);

/* ── TOC Link ── */
const TocItem = ({ href, children }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a
      href={href}
      style={{
        ...S.tocLink,
        background: hovered ? "rgba(232,93,4,0.08)" : "none",
        color: hovered ? "#e85d04" : "#6b5040",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ ...S.tocDot, background: hovered ? "#e85d04" : "#e8d9ce" }} />
      {children}
    </a>
  );
};

export default function Terms() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 900px) {
          .terms-layout { grid-template-columns: 1fr !important; }
          .terms-toc { display: none !important; }
          .terms-hero { padding: 48px 24px 40px !important; }
          .terms-header { padding: 0 24px !important; }
          .terms-two-col { grid-template-columns: 1fr !important; }
          .terms-acceptance { padding: 32px 24px !important; }
          .terms-inner { padding: 40px 24px 80px !important; }
        }
      `}</style>

      <div style={S.root}>

        {/* ── HEADER ── */}
        {/* <header className="terms-header" style={S.header}>
          <span style={S.logoText}>A-RIDE</span>
          <span style={S.headerLabel}>Terms &amp; Conditions</span>
        </header> */}

        {/* ── HERO ── */}
        <div className="terms-hero" style={S.hero}>
          <span style={S.heroBg} aria-hidden>T&amp;C</span>
          <div style={S.heroInner}>
            <div style={S.eyebrow}>
              <FileText size={12} />
              Legal Document
            </div>
            <h1 style={S.heroTitle}>
              TERMS &amp; <span style={S.heroTitleSpan}>CONDITIONS</span>
            </h1>
            <p style={S.heroDesc}>
              By using A-RIDE's services or booking any trip through our platform, you agree to be bound by the following terms. Please read them carefully before proceeding.
            </p>
            <div style={S.metaRow}>
              {[
                { label: "Effective Date", value: "April 21, 2026" },
                { label: "Jurisdiction",   value: "India" },
                { label: "Platform",       value: "A-RIDE (aride.in)" },
                { label: "Support",        value: "24 × 7 Available" },
              ].map((m) => (
                <div key={m.label} style={S.metaItem}>
                  <span style={S.metaLabel}>{m.label}</span>
                  <span style={S.metaValue}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="terms-layout terms-inner" style={{ ...S.layout }}>

          {/* TOC */}
          <nav className="terms-toc" style={S.toc}>
            <div style={S.tocTitle}>Contents</div>
            <TocItem href="#general">General Terms</TocItem>
            <TocItem href="#services">Emergency Services</TocItem>
            <TocItem href="#trips">Trip Bookings</TocItem>
            <TocItem href="#liability">Liability &amp; Safety</TocItem>
            <div style={S.tocDivider} />
            <TocItem href="#contact">Contact &amp; Support</TocItem>
          </nav>

          {/* MAIN */}
          <main style={S.content}>

            {/* Intro */}
            <div style={S.introBanner}>
              <p style={S.introText}>
                Welcome to <strong style={{ color: "#3b2a1a" }}>A-RIDE</strong> — your on-demand motorcycle services and adventure trip platform. These Terms &amp; Conditions are structured in two parts:{" "}
                <strong style={{ color: "#3b2a1a" }}>Emergency Roadside Services</strong> and{" "}
                <strong style={{ color: "#3b2a1a" }}>Trip Bookings (Long Trip / Off-Roading)</strong>.
              </p>
              <p style={{ ...S.introText, marginTop: "12px" }}>
                Accessing, using, or booking through A-RIDE constitutes your full acceptance of these terms. A-RIDE reserves the right to update these terms at any time with reasonable notice.
              </p>
            </div>

            {/* ── SECTION 1: GENERAL ── */}
            <section id="general" style={S.section}>
              <div style={S.sectionHeader}>
                <div style={S.sectionIcon(false)}><FileText size={22} /></div>
                <div>
                  <span style={S.sectionNum}>Section 01</span>
                  <h2 style={S.sectionTitle}>General Terms of Use</h2>
                </div>
              </div>
              <div className="terms-two-col" style={S.twoCol}>
                <Clause
                  icon={Shield} label="Account"
                  title="Registered Phone & Account Required"
                  body="You must use the registered mobile number and A-RIDE account associated with your profile when placing any booking. Services cannot be booked on behalf of third parties without prior approval."
                />
                <Clause
                  icon={MapPin} label="Location Accuracy"
                  title="Accurate Location is Mandatory"
                  body="You are responsible for providing an accurate and accessible location when requesting any service or joining a trip. A-RIDE is not liable for delays caused by incorrect location data."
                />
                <Clause
                  icon={CreditCard} label="Payments"
                  title="Payment Obligations"
                  body="All charges displayed at booking are binding. Payments must be completed via the selected mode (Cash or Online). Disputes must be raised within 24 hours of service completion."
                />
                <Clause
                  icon={CheckCircle} label="Eligibility"
                  title="Age & Licence Requirement"
                  body="You must be at least 18 years of age and hold a valid motor vehicle licence to use A-RIDE services or participate in any trip. A-RIDE reserves the right to refuse service if eligibility cannot be verified."
                />
              </div>
            </section>

            {/* ── SECTION 2: SERVICES ── */}
            <section id="services" style={S.section}>
              <div style={S.sectionHeader}>
                <div style={S.sectionIcon(true)}><Wrench size={22} /></div>
                <div>
                  <span style={S.sectionNum}>Section 02</span>
                  <h2 style={S.sectionTitle}>Emergency Roadside Services</h2>
                </div>
              </div>

              <Clause
                icon={Phone} label="Device Requirement"
                title="Registered Smartphone Must Be in Your Possession"
                body="When booking an emergency service (fuel delivery, towing, mechanic on-spot, battery assistance, or spare parts), the smartphone registered to your A-RIDE account must be physically in your possession at the time of booking and service delivery. Bookings made from a different device may be subject to verification before dispatch is authorised."
              />
              <Clause
                icon={XCircle} label="Cancellation Policy" variant="critical"
                title="Services Cannot Be Cancelled Once Dispatched"
                body="Once a service request is confirmed and our technician has been dispatched to your location, the booking cannot be cancelled through the application. To cancel, contact our support team immediately via the in-app Support section or our 24/7 helpline. Cancellation remains at the sole discretion of A-RIDE based on the technician's proximity to your location."
              />
              <Clause
                icon={AlertTriangle} label="Minimum Charge on Cancellation" variant="warn"
                title="Rs. 300 Minimum Fee Applies After Technician Arrival"
                body="If our service technician has already reached your location at the time of cancellation, a minimum cancellation fee of Rs. 300 is applicable and must be paid immediately — regardless of whether the service was rendered. This fee covers mobilisation costs, fuel, and the technician's travel time. No exceptions will be made to this policy."
              />
              <Clause
                icon={MapPin} label="Service Radius"
                title="Service Availability Within Operational Range"
                body="Emergency services are available within our defined service radius from the A-RIDE hub. Locations beyond the serviceable range will be flagged in-app prior to booking confirmation. Distance-based charges apply at Rs. 5 per kilometre, calculated from the hub to your location via the fastest available route."
              />
              <Clause
                icon={Clock} label="24/7 Support" variant="info"
                title="Round-the-Clock Customer Support"
                body="Our support team operates 24 hours a day, 7 days a week, including all public holidays. All cancellation requests, disputes, or service escalations must be routed through A-RIDE's official support channels — in-app chat, email at support@aride.in, or the helpline number listed in your booking confirmation."
              />
            </section>

            {/* ── SECTION 3: TRIPS ── */}
            <section id="trips" style={S.section}>
              <div style={S.sectionHeader}>
                <div style={S.sectionIcon(true)}><Bike size={22} /></div>
                <div>
                  <span style={S.sectionNum}>Section 03</span>
                  <h2 style={S.sectionTitle}>Trip Bookings — Long Trip &amp; Off-Roading</h2>
                </div>
              </div>

              <div style={S.subTag(false)}>
                <Bike size={13} /> Plan A — Own Bike (Without Bike Package)
              </div>

              <Clause
                icon={Bike} label="Own Bike Riders"
                title="Participants Must Ride Their Own Motorcycle"
                body='If you have booked under the "Without Bike" package, you are required to bring your own motorcycle for the duration of the ride. A-RIDE does not provide a vehicle under this plan. Your motorcycle must be in roadworthy condition at the start of the trip, and you are solely responsible for its maintenance and performance throughout the journey.'
              />
              <Clause
                icon={Wrench} label="Mechanical Breakdown" variant="warn"
                title="On-Spot Mechanic Support for Minor Issues Only"
                body="In the event of a mechanical breakdown during the ride, A-RIDE will provide on-the-spot mechanic support for minor issues only (e.g., punctures, minor electrical faults, chain adjustments). Support is rendered at the breakdown location and within the team's vicinity only. A-RIDE does not provide vehicle recovery, towing, or workshop-level repairs for privately owned motorcycles during trips. Major mechanical failures are the sole responsibility of the participant."
              />

              <div style={{ ...S.subTag(true), marginTop: "24px" }}>
                <Bike size={13} /> Plan B — A-RIDE Bike (With Bike Package)
              </div>

              <Clause
                icon={Star} label="A-RIDE Provided Motorcycle"
                title="Motorcycle Allocation & Confirmation"
                body='Under the "With Bike" package, A-RIDE will provide a motorcycle for your use throughout the trip. The specific bike model will be confirmed by our support team prior to departure based on availability, route requirements, and your preference. Bike allocation is subject to availability and may be subject to change. Preference changes must be communicated at least 48 hours before the trip start date.'
              />
              <Clause
                icon={Shield} label="Rider Responsibility"
                title="Care & Conduct with A-RIDE Motorcycles"
                body="Participants using an A-RIDE provided motorcycle are responsible for the vehicle during the trip. Any damage caused due to negligence or reckless riding will be assessed and the cost of repairs will be borne by the participant. Normal wear and tear is covered by A-RIDE."
              />

              <div style={{ ...S.subTag(false), marginTop: "24px" }}>
                <Users size={13} /> Applicable to Both Plans
              </div>

              <Clause
                icon={AlertTriangle} label="Accidents & Injuries" variant="critical"
                title="First Aid Provided On-Site — A-RIDE Not Liable for Major Injuries"
                body="In the event of an accident or injury during the trip, A-RIDE personnel will provide immediate first aid at the location. However, A-RIDE and its team members are not responsible for serious or major injuries, hospitalisation costs, medical bills, disability, or any other consequence arising from accidents during the ride. Participants are strongly advised to obtain personal accident insurance prior to joining any trip. By booking, you acknowledge and voluntarily accept these risks."
              />
              <Clause
                icon={Users} label="Rider Replacement" variant="warn"
                title="Ride Continues — Substitute Rider Arrangement"
                body="If a participant is temporarily unable to ride due to a minor injury or fatigue, A-RIDE will make reasonable efforts to arrange support from within the group so the team can continue the journey. The team schedule will not be held indefinitely for a single participant. In case of serious injury requiring medical attention, the team leader will take appropriate action and the trip will proceed for remaining participants."
              />
              <Clause
                icon={Shield} label="Team Leader Authority"
                title="Team Leader's Decision is Final"
                body="All trip-related decisions — including route changes, rest stop timings, pace of the ride, weather-based halts, and safety calls — are made by the designated A-RIDE Team Leader. Participants are required to follow the team leader's instructions at all times. The facilities and support mentioned in these terms are extended only to participants who remain compliant with team leader decisions and group protocols. Non-compliance may result in withdrawal of A-RIDE support and removal from the trip without refund."
              />
              <Clause
                icon={CreditCard} label="Booking & Cancellation" variant="info"
                title="Trip Booking Cancellation Policy"
                body="Trip cancellations made more than 7 days before the departure date are eligible for a refund (minus a 10% processing fee). Cancellations within 7 days of departure are non-refundable. No-shows on the day of departure will be treated as a full forfeiture of the booking amount. Rescheduling requests must be submitted via the Support section at least 5 days in advance."
              />
            </section>

            {/* ── SECTION 4: LIABILITY ── */}
            <section id="liability" style={S.section}>
              <div style={S.sectionHeader}>
                <div style={S.sectionIcon(false)}><Shield size={22} /></div>
                <div>
                  <span style={S.sectionNum}>Section 04</span>
                  <h2 style={S.sectionTitle}>Liability &amp; Safety Disclaimer</h2>
                </div>
              </div>
              <Clause
                icon={XCircle} label="Limitation of Liability" variant="critical"
                title="A-RIDE's Liability is Limited"
                body="A-RIDE's total liability to any participant shall not exceed the amount paid for the specific booking in question. A-RIDE is not liable for indirect, consequential, or incidental damages including loss of income, psychological distress, loss of personal property, or third-party claims arising from the use of our services or participation in our trips."
              />
              <Clause
                icon={AlertTriangle} label="Force Majeure" variant="warn"
                title="No Liability for Events Beyond Our Control"
                body="A-RIDE shall not be held liable for failure to deliver services or trips due to events beyond reasonable control including natural disasters, extreme weather, government restrictions, road closures, landslides, civil unrest, or any other force majeure event. In such cases, A-RIDE will make best efforts to reschedule or provide a partial refund at its discretion."
              />
              <Clause
                icon={CheckCircle} label="Participant Agreement"
                title="By Booking, You Accept Full Risk Acknowledgement"
                body="Motorcycling — whether on highways or off-road terrain — inherently involves physical risk. By completing a booking on A-RIDE, you confirm that you understand and voluntarily accept these risks, that you are physically and medically fit to participate, and that you will not hold A-RIDE, its employees, partners, or team leaders liable for injuries, accidents, or losses sustained during a trip or service engagement."
              />
            </section>

            {/* ── SECTION 5: CONTACT ── */}
            <section id="contact" style={S.section}>
              <div style={S.sectionHeader}>
                <div style={S.sectionIcon(true)}><Phone size={22} /></div>
                <div>
                  <span style={S.sectionNum}>Section 05</span>
                  <h2 style={S.sectionTitle}>Support &amp; Contact</h2>
                </div>
              </div>
              <Clause
                icon={Clock} label="24/7 Support Channels" variant="info"
                title="We're Always Here for You"
                body="For any queries, cancellation requests, emergency escalations, or booking disputes, please reach out through any of the following official channels: In-App Support Chat (available under the Support section in the A-RIDE application), Email at support@aride.in (response within 2 hours during peak hours), or the Helpline number provided in your booking confirmation. Our support team operates 24 hours a day, 7 days a week, including all public holidays."
              />
            </section>

            {/* ── ACCEPTANCE ── */}
            <div className="terms-acceptance" style={S.acceptance}>
              <h3 style={S.acceptTitle}>
                YOUR RIDE, <span style={S.acceptTitleSpan}>YOUR RESPONSIBILITY</span>
              </h3>
              <p style={S.acceptDesc}>
                By booking any service or trip through A-RIDE, you confirm that you have read, understood, and agreed to all terms stated above. These terms protect both you and our team.
              </p>
              <div style={S.pillsRow}>
                {[
                  { label: "Services Terms",     active: true },
                  { label: "Trip Terms",          active: true },
                  { label: "Safety Disclaimer",   active: true },
                  { label: "Effective: Apr 2026", active: false },
                ].map((p) => (
                  <div key={p.label} style={S.pill(p.active)}>{p.active ? "✓ " : ""}{p.label}</div>
                ))}
              </div>
            </div>

          </main>
        </div>

        {/* ── FOOTER ── */}
        <footer style={S.footer}>
          <p style={S.footerText}>
            &copy; 2026 <span style={S.footerStrong}>A-RIDE</span>. All rights reserved.
            &nbsp;|&nbsp; Last updated: <span style={S.footerStrong}>April 21, 2026</span>
            &nbsp;|&nbsp; Legal queries: <span style={S.footerStrong}>legal@aride.in</span>
            &nbsp;|&nbsp; Governed by the laws of India.
          </p>
        </footer>

      </div>
    </>
  );
}