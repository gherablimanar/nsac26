// MOCK: scripted conversation and local responder. No real model call in this prototype.
// Red-flag rules run first and deterministically, then medicine words, then a fallback.

export type Block =
  | { kind: "text"; text: string }
  | { kind: "check"; text: string }
  | { kind: "evidence" }
  | { kind: "action"; text: string }
  | { kind: "escalation" }
  | { kind: "quick"; options: string[] }
  | { kind: "note" }
  | { kind: "emergency"; title: string; text: string };

export type HaloMessage = { id: string; from: "halo"; blocks: Block[] };
export type UserMessage = { id: string; from: "user"; text: string };
export type Message = HaloMessage | UserMessage;

export const SEED_C2: Message[] = [
  { id: "s1", from: "user", text: "I've had a dull ache in my lower back since this morning." },
  { id: "s2", from: "halo", blocks: [
    { kind: "check", text: "I checked for emergency signs first: no fever logged, no blood in urine reported, and the pain isn't described as severe. No red flags." },
    { kind: "text", text: "A few questions so I can narrow it down:" },
    { kind: "quick", options: ["One side only", "Both sides", "It hurts when I pee"] },
  ] },
  { id: "s3", from: "user", text: "One side only" },
  { id: "s4", from: "halo", blocks: [
    { kind: "text", text: "That fits with what your data shows, but it's not a diagnosis." },
    { kind: "evidence" },
    { kind: "text", text: "Low fluid plus extra salt is how kidney stones start in microgravity (Siew et al. 2024)." },
    { kind: "action", text: "What to do now: drink 500 ml over the next hour, and log your urine colour tonight." },
    { kind: "escalation" },
    { kind: "note" },
  ] },
  { id: "s5", from: "user", text: "Can I take ibuprofen for it?" },
  { id: "s6", from: "halo", blocks: [
    { kind: "text", text: "I can't advise on medicines or doses. Your flight surgeon's schedule is in Medicines, and I've added your question to the note for Houston." },
  ] },
];

export const EMPTY_QUICK = ["I have a headache", "My vision is blurry", "I slept badly"];

export const NOTE_TEXT =
  "Crew member reports a dull one-sided lower back ache since this morning. Fluid intake and urine colour are outside the usual range, sodium is high. No fever or blood in urine reported. Asked about ibuprofen; no advice given. Please advise.";

const RED_FLAGS = [
  "chest pain", "can't breathe", "cannot breathe", "short of breath", "sudden vision loss",
  "lost my vision", "can't see", "confused", "confusion", "blood in", "severe pain", "fainted", "passed out",
];
const MEDICINE = ["dose", "mg", "ibuprofen", "paracetamol", "acetaminophen", "medicine", "pill", "tablet"];

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export const EMERGENCY_TEXT = "Follow the onboard emergency protocol now. Your crew medical officer should be with you.";

export function respond(text: string): HaloMessage {
  const t = text.toLowerCase();
  if (RED_FLAGS.some((f) => t.includes(f))) {
    return { id: nextId(), from: "halo", blocks: [{ kind: "emergency", title: "This could be an emergency", text: EMERGENCY_TEXT }] };
  }
  if (MEDICINE.some((w) => t.includes(w))) {
    return { id: nextId(), from: "halo", blocks: [{ kind: "text", text: "I can't advise on medicines or doses. Your flight surgeon's schedule is in Medicines, and I've added your question to the note for Houston." }] };
  }
  // MOCK scripted answers for the replies the start screen offers
  if (t.includes("what should i do")) {
    return { id: nextId(), from: "halo", blocks: [
      { kind: "action", text: "What to do now: drink 500 ml over the next hour, and log your urine colour tonight." },
      { kind: "escalation" }, { kind: "note" },
    ] };
  }
  if (t.includes("headache")) {
    return { id: nextId(), from: "halo", blocks: [
      { kind: "check", text: "No red flags: it isn't described as sudden or severe, and no vision change is reported." },
      { kind: "text", text: "In space, headaches often come from fluid shifting toward the head or from cabin CO2. Drink some water and note it in Daily Log." },
      { kind: "text", text: "If it becomes sudden and severe, or your vision changes, use Urgent help." },
    ] };
  }
  if (t.includes("blurry") || t.includes("blurred")) {
    return { id: nextId(), from: "halo", blocks: [
      { kind: "text", text: "Blurred vision can be an early sign of SANS, when fluid shifting toward the head affects the eye. About 66% of long-duration astronauts show early signs." },
      { kind: "action", text: "What to do now: do the vision self-test in Daily Log today and tell your crew medical officer." },
      { kind: "text", text: "If you suddenly lose vision, use Urgent help." },
    ] };
  }
  if (t.includes("slept badly") || t.includes("sleep")) {
    return { id: nextId(), from: "halo", blocks: [
      { kind: "text", text: "Most crews sleep about 6 hours in space. One short night slows reaction time, so take the reaction test before any spacewalk or docking." },
      { kind: "action", text: "Tonight: dim the lights an hour before sleep and keep your schedule fixed." },
    ] };
  }
  return { id: nextId(), from: "halo", blocks: [
    { kind: "text", text: "Thanks. For this prototype my answers are scripted, so try one of these:" },
    { kind: "quick", options: ["I have a headache", "My vision is blurry"] },
  ] };
}

export const userMsg = (text: string): UserMessage => ({ id: nextId(), from: "user", text });
export const haloMsg = (blocks: Block[]): HaloMessage => ({ id: nextId(), from: "halo", blocks });
