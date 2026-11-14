import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  CaretRight,
  ChartLineUp,
  RocketLaunch,
  Stethoscope,
} from "@phosphor-icons/react";
import { api } from "../shared/api.ts";
import { answer as offlineAnswer } from "../shared/offlineAssistant.ts";
import { triage, medicationAdvice } from "../shared/triage.ts";
import type {
  AssistantReply,
  AssistantStatus,
  ConversationTurn,
} from "../shared/assistantTypes.ts";
import { assessCrew } from "../engine/assessment.ts";
import { contextOf, historyOf, MISSION_PROFILE } from "../data/crew.ts";
import { HaloMark } from "../components/HaloMark";
import { PageHero } from "../components/PageHero";
import card from "../components/Card.module.css";
import s from "./Assistant.module.css";

type Props = {
  crewId: string;
  day: number;
  delay: string | null;
  urgent: boolean;
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reply?: AssistantReply;
};
const modelLabel = (r: AssistantReply) =>
  r.mode === "grounded_ai"
    ? "AI-generated answer · check the cited sources"
    : r.modelStatus === "not_configured"
      ? "AI not configured · reference fallback"
      : r.modelStatus === "invalid_configuration"
        ? "AI configuration invalid · reference fallback"
        : r.modelStatus === "failed_using_offline_fallback"
          ? "AI request failed · reference fallback"
          : r.modelStatus === "insufficient_evidence"
            ? "Insufficient evidence · model not called"
            : r.modelStatus === "not_requested"
              ? "Hosted AI is off · reference fallback"
              : r.modelStatus === "safety_bypass"
                ? "Safety response · model not called"
                : "Backend unavailable · offline fallback";

const failureHelp: Record<string, string> = {
  authentication_error:
    "The AI service rejected authentication. Ask the administrator to check the server credential.",
  access_denied:
    "AI access was denied. The administrator needs to check resource access and subscription eligibility.",
  deployment_not_found:
    "The configured AI deployment was not found. Ask the administrator to check the deployment name and resource endpoint.",
  rate_limit_or_quota:
    "The AI service reported a request limit or quota issue. Wait before retrying or ask the administrator to check quota.",
  unsupported_request:
    "The AI service rejected this request format. The administrator needs to check model compatibility.",
  timeout: "The AI request timed out. A reference fallback is shown.",
};

