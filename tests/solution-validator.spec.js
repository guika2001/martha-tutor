const {
  buildValidationPrompt,
  getValidatorSystemPrompt,
  parseValidationResult,
} = require("../solution-validator.js");

describe("solution validator", () => {
  it("parses json wrapped in markdown fences", () => {
    const parsed = parseValidationResult('```json\n{"valid":true,"confidence":0.92,"issues":[],"corrected_answer":""}\n```');

    expect(parsed.valid).toBe(true);
    expect(parsed.confidence).toBe(0.92);
  });

  it("falls back safely for malformed validator output", () => {
    const parsed = parseValidationResult("not-json");

    expect(parsed.valid).toBe(false);
    expect(parsed.issues[0].code).toBe("validator-parse-failed");
  });

  it("builds a prompt that includes task context and the draft", () => {
    const prompt = buildValidationPrompt({
      taskContext: "AUFGABENTEXT: Test",
      draft: "Hier ist eine Lösung.",
    });

    expect(getValidatorSystemPrompt()).toContain("JSON");
    expect(prompt).toContain("AUFGABENTEXT: Test");
    expect(prompt).toContain("Hier ist eine Lösung.");
  });
});
