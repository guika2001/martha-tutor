const { detectOperators, buildOperatorGuidance } = require("../operatoren.js");

describe("operatoren", () => {
  it("extracts the dominant operator from task text", () => {
    const taskText = "Begründen Sie, dass A nicht auf g liegt.";
    expect(detectOperators(taskText)).toEqual(["begruenden"]);
  });

  it("returns operator guidance for full-credit answers", () => {
    const guidance = buildOperatorGuidance("interpretieren");
    expect(guidance.answerShape).toContain("Kontext");
    expect(guidance.commonMistake).toContain("nur rechnen");
  });
});
