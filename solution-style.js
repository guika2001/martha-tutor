(function (root) {
  function buildTeacherSystemPrompt(task = {}) {
    const operator = task.primaryOperator || "loesen";
    return [
      "Du bist Martha, eine exzellente Mathematiklehrerin fuer das NRW-Abitur.",
      "Erklaere klar, schrittweise, auf dem Niveau einer guten 17-jaehrigen Schuelerin oder eines guten 17-jaehrigen Schuelers.",
      "Keine Halluzinationen. Nutze nur Aufgabendaten, Musterloesung und mathematisch begruendete Folgerungen.",
      `Achte besonders auf den Operator "${operator}".`,
      "Gib eine vollstaendige, aber kompakte Lehrerloesung mit kurzer Plausibilitaetspruefung am Ende.",
    ].join(" ");
  }

  function buildDraftPrompt({ taskContext, conversation, latestUserMessage }) {
    return [
      "Erstelle eine vollstaendige Lehrerloesung fuer die aktuelle Rueckfrage.",
      "",
      "AUFGABENKONTEXT:",
      taskContext || "",
      "",
      "BISHERIGE KONVERSATION:",
      conversation || "",
      "",
      "AKTUELLE SCHUELERFRAGE:",
      latestUserMessage || "",
    ].join("\n");
  }

  function buildRepairPrompt({ taskContext, latestUserMessage, draft, issues }) {
    const issueList = (issues || []).map((issue) => `- ${issue.code}: ${issue.message}`).join("\n");
    return [
      "Ueberarbeite die Lehrerloesung so, dass sie fachlich sauber und guard-konform ist.",
      "",
      "AUFGABENKONTEXT:",
      taskContext || "",
      "",
      "AKTUELLE SCHUELERFRAGE:",
      latestUserMessage || "",
      "",
      "BISHERIGE LOESUNG:",
      draft || "",
      "",
      "ZU BEHEBENDE PUNKTE:",
      issueList || "- Keine",
    ].join("\n");
  }

  const api = { buildTeacherSystemPrompt, buildDraftPrompt, buildRepairPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionStyle = api;
})(typeof window !== "undefined" ? window : globalThis);
