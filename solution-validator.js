(function (root) {
  function getValidatorSystemPrompt() {
    return [
      "Du bist ein strenger Mathematik-Validator fuer NRW-Abiturloesungen.",
      "Antworte nur als JSON.",
      'Schema: {"valid":boolean,"confidence":number,"issues":[{"code":string,"message":string}],"corrected_answer":string,"should_repair":boolean}',
      "Pruefe fachliche Richtigkeit, Operator-Treue, Nutzung der Aufgabendaten und Passung zur Musterloesung wenn vorhanden.",
    ].join(" ");
  }

  function buildValidationPrompt({ taskContext, draft }) {
    return [
      "Pruefe diese Loesung.",
      "",
      "AUFGABENKONTEXT:",
      taskContext || "",
      "",
      "LOESUNGSENTWURF:",
      draft || "",
      "",
      "Gib nur JSON zurueck.",
    ].join("\n");
  }

  function parseValidationResult(text) {
    const raw = String(text || "").trim();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        valid: Boolean(parsed.valid),
        confidence: Number(parsed.confidence || 0),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        correctedAnswer: parsed.corrected_answer || "",
        shouldRepair: Boolean(parsed.should_repair),
      };
    } catch (_) {
      return {
        valid: false,
        confidence: 0,
        issues: [{ code: "validator-parse-failed", message: "Validator output was not valid JSON." }],
        correctedAnswer: "",
        shouldRepair: true,
      };
    }
  }

  const api = { getValidatorSystemPrompt, buildValidationPrompt, parseValidationResult };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionValidator = api;
})(typeof window !== "undefined" ? window : globalThis);
