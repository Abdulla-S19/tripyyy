import { travelStyleOf } from "@/lib/trip-options";
import type { TripFormValues } from "@/lib/trip-schema";
import { BUDGET_CATEGORIES, dayLabel, dayTotal, durationLabel, KIND_LABEL, money, moodLabels, transportLabel, type RouteStop } from "@/lib/trip-view";
import type { Itinerary } from "@/types/itinerary";

/** Static, print-only A4 document. The interactive trip view is hidden when printing. */
export function PrintItinerary({ trip, itinerary: it, stops }: { trip: TripFormValues; itinerary: Itinerary; stops: RouteStop[] }) {
  const cur = trip.currency;
  const travellers = trip.adults + trip.children;
  const moods = moodLabels(trip);
  const transport = transportLabel(trip);
  const b = it.budget;
  const route = (stops.length ? stops.map((s) => s.name) : [trip.origin, trip.destination]).join(" → ");
  const first = it.days[0];
  const last = it.days[it.days.length - 1];

  return (
    <article className="print-doc hidden print:block">
      <header className="pd-header">
        <p className="pd-brand">TRIPYYY · Trip itinerary</p>
        <h1>{it.title}</h1>
        <p className="pd-summary">{it.summary}</p>
      </header>

      <table className="pd-facts">
        <tbody>
          <tr>
            <th>Route</th>
            <td>
              {route}
              {(trip.sideTrips?.length ?? 0) > 0 && <span className="pd-muted"> · day trips: {trip.sideTrips.join(", ")}</span>}
            </td>
            <th>Dates</th>
            <td>
              {dayLabel(first.date)} – {dayLabel(last.date)} ({it.days.length} days)
              {trip.tripType === "round" && trip.returnBy ? `, home by ${trip.returnBy}` : ""}
            </td>
          </tr>
          <tr>
            <th>Travellers</th>
            <td>
              {trip.adults} adult{trip.adults === 1 ? "" : "s"}
              {trip.children ? `, ${trip.children} child${trip.children === 1 ? "" : "ren"}` : ""}
            </td>
            <th>Transport</th>
            <td>{transport}</td>
          </tr>
          <tr>
            <th>Style &amp; moods</th>
            <td>
              {travelStyleOf(trip.travelStyle).label} · {moods.join(", ")}
            </td>
            <th>Cost per person</th>
            <td>
              <strong>{money(b.totalPerPerson, cur)}</strong> of {money(trip.budget, cur)} budget · group {money(b.totalPerPerson * travellers, cur)}
            </td>
          </tr>
        </tbody>
      </table>

      <section className="pd-block">
        <h2>Budget per person</h2>
        <table className="pd-table pd-budget">
          <tbody>
            {BUDGET_CATEGORIES.filter((c) => b[c.key] > 0).map((c) => (
              <tr key={c.key}>
                <td>{c.label}</td>
                <td className="pd-num">{money(b[c.key], cur)}</td>
                <td className="pd-num pd-muted">{Math.round((b[c.key] / b.totalPerPerson) * 100)}%</td>
              </tr>
            ))}
            <tr className="pd-total">
              <td>Total</td>
              <td className="pd-num">{money(b.totalPerPerson, cur)}</td>
              <td />
            </tr>
          </tbody>
        </table>
        {b.note && <p className="pd-note">{b.note}</p>}
      </section>

      {it.days.map((d) => (
        <section key={d.day} className="pd-day">
          <div className="pd-day-head">
            <h2>
              Day {d.day} · {d.title}
            </h2>
            <p>
              {dayLabel(d.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · night in {d.city} · {money(dayTotal(d), cur)} per person
            </p>
          </div>
          <table className="pd-table">
            <thead>
              <tr>
                <th className="pd-time">Time</th>
                <th>Plan</th>
                <th className="pd-num">Cost</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((item, i) => (
                <tr key={i}>
                  <td className="pd-time">
                    {item.time}
                    {item.endTime && <span className="pd-muted">–{item.endTime}</span>}
                  </td>
                  <td>
                    <p className="pd-item-title">
                      <span className="pd-kind">{KIND_LABEL[item.kind]}</span> {item.title}
                      {item.endTime && <span className="pd-muted"> · {durationLabel(item.time, item.endTime)}</span>}
                    </p>
                    {item.kind === "transport" && (item.from || item.to) && (
                      <p className="pd-muted">
                        {[item.operator, item.from && item.to ? `${item.from} → ${item.to}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {item.detail && <p>{item.detail}</p>}
                    {item.location && item.kind !== "transport" && <p className="pd-muted">{item.location}</p>}
                    {item.bookingTip && <p className="pd-tip">Tip: {item.bookingTip}</p>}
                    {item.alternatives.length > 0 && <p className="pd-muted">Alternatives: {item.alternatives.join(", ")}</p>}
                  </td>
                  <td className="pd-num">{money(item.costPerPerson, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {(it.tips.length > 0 || it.packing.length > 0) && (
        <section className="pd-block pd-columns">
          {it.tips.length > 0 && (
            <div>
              <h2>Good to know</h2>
              <ul>
                {it.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {it.packing.length > 0 && (
            <div>
              <h2>Packing list</h2>
              <ul className="pd-checklist">
                {it.packing.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <footer className="pd-footer">AI-generated plan from TRIPYYY. Check timings, availability and prices with operators before booking.</footer>
    </article>
  );
}
