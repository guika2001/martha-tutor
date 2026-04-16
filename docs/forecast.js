(function (root) {
  const COPY = {
    de: {
      variantA: "Variante A · Höchstwahrscheinlich",
      variantB: "Variante B · Konservativ",
      variantC: "Variante C · Werkzeugsensitiv",
      rationale: (level) => `Gewichtet nach ${level || "GK/LK"}, offizieller NRW-Struktur und Themenhäufigkeit.`,
      topics: { Analysis: "Analysis", Stochastik: "Stochastik", "Vektorielle Geometrie": "Vektorielle Geometrie", "Lineare Algebra": "Lineare Algebra" },
      examParts: { "1. Prüfungsteil": "1. Prüfungsteil", "2. Prüfungsteil": "2. Prüfungsteil" },
      taskTypes: { Pflichtaufgabe: "Pflichtaufgabe", Wahlpflichtaufgabe: "Wahlpflichtaufgabe", Prüfungsaufgabe: "Prüfungsaufgabe" },
      toolTypes: { hilfsmittelfrei: "hilfsmittelfrei", "mit Hilfsmitteln": "mit Hilfsmitteln", Bestandsformat: "Bestandsformat" },
    },
    hu: {
      variantA: "A változat · Legvalószínűbb",
      variantB: "B változat · Konzervatív",
      variantC: "C változat · Eszközérzékeny",
      rationale: (level) => `${level || "GK/LK"} szint, hivatalos NRW-szerkezet és témagyakoriság alapján súlyozva.`,
      topics: { Analysis: "Analízis", Stochastik: "Valószínűségszámítás", "Vektorielle Geometrie": "Vektorgeometria", "Lineare Algebra": "Lineáris algebra" },
      examParts: { "1. Prüfungsteil": "1. vizsgarész", "2. Prüfungsteil": "2. vizsgarész" },
      taskTypes: { Pflichtaufgabe: "Kötelező feladat", Wahlpflichtaufgabe: "Választható kötelező feladat", Prüfungsaufgabe: "Vizsgafeladat" },
      toolTypes: { hilfsmittelfrei: "segédeszköz nélkül", "mit Hilfsmitteln": "segédeszközzel", Bestandsformat: "korábbi formátum" },
    },
    en: {
      variantA: "Variant A · Most likely",
      variantB: "Variant B · Conservative",
      variantC: "Variant C · Tool-sensitive",
      rationale: (level) => `Weighted by ${level || "GK/LK"}, official NRW structure and topic frequency.`,
      topics: { Analysis: "Analysis", Stochastik: "Probability", "Vektorielle Geometrie": "Vector geometry", "Lineare Algebra": "Linear algebra" },
      examParts: { "1. Prüfungsteil": "Part 1", "2. Prüfungsteil": "Part 2" },
      taskTypes: { Pflichtaufgabe: "Mandatory task", Wahlpflichtaufgabe: "Elective mandatory task", Prüfungsaufgabe: "Exam task" },
      toolTypes: { hilfsmittelfrei: "without tools", "mit Hilfsmitteln": "with tools", Bestandsformat: "legacy format" },
    },
    es: {
      variantA: "Variante A · Más probable",
      variantB: "Variante B · Conservadora",
      variantC: "Variante C · Sensible a herramientas",
      rationale: (level) => `Ponderado por ${level || "GK/LK"}, estructura oficial de NRW y frecuencia temática.`,
      topics: { Analysis: "Análisis", Stochastik: "Probabilidad", "Vektorielle Geometrie": "Geometría vectorial", "Lineare Algebra": "Álgebra lineal" },
      examParts: { "1. Prüfungsteil": "Parte 1", "2. Prüfungsteil": "Parte 2" },
      taskTypes: { Pflichtaufgabe: "Tarea obligatoria", Wahlpflichtaufgabe: "Tarea optativa obligatoria", Prüfungsaufgabe: "Tarea de examen" },
      toolTypes: { hilfsmittelfrei: "sin herramientas", "mit Hilfsmitteln": "con herramientas", Bestandsformat: "formato anterior" },
    },
  };

  function getCopy(langCode = "de") {
    return COPY[langCode] || COPY.de;
  }

  function localizeValue(kind, value, copy) {
    if (!value) return "";
    return (copy[kind] || {})[value] || value;
  }

  function flattenBlocks(index) {
    if (!index || !index.levels) return [];
    return index.levels.flatMap((level) => level.topics.flatMap((topic) => topic.blocks));
  }

  function scoreBlock(block, options, topicWeights) {
    let score = 0;
    if (options.level && block.level === options.level) score += 8;
    if (options.year && block.year === options.year) score += 7;
    if (block.year === "ab-2026") score += 5;
    if (block.year === "2025-Beispiel") score += 4;
    if (block.examPart === "1. Prüfungsteil") score += 3;
    if (block.examPart === "2. Prüfungsteil") score += 4;
    if (block.taskType === "Pflichtaufgabe") score += 2;
    if (block.taskType === "Wahlpflichtaufgabe") score += 2;
    if (block.taskType === "Prüfungsaufgabe") score += 3;
    if (block.toolType === "mit Hilfsmitteln") score += 1;
    if (block.toolType === "hilfsmittelfrei") score += 1;
    score += topicWeights.get(block.topic) || 0;
    score += Math.min(block.points || 0, 6) * 0.2;
    return score;
  }

  function buildTopicWeights(blocks) {
    const counts = new Map();
    blocks.forEach((block) => counts.set(block.topic, (counts.get(block.topic) || 0) + 1));
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0) || 1;
    const weights = new Map();
    counts.forEach((count, topic) => {
      weights.set(topic, Number(((count / total) * 10).toFixed(2)));
    });
    return weights;
  }

  function pickDistinct(blocks, amount, seen) {
    const selected = [];
    blocks.forEach((block) => {
      if (selected.length >= amount) return;
      if (seen.has(block.id)) return;
      selected.push(block);
      seen.add(block.id);
    });
    return selected;
  }

  function buildVariant(label, seed, ranked, copy) {
    const seen = new Set();
    const rotated = ranked.slice(seed).concat(ranked.slice(0, seed));
    const exam1 = pickDistinct(rotated.filter((block) => block.examPart === "1. Prüfungsteil"), 2, seen);
    const exam2 = pickDistinct(rotated.filter((block) => block.examPart === "2. Prüfungsteil"), 3, seen);
    const blocks = exam1.concat(exam2).slice(0, 5);
    const score = blocks.reduce((sum, block) => sum + block._forecastScore, 0);
    return {
      id: "variant-" + (seed + 1),
      label,
      level: blocks[0] ? blocks[0].level : "",
      year: blocks[0] ? blocks[0].year : "",
      score: Number(score.toFixed(1)),
      rationale: copy.rationale(blocks[0] ? blocks[0].level : "GK/LK"),
      blocks: blocks.map((block) => ({
        id: block.id,
        label: block.displayLabel || block.label,
        level: block.level,
        topic: localizeValue("topics", block.topic, copy),
        year: block.year,
        examPart: localizeValue("examParts", block.examPart, copy),
        taskType: localizeValue("taskTypes", block.taskType, copy),
        toolType: localizeValue("toolTypes", block.toolType, copy),
        taskIndexes: Array.isArray(block.taskIndexes) ? block.taskIndexes.slice() : [],
        representativeIndex: Number.isFinite(block.representativeIndex) ? block.representativeIndex : null,
      })),
    };
  }

  function buildForecastVariants(index, options = {}) {
    const allBlocks = flattenBlocks(index);
    const filtered = allBlocks.filter((block) => (!options.level || block.level === options.level));
    const topicWeights = buildTopicWeights(filtered);
    const copy = getCopy(options.lang || "de");
    const ranked = filtered
      .map((block) => ({ ...block, _forecastScore: scoreBlock(block, options, topicWeights) }))
      .sort((left, right) => right._forecastScore - left._forecastScore);
    return [
      buildVariant(copy.variantA, 0, ranked, copy),
      buildVariant(copy.variantB, 1, ranked, copy),
      buildVariant(copy.variantC, 2, ranked, copy),
    ].filter((variant) => variant.blocks.length);
  }

  const api = {
    buildForecastVariants,
    getForecastCopy: getCopy,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaForecast = api;
})(typeof window !== "undefined" ? window : globalThis);
