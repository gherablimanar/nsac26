import { useEffect, useState } from "react";
import { api, type Selection } from "../shared/api.ts";
import { assessCrew } from "../engine/assessment.ts";
import { historyOf, contextOf } from "../data/crew.ts";
import { answer } from "../shared/offlineAssistant.ts";
import s from "../shared/Workbench.module.css";
type Props = Selection & { delay: string | null; urgent: boolean };
export function Assistant({
  crewId,
  day,
  profile = "mars_transit",
  urgent,
}: Props) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [allowAI, setAllowAI] = useState(false);
  useEffect(() => setMessages([]), [crewId, day]);
  async function send() {
    if (!text.trim() || busy) return;
    const q = text;
    setText("");
    setBusy(true);
    let result;
    const input = { crewId, day, profile, question: q, symptoms: [], allowAI };
    try {
      result = await api("/assistant", input);
    } catch {
      result = answer(
        q,
        assessCrew(historyOf(crewId), day, profile, contextOf(crewId, day)),
      );
    }
    setMessages((m) => [...m, { question: q, ...result }]);
    setBusy(false);
  }
  return (
    <>
      <h1 className={s.title}>Assistant</h1>
      <p className={s.intro}>
        Evidence-linked explanations. No diagnosis or medication dosing. You
        control whether hosted AI assists with reviewed wording.
      </p>
      <section className={s.panel}>
        {urgent && (
          <p role="alert" className={s.danger}>
            For urgent symptoms, contact the crew medical officer and follow the
            onboard emergency protocol now. This app does not contact emergency
            services.
          </p>
        )}
        <div className={s.conversation} aria-live="polite">
          {messages.map((m, i) => (
            <div className={s.message} key={i}>
              <b>You:</b> {m.question}
              <div className={s.result}>
                <b>HALO ({m.mode}):</b> {m.explanation}
                <p>{m.escalation}</p>
                <p className={s.notice}>
                  {m.citations?.map((e: any) => e.title).join("; ")}
                </p>
                <p className={s.notice}>{m.limitations}</p>
              </div>
            </div>
          ))}
        </div>
        <label className={s.field}>
          Describe the question
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={allowAI}
            onChange={(e) => setAllowAI(e.target.checked)}
          />
          Allow optional hosted AI to organize reviewed explanation sentences
        </label>
        <div className={s.row}>
          <button
            className={s.button}
            onClick={send}
            disabled={busy || !text.trim()}
          >
            {busy ? "Checking…" : "Ask HALO"}
          </button>
        </div>
        <p className={s.notice}>
          Conservative symptom screening is not comprehensive. An absent flag
          cannot rule out an emergency. No report is automatically sent.
        </p>
      </section>
    </>
  );
}
