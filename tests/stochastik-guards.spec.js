const {
  extractBinomialParamsFromTask,
  verifyClaimedExpectation,
  verifyClaimedSigma,
  verifyProbabilityInterpretation,
} = require("../stochastik-guards.js");

describe("stochastik guards", () => {
  it("extracts binomial parameters from task text", () => {
    const params = extractBinomialParamsFromTask({
      question: "Es gilt X ~ B(20; 0,4). Bestimme den Erwartungswert.",
    });

    expect(params).toEqual({ n: 20, p: 0.4 });
  });

  it("accepts a correct expectation value", () => {
    const result = verifyClaimedExpectation({
      params: { n: 20, p: 0.4 },
      draft: "Der Erwartungswert beträgt 8.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect expectation value", () => {
    const result = verifyClaimedExpectation({
      params: { n: 20, p: 0.4 },
      draft: "Der Erwartungswert beträgt 10.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("expectation-check-failed");
  });

  it("accepts a correct sigma value", () => {
    const result = verifyClaimedSigma({
      params: { n: 20, p: 0.4 },
      draft: "Die Standardabweichung ist ungefähr 2.19.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect sigma value", () => {
    const result = verifyClaimedSigma({
      params: { n: 20, p: 0.4 },
      draft: "Die Standardabweichung ist 5.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("sigma-check-failed");
  });

  it("rejects impossible interpretation claims", () => {
    const result = verifyProbabilityInterpretation("Die Wahrscheinlichkeit ist sicher größer als 1.");

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("probability-interpretation-failed");
  });
});
