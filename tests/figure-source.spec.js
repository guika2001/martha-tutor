const { resolveFigurePdfSources } = require("../figure-source.js");

describe("figure pdf sources", () => {
  it("matches LK 2025 example 1. pruefungsteil wahlpflicht figures to the source pdf", () => {
    const sources = resolveFigurePdfSources({
      figureRequired: true,
      topic: "Vektorielle Geometrie",
      examPart: "1. Prüfungsteil",
      taskType: "Wahlpflichtaufgabe",
      source: { level: "LK", year: "2025-Beispiel" },
      toolMode: "none",
    });

    expect(sources).toHaveLength(1);
    expect(sources[0].validation.valid).toBe(true);
    expect(sources[0].href).toContain("Mathematik_LK_2025-Beispiel_1_Prüfungsteil_LK_Wahlpflichtaufgabe_bis_2025.pdf");
  });

  it("returns both 2026 tool variants when the exact tool mode is not fixed", () => {
    const sources = resolveFigurePdfSources({
      figureRequired: true,
      topic: "Vektorielle Geometrie",
      examPart: "2. Prüfungsteil",
      taskType: "Prüfungsaufgabe",
      source: { level: "LK", year: "ab-2026" },
      toolMode: "supported",
    });

    expect(sources).toHaveLength(2);
    expect(sources.map((item) => item.label)).toEqual(expect.arrayContaining(["CAS/MMS PDF", "WTR/GTR PDF"]));
  });
});
