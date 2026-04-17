(function (root) {
  function getValidatorPack(langCode = "de") {
    if (langCode === "hu") {
      return {
        system: "Te egy szigorú matematikai validátor vagy NRW-Abitur megoldásokhoz.",
        onlyJson: "Csak JSON-nal válaszolj.",
        schema: 'Schema: {"valid":boolean,"confidence":number,"issues":[{"code":string,"message":string}],"corrected_answer":string,"should_repair":boolean}',
        checks: "Ellenőrizd a szakmai helyességet, az operátor követését, a feladatadatok használatát és a mintamegoldáshoz való illeszkedést, ha van.",
        prompt: "Ellenőrizd ezt a megoldást.",
        context: "FELADATKONTEXTUS:",
        draft: "MEGOLDÁSTERVEZET:",
        json: "Csak JSON-t adj vissza.",
      };
    }
    if (langCode === "en") {
      return {
        system: "You are a strict mathematics validator for NRW Abitur solutions.",
        onlyJson: "Reply only as JSON.",
        schema: 'Schema: {"valid":boolean,"confidence":number,"issues":[{"code":string,"message":string}],"corrected_answer":string,"should_repair":boolean}',
        checks: "Check mathematical correctness, operator fidelity, use of task data, and match to the reference solution when available.",
        prompt: "Validate this solution.",
        context: "TASK CONTEXT:",
        draft: "SOLUTION DRAFT:",
        json: "Return JSON only.",
      };
    }
    if (langCode === "es") {
      return {
        system: "Eres un validador estricto de matemáticas para soluciones del Abitur NRW.",
        onlyJson: "Responde solo en JSON.",
        schema: 'Schema: {"valid":boolean,"confidence":number,"issues":[{"code":string,"message":string}],"corrected_answer":string,"should_repair":boolean}',
        checks: "Comprueba la corrección matemática, la fidelidad al operador, el uso de los datos del ejercicio y el ajuste a la solución modelo cuando exista.",
        prompt: "Valida esta solución.",
        context: "CONTEXTO DEL EJERCICIO:",
        draft: "BORRADOR DE SOLUCIÓN:",
        json: "Devuelve solo JSON.",
      };
    }
    return {
      system: "Du bist ein strenger Mathematik-Validator fuer NRW-Abiturloesungen.",
      onlyJson: "Antworte nur als JSON.",
      schema: 'Schema: {"valid":boolean,"confidence":number,"issues":[{"code":string,"message":string}],"corrected_answer":string,"should_repair":boolean}',
      checks: "Pruefe fachliche Richtigkeit, Operator-Treue, Nutzung der Aufgabendaten und Passung zur Musterloesung wenn vorhanden.",
      prompt: "Pruefe diese Loesung.",
      context: "AUFGABENKONTEXT:",
      draft: "LOESUNGSENTWURF:",
      json: "Gib nur JSON zurueck.",
    };
  }

  function getModeCheckLine(responseMode = "solution", langCode = "de") {
    const packs = {
      hu: {
        tip: "Ha a kért mód tipp, akkor a válasz nem lehet teljes megoldás.",
        step: "Ha a kért mód első lépés, akkor a válasz csak az első lépést tartalmazhatja.",
        solpath: "Ha a kért mód megoldási menet, akkor a válasz tervszintű maradjon, ne legyen teljes levezetés.",
        solution: "Ha a kért mód teljes megoldás, akkor a válasz lehet teljes.",
        explainer: "Ha a kért mód magyarázó, akkor a válasz legyen általános, ne feladatspecifikus teljes megoldás.",
      },
      en: {
        tip: "If the requested mode is hint, the answer must not become a full solution.",
        step: "If the requested mode is first step, the answer may contain only the first step.",
        solpath: "If the requested mode is solution path, keep it at plan level, not a full derivation.",
        solution: "If the requested mode is full solution, the answer may be complete.",
        explainer: "If the requested mode is explainer, the answer should stay general instead of becoming a task-specific full solution.",
      },
      es: {
        tip: "Si el modo pedido es pista, la respuesta no puede convertirse en una solución completa.",
        step: "Si el modo pedido es primer paso, la respuesta solo puede contener el primer paso.",
        solpath: "Si el modo pedido es camino de solución, mantenlo a nivel de plan, no de desarrollo completo.",
        solution: "Si el modo pedido es solución completa, la respuesta puede ser completa.",
        explainer: "Si el modo pedido es explicador, la respuesta debe mantenerse general y no convertirse en una solución completa de una tarea.",
      },
      de: {
        tip: "Wenn der gewuenschte Modus Tipp ist, darf die Antwort keine vollstaendige Loesung werden.",
        step: "Wenn der gewuenschte Modus Erster Schritt ist, darf die Antwort nur den ersten Schritt enthalten.",
        solpath: "Wenn der gewuenschte Modus Loesungsweg ist, muss die Antwort auf Planungsebene bleiben und darf nicht voll ausrechnen.",
        solution: "Wenn der gewuenschte Modus vollstaendige Loesung ist, darf die Antwort vollstaendig sein.",
        explainer: "Wenn der gewuenschte Modus Erklaerer ist, soll die Antwort allgemein bleiben und nicht zu einer vollstaendigen Aufgabenloesung werden.",
      },
    };
    const pack = packs[langCode] || packs.de;
    return pack[responseMode] || pack.solution;
  }

  function getValidatorSystemPrompt(langCode = "de", responseMode = "solution") {
    const pack = getValidatorPack(langCode);
    return [
      pack.system,
      pack.onlyJson,
      pack.schema,
      pack.checks,
      getModeCheckLine(responseMode, langCode),
    ].join(" ");
  }

  function buildValidationPrompt({ taskContext, draft, langCode = "de", responseMode = "solution" }) {
    const pack = getValidatorPack(langCode);
    return [
      pack.prompt,
      getModeCheckLine(responseMode, langCode),
      "",
      pack.context,
      taskContext || "",
      "",
      pack.draft,
      draft || "",
      "",
      pack.json,
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

  const api = { getValidatorPack, getModeCheckLine, getValidatorSystemPrompt, buildValidationPrompt, parseValidationResult };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionValidator = api;
})(typeof window !== "undefined" ? window : globalThis);
