(function (root) {
  const OPERATOR_MAP = [
    { id: "bestimmen", pattern: /\bbestimm(?:e|en|t)\b/i },
    { id: "berechnen", pattern: /\bberechn(?:e|en|et)\b/i },
    { id: "begruenden", pattern: /\bbegr[uü]nd(?:e|en|et)\b/i },
    { id: "beurteilen", pattern: /\bbeurteil(?:e|en|t)\b/i },
    { id: "interpretieren", pattern: /\binterpretier(?:e|en|t)\b/i },
    { id: "nachweisen", pattern: /\b(?:nachweis(?:e|en|t)|zeig(?:e|en|t))\b/i },
    { id: "modellieren", pattern: /\bmodellier(?:e|en|t)\b/i },
    { id: "beschreiben", pattern: /\bbeschreib(?:e|en|t)\b/i },
  ];

  const GUIDANCE = {
    bestimmen: {
      label: "Bestimmen",
      answerShape: "Gib den gesuchten Wert oder Term klar an und zeige die nötigen Rechenschritte.",
      commonMistake: "Nicht nur das Ergebnis nennen, sondern den Lösungsweg sauber angeben.",
    },
    berechnen: {
      label: "Berechnen",
      answerShape: "Rechne systematisch und dokumentiere die eingesetzten Formeln oder Umformungen.",
      commonMistake: "Keine Zwischenschritte zu überspringen, wenn die Rechnung nicht direkt einsichtig ist.",
    },
    begruenden: {
      label: "Begründen",
      answerShape: "Nenne die mathematische Aussage und verknüpfe sie mit einem tragenden Argument.",
      commonMistake: "Nicht nur behaupten, sondern den Begründungsschritt explizit aussprechen.",
    },
    beurteilen: {
      label: "Beurteilen",
      answerShape: "Treffe ein Urteil und stütze es mit passenden mathematischen Kriterien oder Ergebnissen.",
      commonMistake: "Nicht bei einer Rechnung stehen bleiben, sondern ein klares Urteil formulieren.",
    },
    interpretieren: {
      label: "Interpretieren",
      answerShape: "Nenne das Ergebnis und erkläre es im Kontext der Aufgabe.",
      commonMistake: "Nicht nur rechnen, sondern die Bedeutung im Sachzusammenhang nennen.",
    },
    nachweisen: {
      label: "Nachweisen / Zeigen",
      answerShape: "Führe einen vollständigen Nachweis mit den relevanten Bedingungen und Zwischenschritten.",
      commonMistake: "Keine Begründungskette auslassen und das Ziel nicht nur behaupten.",
    },
    modellieren: {
      label: "Modellieren",
      answerShape: "Überführe die Situation in mathematische Größen, Gleichungen oder Verteilungen und erkläre die Zuordnung.",
      commonMistake: "Nicht direkt rechnen, bevor das Modell sauber aufgebaut ist.",
    },
    beschreiben: {
      label: "Beschreiben",
      answerShape: "Formuliere die erkennbaren Eigenschaften oder Zusammenhänge fachsprachlich korrekt.",
      commonMistake: "Nicht interpretieren oder urteilen, wenn nur eine Beschreibung verlangt ist.",
    },
  };

  function detectOperators(text) {
    return OPERATOR_MAP.filter((entry) => entry.pattern.test(String(text || ""))).map((entry) => entry.id);
  }

  function buildOperatorGuidance(operatorId) {
    return GUIDANCE[operatorId] || {
      label: operatorId || "Operator",
      answerShape: "Gib eine vollständige, schrittweise Antwort.",
      commonMistake: "Achte darauf, Operator und Kontext sauber zu erfüllen.",
    };
  }

  const api = { detectOperators, buildOperatorGuidance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaOperatoren = api;
})(typeof window !== "undefined" ? window : globalThis);
