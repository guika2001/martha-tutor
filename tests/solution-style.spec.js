const {
  buildTeacherSystemPrompt,
  buildDraftPrompt,
  buildRepairPrompt,
  getResponseModeInstruction,
} = require("../solution-style.js");

describe("solution style localization", () => {
  it("builds a Hungarian teacher system prompt", () => {
    const prompt = buildTeacherSystemPrompt({ primaryOperator: "bizonyítsd" }, "hu");

    expect(prompt).toContain("matematikatanár");
    expect(prompt).toContain("bizonyítsd");
  });

  it("builds a Hungarian draft prompt", () => {
    const prompt = buildDraftPrompt({
      taskContext: "FELADAT",
      conversation: "DIÁK",
      latestUserMessage: "Magyarázd el",
      langCode: "hu",
    });

    expect(prompt).toContain("FELADATKONTEXTUS");
    expect(prompt).toContain("Magyarázd el");
  });

  it("builds a localized repair prompt", () => {
    const prompt = buildRepairPrompt({
      taskContext: "FELADAT",
      latestUserMessage: "Javítsd",
      draft: "Tervezet",
      issues: [{ code: "math", message: "hiba" }],
      langCode: "hu",
    });

    expect(prompt).toContain("JAVÍTANDÓ PONTOK");
    expect(prompt).toContain("hiba");
  });

  it("builds a strict first-step instruction", () => {
    expect(getResponseModeInstruction("step", "hu")).toContain("első érdemi lépést");
    expect(buildTeacherSystemPrompt({ primaryOperator: "számítsd ki" }, "hu", "step")).toContain("első érdemi lépést");
  });

  it("adds Hungarian glossary guidance for German terms and notation", () => {
    const prompt = buildTeacherSystemPrompt({ primaryOperator: "határozd meg" }, "hu", "solution");

    expect(prompt).toContain("német szakkifejezést");
    expect(prompt).toContain("Jelölések");
    expect(prompt).toContain("^");
  });
});
