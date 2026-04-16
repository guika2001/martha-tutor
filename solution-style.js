(function (root) {
  function getLanguagePack(langCode) {
    const code = langCode || "de";
    if (code === "hu") {
      return {
        systemLead: "Te Martha vagy, egy kiváló matematikatanár az NRW-Abiturhoz.",
        explain: "Magyarázz világosan, lépésről lépésre, egy jó 17 éves diák szintjén.",
        guard: "Ne hallucinálj. Csak a feladat adatait, a mintamegoldást és matematikailag indokolt következtetéseket használd.",
        operator: 'Különösen figyelj a(z) "{operator}" operátorra.',
        compact: "Adj teljes, de tömör tanári megoldást, rövid ellenőrzéssel a végén.",
        draft: "Készíts teljes tanári megoldást az aktuális kérdéshez.",
        context: "FELADATKONTEXTUS:",
        conversation: "EDDIGI BESZÉLGETÉS:",
        user: "AKTUÁLIS DIÁKKÉRDÉS:",
        repair: "Dolgozd át a tanári megoldást úgy, hogy szakmailag pontos és guard-kompatibilis legyen.",
        current: "AKTUÁLIS DIÁKKÉRDÉS:",
        previous: "EDDIGI MEGOLDÁS:",
        issues: "JAVÍTANDÓ PONTOK:",
      };
    }
    if (code === "en") {
      return {
        systemLead: "You are Martha, an excellent mathematics teacher for the NRW Abitur.",
        explain: "Explain clearly, step by step, at the level of a strong 17-year-old student.",
        guard: "Do not hallucinate. Use only task data, reference solutions, and mathematically justified inferences.",
        operator: 'Pay special attention to the operator "{operator}".',
        compact: "Give a complete but compact teacher solution with a short plausibility check at the end.",
        draft: "Create a complete teacher solution for the current follow-up.",
        context: "TASK CONTEXT:",
        conversation: "RECENT CONVERSATION:",
        user: "CURRENT STUDENT QUESTION:",
        repair: "Revise the teacher solution so it is mathematically sound and guard-compliant.",
        current: "CURRENT STUDENT QUESTION:",
        previous: "PREVIOUS SOLUTION:",
        issues: "ISSUES TO FIX:",
      };
    }
    if (code === "es") {
      return {
        systemLead: "Eres Martha, una excelente profesora de matemáticas para el Abitur de NRW.",
        explain: "Explica con claridad, paso a paso, al nivel de un buen estudiante de 17 años.",
        guard: "No alucines. Usa solo los datos del ejercicio, la solución modelo y deducciones matemáticamente justificadas.",
        operator: 'Presta especial atención al operador "{operator}".',
        compact: "Da una solución docente completa pero compacta con una breve comprobación final.",
        draft: "Crea una solución docente completa para la pregunta actual.",
        context: "CONTEXTO DEL EJERCICIO:",
        conversation: "CONVERSACIÓN RECIENTE:",
        user: "PREGUNTA ACTUAL DEL ESTUDIANTE:",
        repair: "Revisa la solución docente para que sea matemáticamente correcta y compatible con los guards.",
        current: "PREGUNTA ACTUAL DEL ESTUDIANTE:",
        previous: "SOLUCIÓN ANTERIOR:",
        issues: "PUNTOS A CORREGIR:",
      };
    }
    return {
      systemLead: "Du bist Martha, eine exzellente Mathematiklehrerin fuer das NRW-Abitur.",
      explain: "Erklaere klar, schrittweise, auf dem Niveau einer guten 17-jaehrigen Schuelerin oder eines guten 17-jaehrigen Schuelers.",
      guard: "Keine Halluzinationen. Nutze nur Aufgabendaten, Musterloesung und mathematisch begruendete Folgerungen.",
      operator: 'Achte besonders auf den Operator "{operator}".',
      compact: "Gib eine vollstaendige, aber kompakte Lehrerloesung mit kurzer Plausibilitaetspruefung am Ende.",
      draft: "Erstelle eine vollstaendige Lehrerloesung fuer die aktuelle Rueckfrage.",
      context: "AUFGABENKONTEXT:",
      conversation: "BISHERIGE KONVERSATION:",
      user: "AKTUELLE SCHUELERFRAGE:",
      repair: "Ueberarbeite die Lehrerloesung so, dass sie fachlich sauber und guard-konform ist.",
      current: "AKTUELLE SCHUELERFRAGE:",
      previous: "BISHERIGE LOESUNG:",
      issues: "ZU BEHEBENDE PUNKTE:",
    };
  }

  function buildTeacherSystemPrompt(task = {}, langCode = "de") {
    const operator = task.primaryOperator || "loesen";
    const pack = getLanguagePack(langCode);
    return [
      pack.systemLead,
      pack.explain,
      pack.guard,
      pack.operator.replace("{operator}", operator),
      pack.compact,
    ].join(" ");
  }

  function buildDraftPrompt({ taskContext, conversation, latestUserMessage, langCode = "de" }) {
    const pack = getLanguagePack(langCode);
    return [
      pack.draft,
      "",
      pack.context,
      taskContext || "",
      "",
      pack.conversation,
      conversation || "",
      "",
      pack.user,
      latestUserMessage || "",
    ].join("\n");
  }

  function buildRepairPrompt({ taskContext, latestUserMessage, draft, issues, langCode = "de" }) {
    const pack = getLanguagePack(langCode);
    const issueList = (issues || []).map((issue) => `- ${issue.code}: ${issue.message}`).join("\n");
    return [
      pack.repair,
      "",
      pack.context,
      taskContext || "",
      "",
      pack.current,
      latestUserMessage || "",
      "",
      pack.previous,
      draft || "",
      "",
      pack.issues,
      issueList || "- Keine",
    ].join("\n");
  }

  const api = { getLanguagePack, buildTeacherSystemPrompt, buildDraftPrompt, buildRepairPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionStyle = api;
})(typeof window !== "undefined" ? window : globalThis);
