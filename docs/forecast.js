(function (root) {
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

  function buildVariant(label, seed, ranked) {
    const seen = new Set();
    const rotated = ranked.slice(seed).concat(ranked.slice(0, seed));
    const exam1 = pickDistinct(rotated.filter((block) => block.examPart === "1. Prüfungsteil"), 2, seen);
    const exam2 = pickDistinct(rotated.filter((block) => block.examPart === "2. Prüfungsteil"), 3, seen);
    const blocks = exam1.concat(exam2).slice(0, 5);
    const score = blocks.reduce((sum, block) => sum + block._forecastScore, 0);
    return {
      id: "variant-" + (seed + 1),
      label,
      score: Number(score.toFixed(1)),
      rationale: `Gewichtet nach ${blocks[0] ? blocks[0].level : "GK/LK"}, offizieller NRW-Struktur und Themenhäufigkeit.`,
      blocks: blocks.map((block) => ({
        id: block.id,
        label: block.displayLabel || block.label,
        topic: block.topic,
        year: block.year,
        examPart: block.examPart,
        taskType: block.taskType,
        toolType: block.toolType,
      })),
    };
  }

  function buildForecastVariants(index, options = {}) {
    const allBlocks = flattenBlocks(index);
    const filtered = allBlocks.filter((block) => (!options.level || block.level === options.level));
    const topicWeights = buildTopicWeights(filtered);
    const ranked = filtered
      .map((block) => ({ ...block, _forecastScore: scoreBlock(block, options, topicWeights) }))
      .sort((left, right) => right._forecastScore - left._forecastScore);
    return [
      buildVariant("Variante A · Höchstwahrscheinlich", 0, ranked),
      buildVariant("Variante B · Konservativ", 1, ranked),
      buildVariant("Variante C · Werkzeugsensitiv", 2, ranked),
    ].filter((variant) => variant.blocks.length);
  }

  const api = {
    buildForecastVariants,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaForecast = api;
})(typeof window !== "undefined" ? window : globalThis);
