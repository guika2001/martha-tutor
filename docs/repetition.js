(function (root) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const REVIEW_INTERVALS = [1, 3, 7, 14].map((days) => days * DAY_MS);

  function getNextRepetitionDueAt(bucket = {}) {
    if (bucket.open > 0) return bucket.lastFailureAt || 0;
    if (!bucket.lastSuccessAt) return 0;
    const interval = REVIEW_INTERVALS[Math.max(0, Math.min(REVIEW_INTERVALS.length - 1, (bucket.recovered || 1) - 1))];
    return bucket.lastSuccessAt + interval;
  }

  function buildRepetitionQueue({ now = Date.now(), errorProfile = {} }) {
    const queue = [];

    Object.entries(errorProfile.topic || {}).forEach(([topic, bucket]) => {
      const dueAt = getNextRepetitionDueAt(bucket);
      const reason = bucket.open > 0 ? "open-error" : dueAt <= now ? "spaced-review" : null;
      if (!reason) return;

      queue.push({
        topic,
        dueAt,
        reason,
        open: bucket.open || 0,
        recovered: bucket.recovered || 0,
        lastFailureAt: bucket.lastFailureAt || null,
      });
    });

    return queue.sort((left, right) => {
      if (left.reason !== right.reason) return left.reason === "open-error" ? -1 : 1;
      if ((right.open || 0) !== (left.open || 0)) return (right.open || 0) - (left.open || 0);
      return (left.dueAt || 0) - (right.dueAt || 0);
    });
  }

  const api = { buildRepetitionQueue, getNextRepetitionDueAt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaRepetition = api;
})(typeof window !== "undefined" ? window : globalThis);
