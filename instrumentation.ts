import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  exportMode: "immediate",
});

let registered = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (registered) return;

  const tracerProvider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  });
  tracerProvider.register();
  registered = true;
}
