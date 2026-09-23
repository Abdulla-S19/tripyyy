import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { travelStyleOf } from "@/lib/trip-options";
import type { TripFormValues } from "@/lib/trip-schema";
import { BUDGET_CATEGORIES, dayLabel, dayTotal, durationLabel, KIND_LABEL, kindColor, money, moodLabels, routeStops, transportLabel } from "@/lib/trip-view";
import type { Itinerary } from "@/types/itinerary";

// Rendered in the browser (share / download) and on the server (email attachment).
// Fonts are real TTFs from public/fonts/pdf: the built-in PDF fonts have no ₹ or →.

const FONT_FILES = {
  Inter: [
    { file: "Inter-400.ttf", fontWeight: 400 },
    { file: "Inter-600.ttf", fontWeight: 600 },
    { file: "Inter-700.ttf", fontWeight: 700 },
  ],
  Playfair: [
    { file: "PlayfairDisplay-400.ttf", fontWeight: 400 },
    { file: "PlayfairDisplay-400i.ttf", fontWeight: 400, fontStyle: "italic" },
    { file: "PlayfairDisplay-600.ttf", fontWeight: 600 },
  ],
} as const;

let registered = false;

/** `base` is a URL prefix in the browser ("/fonts/pdf/") or a folder path on the server. */
export function registerPdfFonts(base: string) {
  if (registered) return;
  for (const [family, fonts] of Object.entries(FONT_FILES)) {
    Font.register({ family, fonts: fonts.map(({ file, ...rest }) => ({ src: base + file, ...rest })) });
  }
  // Keep words whole: automatic hyphenation splits place names badly.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const C = {
  ink: "#161b26",
  body: "#3a4150",
  muted: "#6b7282",
  line: "#e6e1d6",
  paper: "#fbf9f4",
  gold: "#9c6a14",
  goldSoft: "#dfaf55",
  band: "#0b111c",
  sand: "#f5f1e8",
};

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: C.body, paddingTop: 34, paddingBottom: 48, paddingHorizontal: 36, lineHeight: 1.4 },
  band: { backgroundColor: C.band, borderRadius: 14, padding: 22, marginBottom: 16 },
  brand: { fontFamily: "Playfair", fontWeight: 600, fontSize: 13, letterSpacing: 2.5, color: C.sand },
  kicker: { fontSize: 7, letterSpacing: 1.6, textTransform: "uppercase", color: C.goldSoft, marginTop: 14 },
  title: { fontFamily: "Playfair", fontSize: 24, color: C.sand, marginTop: 4, lineHeight: 1.15 },
  summary: { fontSize: 9.5, color: "#b9bfcb", marginTop: 8, lineHeight: 1.5 },
  route: { fontSize: 9, color: C.goldSoft, marginTop: 10 },
  facts: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: C.line, borderRadius: 10, marginBottom: 16 },
  fact: { width: "33.333%", paddingVertical: 8, paddingHorizontal: 10 },
  factLabel: { fontSize: 6.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted },
  factValue: { fontSize: 9, color: C.ink, marginTop: 2 },
  h2: { fontFamily: "Playfair", fontSize: 14, color: C.ink, marginBottom: 8 },
  bar: { flexDirection: "row", height: 9, marginBottom: 8 },
  legend: { flexDirection: "row", flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", width: "33.333%", marginBottom: 4 },
  swatch: { width: 7, height: 7, borderRadius: 2, marginRight: 5 },
  note: { fontSize: 8.5, color: C.muted, marginTop: 4, fontStyle: "normal" },
  dayHead: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 6, marginTop: 14, marginBottom: 4 },
  dayNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.gold, color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 5, marginRight: 9 },
  dayTitle: { fontFamily: "Playfair", fontSize: 13, color: C.ink, lineHeight: 1.3 },
  dayMeta: { fontSize: 8, color: C.muted, marginTop: 3 },
  item: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: C.line },
  time: { width: 54, fontSize: 8.5, fontWeight: 600, color: C.ink },
  timeEnd: { fontSize: 7.5, fontWeight: 400, color: C.muted },
  dotCol: { width: 12, paddingTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  itemBody: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 9.5, fontWeight: 600, color: C.ink },
  kind: { fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase", color: C.muted },
  muted: { color: C.muted, fontSize: 8.5 },
  tip: { color: C.gold, fontSize: 8.5, marginTop: 1 },
  cost: { width: 54, textAlign: "right", fontSize: 9, color: C.ink },
  columns: { flexDirection: "row", marginTop: 18 },
  column: { flex: 1, paddingRight: 14 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  box: { width: 7, height: 7, borderWidth: 0.8, borderColor: C.muted, borderRadius: 1.5, marginTop: 2, marginRight: 6 },
  linkBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 10, marginBottom: 16 },
  link: { color: C.gold, fontSize: 9, textDecoration: "none" },
  disclaimer: { marginTop: 18, fontSize: 7.5, color: C.muted },
  footer: { position: "absolute", bottom: 20, left: 36, fontSize: 7, color: C.muted },
});

