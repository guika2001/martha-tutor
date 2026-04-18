(function (root) {
  function getLanguagePack(langCode) {
    const code = langCode || "de";
    if (code === "hu") {
      return {
        systemLead: "Te Martha vagy, egy kiváló matematikatanár az NRW-Abiturhoz.",
        explain: "Magyarázz világosan, lépésről lépésre, egy jó 17 éves diák szintjén.",
        glossary: 'Ha német szakkifejezést használsz, az első előfordulásnál azonnal add meg magyarul is zárójelben, például "Nullstellen (zérushelyek)" vagy "Flächeninhalt (terület)".',
        notation: 'Ha a megoldásban szokatlan vagy ASCII-jelölés jelenik meg, például "^", "*", "exp(...)" vagy nem szokásos integrál/intervalum-írás, tegyél a megoldás elejére egy rövid "Jelölések:" blokkot 1-3 pontban.',
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
        glossary: "If you use German task terms, gloss them briefly in the active answer language on first mention.",
        notation: 'If unusual ASCII notation appears, briefly explain symbols such as "^", "*", "exp(...)", or nonstandard interval/integral notation before the solution.',
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
        glossary: "Si usas términos alemanes del enunciado, acláralos brevemente en el idioma activo en la primera aparición.",
        notation: 'Si aparece notación ASCII poco habitual, explica brevemente símbolos como "^", "*", "exp(...)" o integrales/intervalos escritos de forma no estándar.',
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
      glossary: "Wenn fachliche Begriffe aus einer anderen Sprache auftauchen, erlaeutere sie beim ersten Auftreten kurz.",
      notation: 'Wenn ungewoehnliche ASCII-Notation vorkommt, erklaere Symbole wie "^", "*", "exp(...)" oder ungewoehnliche Integral-/Intervallschreibweisen kurz vor der Loesung.',
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

  function getResponseModeInstruction(responseMode = "solution", langCode = "de") {
    const packs = {
      hu: {
        tip: "Most csak egy rövid tippet adj, legfeljebb 2-3 mondatban. Ne oldd meg a feladatot.",
        step: "Most kizárólag az első érdemi lépést mutasd meg, majd állj meg. Ne folytasd a teljes megoldással.",
        solpath: "Most csak rövid megoldási tervet adj, ne vezesd le a teljes megoldást.",
        solution: "Most teljes, ellenőrzött megoldást adj.",
        explainer: "Általános matekos magyarázatot adj feladatkötés nélkül.",
      },
      en: {
        tip: "Give only a short hint in at most 2-3 sentences. Do not solve the task.",
        step: "Show only the first meaningful step and then stop. Do not continue with the full solution.",
        solpath: "Give only a brief solution path, not the full worked solution.",
        solution: "Give the full validated solution now.",
        explainer: "Give a general math explanation without tying it to a specific task.",
      },
      es: {
        tip: "Da solo una pista breve en 2-3 frases como máximo. No resuelvas el ejercicio.",
        step: "Muestra solo el primer paso relevante y detente después. No continúes con la solución completa.",
        solpath: "Da solo un plan breve de solución, no la resolución completa.",
        solution: "Da ahora la solución completa validada.",
        explainer: "Da una explicación matemática general sin vincularla a un ejercicio concreto.",
      },
      de: {
        tip: "Gib jetzt nur einen kurzen Tipp in hoechstens 2-3 Saetzen. Loese die Aufgabe nicht.",
        step: "Zeige jetzt nur den ersten sinnvollen Schritt und stoppe danach. Fuehre nicht die ganze Loesung aus.",
        solpath: "Gib jetzt nur einen kurzen Loesungsweg, aber keine vollstaendige Ausrechnung.",
        solution: "Gib jetzt die vollstaendige validierte Loesung.",
        explainer: "Gib eine allgemeine Mathe-Erklaerung ohne Bindung an eine konkrete Aufgabe.",
      },
    };
    const pack = packs[langCode] || packs.de;
    return pack[responseMode] || pack.solution;
  }

  function buildTeacherSystemPrompt(task = {}, langCode = "de", responseMode = "solution") {
    const operator = task.primaryOperator || "loesen";
    const pack = getLanguagePack(langCode);
    return [
      pack.systemLead,
      pack.explain,
      pack.glossary,
      pack.notation,
      pack.guard,
      pack.operator.replace("{operator}", operator),
      getResponseModeInstruction(responseMode, langCode),
      pack.compact,
    ].join(" ");
  }

  function buildDraftPrompt({ taskContext, conversation, latestUserMessage, langCode = "de", responseMode = "solution" }) {
    const pack = getLanguagePack(langCode);
    return [
      pack.draft,
      getResponseModeInstruction(responseMode, langCode),
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

  function buildRepairPrompt({ taskContext, latestUserMessage, draft, issues, langCode = "de", responseMode = "solution" }) {
    const pack = getLanguagePack(langCode);
    const issueList = (issues || []).map((issue) => `- ${issue.code}: ${issue.message}`).join("\n");
    return [
      pack.repair,
      getResponseModeInstruction(responseMode, langCode),
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

  const api = { getLanguagePack, getResponseModeInstruction, buildTeacherSystemPrompt, buildDraftPrompt, buildRepairPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionStyle = api;
})(typeof window !== "undefined" ? window : globalThis);
