import card from "../components/Card.module.css";
import s from "./Settings.module.css";

export type Look = "field" | "plain";

const LOOKS: { id: Look; label: string; note: string }[] = [
  {
    id: "field",
    label: "Colour field",
    note: "A soft colour behind the main risk. Its colour shows the risk state.",
  },
  {
    id: "plain",
    label: "Plain white",
    note: "White pages. Colour only where something needs attention.",
  },
];

export function Settings({
  look,
  onLook,
}: {
  look: Look;
  onLook: (l: Look) => void;
}) {
  return (
    <>
      <label style={{ display: "block", marginBottom: 20 }}>
        Local backend token (optional)
        <input
          type="password"
          aria-label="Backend token"
          defaultValue={sessionStorage.getItem("halo-api-token") ?? ""}
          onChange={(e) =>
            sessionStorage.setItem("halo-api-token", e.target.value)
          }
        />
      </label>
      <h1 className={s.title}>Settings</h1>
      <section
        className={`${card.card} ${s.group}`}
        aria-labelledby="look-title"
      >
        <div className={card.head}>
          <h2 id="look-title">Appearance</h2>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="look-title"
          className={s.options}
        >
          {LOOKS.map((o) => (
            <label key={o.id} className={s.option}>
              <input
                type="radio"
                name="look"
                value={o.id}
                checked={look === o.id}
                onChange={() => onLook(o.id)}
              />
              <span>
                <b>{o.label}</b>
                <small>{o.note}</small>
              </span>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
