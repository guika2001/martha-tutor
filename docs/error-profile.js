(function (root) {
  function ensureBucket(container, key) {
    if (!key) return null;
    container[key] ||= {
      attempts: 0,
      open: 0,
      recovered: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
    };
    return container[key];
  }

  function applyEvent(container, key, event) {
    const bucket = ensureBucket(container, key);
    if (!bucket) return;
    bucket.attempts += 1;
    if (event.success) {
      if (bucket.open > 0) {
        bucket.open -= 1;
        bucket.recovered += 1;
      }
      bucket.lastSuccessAt = event.timestamp || null;
      return;
    }
    bucket.open += 1;
    bucket.lastFailureAt = event.timestamp || null;
  }

  function buildErrorProfile(events) {
    const profile = { topic: {}, operator: {}, toolMode: {}, examPart: {} };

    for (const event of events || []) {
      applyEvent(profile.topic, event.topic, event);
      applyEvent(profile.operator, event.operator, event);
      applyEvent(profile.toolMode, event.toolMode, event);
      applyEvent(profile.examPart, event.examPart, event);
    }

    return profile;
  }

  function buildRecoverySummary(profile = {}, dimension = "topic") {
    let openTotal = 0;
    let recoveredTotal = 0;
    const bucketGroup = profile[dimension] || {};

    Object.values(bucketGroup).forEach((bucket) => {
      openTotal += bucket.open || 0;
      recoveredTotal += bucket.recovered || 0;
    });

    const recoveryRate = recoveredTotal + openTotal
      ? recoveredTotal / (recoveredTotal + openTotal)
      : 0;

    return { dimension, openTotal, recoveredTotal, recoveryRate };
  }

  const api = { buildErrorProfile, buildRecoverySummary };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaErrorProfile = api;
})(typeof window !== "undefined" ? window : globalThis);
