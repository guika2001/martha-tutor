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

  function getValidatorSystemPrompt(langCode = "de") {
    const pack = getValidatorPack(langCode);
    return [
      pack.system,
      pack.onlyJson,
      pack.schema,
      pack.checks,
    ].join(" ");
  }

  function buildValidationPrompt({ taskContext, draft, langCode = "de" }) {
    const pack = getValidatorPack(langCode);
    return [
      pack.prompt,
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

  const api = { getValidatorPack, getValidatorSystemPrompt, buildValidationPrompt, parseValidationResult };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaSolutionValidator = api;
})(typeof window !== "undefined" ? window : globalThis);
