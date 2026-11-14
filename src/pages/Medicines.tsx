import { useEffect, useState } from "react";
import { api, query, type Selection } from "../shared/api.ts";
import s from "../shared/Workbench.module.css";
export function Medicines({
  crewId,
  day,
  profile = "mars_transit",
}: Selection) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [expiry, setExpiry] = useState("");
  const [time, setTime] = useState("08:00");
  const [msg, setMsg] = useState("");
  const key = "halo-medications-" + crewId;
  async function load() {
    try {
      setItems(
        (await api("/medications?" + query({ crewId, day, profile }))).items,
      );
    } catch {
      setItems(JSON.parse(localStorage.getItem(key) ?? "[]"));
    }
  }
  useEffect(() => {
    load();
  }, [crewId, day]);
  async function add() {
    const m = {
      id: crypto.randomUUID(),
      crewId,
      name,
      scheduleReference: reference,
      scheduledTime: time,
      expiresAt: new Date(expiry + "T00:00:00Z").toISOString(),
      storageComplete: false,
      provenance: "demo_schedule",
    };
    try {
      await api("/medications", m);
      await load();
      setMsg("Demo schedule reference saved. No dose generated.");
    } catch {
      const rows = [...items, m];
      localStorage.setItem(key, JSON.stringify(rows));
      setItems(rows);
      setMsg("Saved on device; backend not available.");
    }
    setName("");
  }
  async function taken(m: any) {
    try {
      await api("/adherence", {
        crewId,
        medicationId: m.id,
        day,
        status: "taken",
      });
      await load();
    } catch {
      const rows = items.map((x) =>
        x.id === m.id
          ? {
              ...x,
              adherence: [...(x.adherence ?? []), { day, status: "taken" }],
            }
          : x,
      );
      localStorage.setItem(key, JSON.stringify(rows));
      setItems(rows);
    }
  }
  return (
    <>
      <h1 className={s.title}>Medicines</h1>
      <p className={s.intro}>
        Record a human-approved schedule reference and adherence. No prescribing
        or radiation-based strength estimate.
      </p>
      <div className={s.grid}>
        <section className={s.panel}>
          <h2>Add a demo schedule reference</h2>
          <label className={s.field}>
            Medication name
            <input
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className={s.field}>
            Approved schedule reference
            <input
              value={reference}
              maxLength={160}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
          <label className={s.field}>
            Scheduled time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className={s.field}>
            Labelled expiry
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </label>
          <button
            className={s.button}
            disabled={!name.trim() || !reference.trim() || !expiry}
            onClick={add}
          >
            Record schedule
          </button>
          <p role="status">{msg}</p>
        </section>
        <section className={s.panel}>
          <h2>Schedule and adherence</h2>
          {items.length === 0 && <p>No schedule entered for this astronaut.</p>}
          {items.map((m) => (
            <div className={s.result} key={m.id}>
              <b>{m.name}</b> · {m.scheduledTime}
              <p>Reference: {m.scheduleReference}</p>
              <p>
                Expiry: {m.expiresAt.slice(0, 10)} ·{" "}
                {Date.parse(m.expiresAt) < Date.now()
                  ? "Expired"
                  : "Within labelled expiry"}
              </p>
              <p>
                Storage: {m.storageComplete ? "recorded" : "incomplete"}.
                Potency: unknown; product-specific evidence required.
              </p>
              <p>
                Day {day}:{" "}
                {m.adherence?.find((a: any) => a.day === day)?.status ??
                  "not recorded"}
              </p>
              <button className={s.secondary} onClick={() => taken(m)}>
                Mark taken
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
