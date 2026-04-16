(function (root) {
  function pickWeakest(readinessBucket = {}, errorBucket = {}) {
    return Object.keys(readinessBucket)
      .sort((left, right) => {
        const leftScore = (readinessBucket[left]?.successRate ?? 1) - ((errorBucket[left]?.open ?? 0) * 0.1);
        const rightScore = (readinessBucket[right]?.successRate ?? 1) - ((errorBucket[right]?.open ?? 0) * 0.1);
        return leftScore - rightScore;
      })[0] || null;
  }

  function buildStudyPlan({ readiness, errorProfile }) {
    const weakestTopic = pickWeakest(readiness?.topics, errorProfile?.topic);
    const weakestOperator = pickWeakest(readiness?.operators, errorProfile?.operator);

    return {
      sessions: [
        {
          type: "practice",
          focus: { topic: weakestTopic, operator: weakestOperator },
        },
        {
          type: "repetition",
          focus: { topic: weakestTopic },
        },
        {
          type: "simulation",
          focus: { topic: weakestTopic },
        },
      ],
    };
  }

  const api = { buildStudyPlan };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaStudyPlan = api;
})(typeof window !== "undefined" ? window : globalThis);
