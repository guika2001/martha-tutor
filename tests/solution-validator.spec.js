const {
  buildValidationPrompt,
  getModeCheckLine,
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

  it("builds a localized Hungarian validator prompt", () => {
    const prompt = buildValidationPrompt({
      taskContext: "FELADAT",
      draft: "Megoldás",
      langCode: "hu",
    });

    expect(getValidatorSystemPrompt("hu")).toContain("validátor");
    expect(prompt).toContain("FELADATKONTEXTUS");
    expect(prompt).toContain("Megoldás");
  });

  it("adds explicit mode constraints for first-step validation", () => {
    expect(getModeCheckLine("step", "hu")).toContain("első lépés");
    expect(getValidatorSystemPrompt("hu", "step")).toContain("első lépés");
    expect(buildValidationPrompt({
      taskContext: "FELADAT",
      draft: "Megoldás",
      langCode: "hu",
      responseMode: "step",
    })).toContain("első lépés");
  });

  it("adds Hungarian readability checks for glossary and notation explanations", () => {
    const prompt = buildValidationPrompt({
      taskContext: "FELADAT",
      draft: "Megoldás",
      langCode: "hu",
      responseMode: "solution",
    });

    expect(getValidatorSystemPrompt("hu", "solution")).toContain("német szakkifejezések");
    expect(getValidatorSystemPrompt("hu", "solution")).toContain("Jelölések");
    expect(prompt).toContain("MEGOLDÁSTERVEZET");
  });
});
