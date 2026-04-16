const {
  findFigureAnchor,
  deriveFigureCropBox,
} = require("../pdf-figure.js");

describe("pdf figure helpers", () => {
  it("finds the figure anchor from pdf text items", () => {
    const anchor = findFigureAnchor([
      { str: "Aufgabe 1", transform: [1, 0, 0, 1, 40, 600], width: 80, height: 12 },
      { str: "Abbildung 3", transform: [1, 0, 0, 1, 280, 140], width: 60, height: 10 },
    ], "Abbildung 3");

    expect(anchor).toMatchObject({ str: "Abbildung 3", x: 280, y: 140 });
  });

  it("builds a bounded crop box around the figure anchor", () => {
    const crop = deriveFigureCropBox({
      pageWidth: 595,
      pageHeight: 842,
      anchor: { x: 280, y: 140, width: 60, height: 10 },
      topic: "Analysis",
    });

    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.width).toBeGreaterThan(100);
    expect(crop.height).toBeGreaterThan(100);
    expect(crop.x + crop.width).toBeLessThanOrEqual(595);
    expect(crop.y + crop.height).toBeLessThanOrEqual(842);
  });

  it("returns null without enough geometry for a crop box", () => {
    expect(deriveFigureCropBox({ pageWidth: 0, pageHeight: 842, anchor: null, topic: "Analysis" })).toBeNull();
  });
});