export function TripPdf({ trip, itinerary: it, link }: { trip: TripFormValues; itinerary: Itinerary; link?: string }) {
  const cur = trip.currency;
  const travellers = trip.adults + trip.children;
  const stops = routeStops(trip, it);
  const route = (stops.length ? stops.map((x) => x.name) : [trip.origin, trip.destination]).join("  →  ");
  const b = it.budget;
  const first = it.days[0];
  const last = it.days[it.days.length - 1];
  const parts = BUDGET_CATEGORIES.filter((c) => b[c.key] > 0);
  const partsTotal = parts.reduce((n, c) => n + b[c.key], 0) || 1;
  const moods = moodLabels(trip);

  const facts = [
    ["Dates", `${dayLabel(first.date)} – ${dayLabel(last.date)} · ${it.days.length} day${it.days.length === 1 ? "" : "s"}`],
    ["Travellers", `${trip.adults} adult${trip.adults === 1 ? "" : "s"}${trip.children ? `, ${trip.children} child${trip.children === 1 ? "" : "ren"}` : ""}`],
    ["Transport", transportLabel(trip)],
    ["Style", travelStyleOf(trip.travelStyle).label + (moods.length ? ` · ${moods.join(", ")}` : "")],
    ["Per person", `${money(b.totalPerPerson, cur)} of ${money(trip.budget, cur)} budget`],
    ["Whole group", money(b.totalPerPerson * travellers, cur)],
  ];

  return (
    <Document title={it.title} author="TRIPYYY" subject={`${trip.origin} to ${trip.destination}`} creator="TRIPYYY">
      <Page size="A4" style={s.page}>
        {/* Repeated on every page. Declared first: placed after the flowing content, it didn't render. */}
        <Text style={s.footer} fixed>
          TRIPYYY · {it.title}
        </Text>
        <View style={s.band}>
          <Text style={s.brand}>
            TRIPY<Text style={{ color: C.goldSoft }}>YY</Text>
          </Text>
          <Text style={s.kicker}>Trip itinerary</Text>
          <Text style={s.title}>{it.title}</Text>
          {!!it.summary && <Text style={s.summary}>{it.summary}</Text>}
          <Text style={s.route}>
            {route}
            {trip.sideTrips?.length ? `   ·   day trips: ${trip.sideTrips.join(", ")}` : ""}
          </Text>
        </View>

        <View style={s.facts}>
          {facts.map(([label, value]) => (
            <View key={label} style={s.fact}>
              <Text style={s.factLabel}>{label}</Text>
              <Text style={s.factValue}>{value}</Text>
            </View>
          ))}
        </View>

        {link && (
          <View style={s.linkBox}>
            <Text style={[s.muted, { marginRight: 6 }]}>Live plan with map:</Text>
            <Link src={link} style={s.link}>
              {link}
            </Link>
          </View>
        )}

        <View wrap={false}>
          <Text style={s.h2}>Budget per person</Text>
          <View style={s.bar}>
            {parts.map((c, i) => (
              <View
                key={c.key}
                style={{
                  width: `${(b[c.key] / partsTotal) * 100}%`,
                  backgroundColor: c.color,
                  marginLeft: i ? 1.5 : 0,
                  borderTopLeftRadius: i === 0 ? 3 : 0,
                  borderBottomLeftRadius: i === 0 ? 3 : 0,
                  borderTopRightRadius: i === parts.length - 1 ? 3 : 0,
                  borderBottomRightRadius: i === parts.length - 1 ? 3 : 0,
                }}
              />
            ))}
          </View>
          <View style={s.legend}>
            {parts.map((c) => (
              <View key={c.key} style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: c.color }]} />
                <Text>
                  {c.label} <Text style={{ color: C.ink, fontWeight: 600 }}>{money(b[c.key], cur)}</Text>
                  <Text style={s.muted}> · {Math.round((b[c.key] / partsTotal) * 100)}%</Text>
                </Text>
              </View>
            ))}
          </View>
          {!!b.note && <Text style={s.note}>{b.note}</Text>}
        </View>

        {it.days.map((d) => (
          <View key={d.day}>
            <View style={s.dayHead} wrap={false} minPresenceAhead={60}>
              <Text style={s.dayNum}>{d.day}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.dayTitle}>{d.title}</Text>
                <Text style={s.dayMeta}>
                  {dayLabel(d.date, { weekday: "long", day: "numeric", month: "long" })} · night in {d.city} · {money(dayTotal(d), cur)} per person
                </Text>
              </View>
            </View>
            {d.items.map((item, i) => (
              <View key={i} style={s.item} wrap={false}>
                <Text style={s.time}>
                  {item.time}
                  {item.endTime ? <Text style={s.timeEnd}>{`\n–${item.endTime}`}</Text> : null}
                </Text>
                <View style={s.dotCol}>
                  <View style={[s.dot, { backgroundColor: kindColor(item.kind) }]} />
                </View>
                <View style={s.itemBody}>
                  <Text style={s.kind}>
                    {KIND_LABEL[item.kind]}
                    {item.endTime ? ` · ${durationLabel(item.time, item.endTime)}` : ""}
                  </Text>
                  <Text style={s.itemTitle}>{item.title}</Text>
                  {item.kind === "transport" && (item.operator || (item.from && item.to)) && (
                    <Text style={s.muted}>{[item.operator, item.from && item.to ? `${item.from} → ${item.to}` : ""].filter(Boolean).join(" · ")}</Text>
                  )}
                  {!!item.detail && <Text>{item.detail}</Text>}
                  {!!item.location && item.kind !== "transport" && <Text style={s.muted}>{item.location}</Text>}
                  {!!item.bookingTip && <Text style={s.tip}>Tip: {item.bookingTip}</Text>}
                  {item.alternatives.length > 0 && <Text style={s.muted}>Or: {item.alternatives.join(", ")}</Text>}
                </View>
                <Text style={s.cost}>{money(item.costPerPerson, cur)}</Text>
              </View>
            ))}
          </View>
        ))}

        {(it.tips.length > 0 || it.packing.length > 0) && (
          <View style={s.columns} wrap={false}>
            {it.tips.length > 0 && (
              <View style={s.column}>
                <Text style={s.h2}>Good to know</Text>
                {it.tips.map((t) => (
                  <View key={t} style={s.bullet}>
                    <Text style={{ color: C.gold, marginRight: 5 }}>•</Text>
                    <Text style={{ flex: 1 }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
            {it.packing.length > 0 && (
              <View style={s.column}>
                <Text style={s.h2}>Packing list</Text>
                {it.packing.map((p) => (
                  <View key={p} style={s.bullet}>
                    <View style={s.box} />
                    <Text style={{ flex: 1 }}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={s.disclaimer}>AI-generated plan from TRIPYYY. Check timings, availability and prices with operators before booking.</Text>

      </Page>
    </Document>
  );
}
