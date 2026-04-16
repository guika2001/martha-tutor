const {
  buildTeacherSystemPrompt,
  buildDraftPrompt,
  buildRepairPrompt,
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
});