export function Assistant({ crewId, day, delay, urgent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [started, setStarted] = useState(urgent);
  const [busy, setBusy] = useState(false);
  const [allowAI, setAllowAI] = useState(
    () => sessionStorage.getItem("halo-allow-ai") === "true",
  );
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const area = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const context = contextOf(crewId, day);
  const assessment = assessCrew(
    historyOf(crewId),
    day,
    MISSION_PROFILE,
    context,
  );

  useEffect(() => {
    generation.current++;
    inFlight.current = false;
    setBusy(false);
    setMessages([]);
    setStarted(urgent);
    setText("");
    return () => {
      generation.current++;
    };
  }, [crewId, day, urgent]);
  useEffect(() => {
    let cancelled = false;
    api<AssistantStatus>("/assistant/status")
      .then((r) => {
        if (!cancelled) {
          setStatus(r);
          setStatusError("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setStatus(null);
          setStatusError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [crewId, day, allowAI]);
  useEffect(() => {
    if (area.current) area.current.scrollTop = area.current.scrollHeight;
  }, [messages, busy]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || question.length > 2000 || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setStarted(true);
    setText("");
    const requestGeneration = generation.current;
    const history: ConversationTurn[] = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: question },
    ]);
    let reply: AssistantReply;
    // Emergency/medication responses remain immediate even if the API is slow or absent.
    if (
      triage(question, context.symptoms ?? []).urgent ||
      medicationAdvice(question)
    ) {
      reply = {
        ...offlineAnswer(question, assessment, context.symptoms),
        modelStatus: "safety_bypass",
      };
    } else {
      try {
        reply = await api<AssistantReply>("/assistant", {
          crewId,
          day,
          profile: MISSION_PROFILE,
          question,
          symptoms: context.symptoms ?? [],
          history,
          allowAI,
        });
      } catch {
        reply = offlineAnswer(question, assessment, context.symptoms);
      }
    }
    if (generation.current !== requestGeneration) return;
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply.explanation,
        reply,
      },
    ]);
    setBusy(false);
    inFlight.current = false;
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(text);
    }
  };
  const reset = () => {
    generation.current++;
    inFlight.current = false;
    setMessages([]);
    setBusy(false);
    setStarted(false);
    setText("");
  };

  return (
    <>
      <PageHero
        page="Assistant"
        state={
          assessment.priority?.level === "Act"
            ? "act"
            : assessment.priority
              ? "watch"
              : "normal"
        }
        title={
          <span className={s.heroTitle}>
            <HaloMark size={48} className={s.heroMark} />
            Ask HALO
          </span>
        }
        line="Questions about space health, your readings and the evidence behind them."
      />
      <div className={s.grid}>
        <section
          className={`${card.card} ${s.convo}`}
          aria-label="Conversation with HALO"
        >
          <div className={s.messages} ref={area}>
            {urgent && (
              <div className={s.emergency} role="alert">
                <h2>Urgent help</h2>
                <p>
                  Contact the crew medical officer and follow the onboard
                  emergency procedure. Do not wait for an Earth reply or an AI
                  answer.
                </p>
              </div>
            )}
            {!started && (
              <div className={s.start}>
                <div className={s.choices}>
                  {(
                    [
                      [
                        Stethoscope,
                        "Why can dehydration and bone changes matter for kidney health?",
                        "Understand a health mechanism",
                      ],
                      [
                        ChartLineUp,
                        "Explain my current readings and any missing inputs.",
                        "Ask about my readings",
                      ],
                      [
                        RocketLaunch,
                        "What does the evidence say about sleep during spaceflight?",
                        "Understand sleep in space",
                      ],
                    ] as const
                  ).map(([Icon, question, label]) => (
                    <button
                      type="button"
                      key={label}
                      className={s.choice}
                      onClick={() => void send(question)}
                    >
                      <span className={s.choiceIcon}>
                        <Icon size={22} />
                      </span>
                      <b>{label}</b>
                      <small>{question}</small>
                      <CaretRight size={18} className={s.choiceGo} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {started && (
              <button type="button" className={s.back} onClick={reset}>
                <ArrowLeft size={16} />
                New conversation
              </button>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className={s.user}>
                  {m.content}
                </div>
              ) : (
                <div key={m.id} className={s.halo}>
                  <div className={s.label}>
                    <HaloMark size={20} />
                    HALO
                  </div>
                  <p className={s.answerMode}>{modelLabel(m.reply!)}</p>
                  {m.reply?.failureReason &&
                    failureHelp[m.reply.failureReason] && (
                      <p className={s.answerLimit}>
                        {failureHelp[m.reply.failureReason]}
                      </p>
                    )}
                  {m.reply?.paragraphs?.length ? (
                    m.reply.paragraphs.map((p, i) => (
                      <div key={i}>
                        <p className={s.p}>{p.text}</p>
                        {!!p.evidenceIds.length && (
                          <small className={s.claimRefs}>
                            Sources:{" "}
                            {p.evidenceIds.map((id) => {
                              const passage = m.reply?.retrieval?.passages.find(
                                (x) => x.id === id,
                              );
                              const citation = m.reply?.citations.find(
                                (x) => x.id === passage?.sourceId,
                              );
                              return citation ? (
                                <a
                                  key={id}
                                  href={citation.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {citation.title}
                                </a>
                              ) : null;
                            })}
                          </small>
                        )}
                        {!!p.signalKeys.length && (
                          <small className={s.claimRefs}>
                            Demo inputs: {p.signalKeys.join(", ")}
                          </small>
                        )}
                      </div>
                    ))
                  ) : (
                    <p
                      className={s.p}
                      role={m.reply?.triage.urgent ? "alert" : undefined}
                    >
                      {m.content}
                    </p>
                  )}
                  {!!m.reply?.citations.length &&
                    !m.reply.paragraphs?.length && (
                      <ul className={s.sources}>
                        {m.reply.citations.map((c) => (
                          <li key={c.id}>
                            <a
                              href={c.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {c.title}
                            </a>{" "}
                            · review pending
                          </li>
                        ))}
                      </ul>
                    )}
                  {!!m.reply?.uncertainties?.length && (
                    <p className={s.p}>
                      Limits: {m.reply.uncertainties.join(" ")}
                    </p>
                  )}
                  {!m.reply?.triage.urgent && (
                    <div className={s.quick}>
                      {m.reply?.followUp?.map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={s.quickBtn}
                          disabled={busy}
                          onClick={() => void send(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={s.answerLimit}>{m.reply?.limitations}</p>
                </div>
              ),
            )}
            {busy && <p role="status">Preparing an evidence-based answer…</p>}
          </div>
          <div className={s.composer}>
            <label htmlFor="assistant-input" className={s.vh}>
              Describe how you feel
            </label>
            <textarea
              id="assistant-input"
              ref={input}
              className={s.input}
              rows={2}
              maxLength={2000}
              placeholder="Ask about space health or your readings"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              type="button"
              className={s.cta}
              disabled={busy || !text.trim()}
              onClick={() => void send(text)}
            >
              {busy ? "Answering…" : "Send"}
            </button>
          </div>
        </section>
        <div className={s.context}>
          <section className={card.card} aria-labelledby="ai-status-title">
            <div className={card.head}>
              <h2 id="ai-status-title">AI connection</h2>
            </div>
            <p role="status">
              {status
                ? status.message
                : "AI backend unavailable. Offline safety and demonstration readouts remain available."}
            </p>
            {statusError && <p className={s.answerLimit}>{statusError}</p>}
            <label className={s.consent}>
              <input
                type="checkbox"
                checked={allowAI}
                onChange={(e) => {
                  setAllowAI(e.target.checked);
                  sessionStorage.setItem(
                    "halo-allow-ai",
                    String(e.target.checked),
                  );
                }}
              />
              Use hosted AI for this session
            </label>
            <p className={s.answerLimit}>
              When enabled, your question, up to six recent conversation turns
              and the selected crew’s simulated assessment are sent to{" "}
              {status?.provider === "azure"
                ? "Azure OpenAI (Microsoft Azure)"
                : status?.provider === "openai"
                  ? "OpenAI"
                  : "the configured AI provider (Azure OpenAI or OpenAI)"}
              . Names are omitted; avoid personal identifiers in questions. No
              flight-surgeon message is sent.
            </p>
          </section>
          <section className={card.card} aria-labelledby="using-h">
            <div className={card.head}>
              <h2 id="using-h">What HALO is using</h2>
            </div>
            <dl className={s.rows}>
              <div>
                <dt>Selection</dt>
                <dd>
                  {crewId} · Day {day} · {MISSION_PROFILE}
                </dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>Fictional mission simulation</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>
                  {assessment.priority
                    ? `${assessment.priority.name}: ${assessment.priority.level}`
                    : "No active coupled pattern"}
                </dd>
              </div>
              <div>
                <dt>Unknown</dt>
                <dd>{assessment.unknown.join(", ") || "None listed"}</dd>
              </div>
              <div>
                <dt>Scenario delay</dt>
                <dd>{delay ?? "Not set"} · no live link</dd>
              </div>
            </dl>
          </section>
          <section className={card.card}>
            <div className={card.head}>
              <h2>Limits</h2>
            </div>
            <p>
              Reference summaries are pending expert review. Generated answers
              can be wrong. HALO does not diagnose, prescribe or grant flight
              clearance. New or worsening symptoms require human review.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
