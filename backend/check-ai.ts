import { makeServer } from "./node/app.ts";
// This is an intentional live provider check, not a mocked test. It may incur API usage.
if (!process.env.AI_API_KEY || !process.env.HALO_MODEL) {
  process.stderr.write(
    "LIVE AI NOT TESTED: set AI_API_KEY and HALO_MODEL on the server, then rerun npm run check:ai.\n",
  );
  process.exit(2);
}
const app = await makeServer({
  dbPath: ":memory:",
  apiKey: process.env.AI_API_KEY,
  model: process.env.HALO_MODEL,
});
try {
  const response = await app.inject({
    method: "POST",
    url: "/api/assistant",
    payload: {
      crewId: "C2",
      day: 60,
      question:
        "What does the supplied evidence say about sleep deficiency during spaceflight?",
      allowAI: true,
    },
  });
  const body = response.json();
  process.stdout.write(
    JSON.stringify(
      {
        httpStatus: response.statusCode,
        mode: body.mode,
        modelStatus: body.modelStatus,
        failureReason: body.failureReason,
        answer: body.explanation,
        sources: body.citations?.map((c: any) => c.source_url),
      },
      null,
      2,
    ) + "\n",
  );
  if (
    response.statusCode !== 200 ||
    body.mode !== "grounded_ai" ||
    body.modelStatus !== "available"
  )
    process.exitCode = 1;
} finally {
  await app.close();
}
