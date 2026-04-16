const { screen } = require("@testing-library/dom");
const {
  buildTaskMetaBits,
  buildTaskNoticeMessages,
  createFigurePanel,
  createNoticeElement,
  renderTaskNoticeMessages,
} = require("../ui-helpers.js");
const { buildToolModeHint } = require("../tool-mode.js");

describe("ui helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("builds user-visible task meta bits with operator and tool mode", () => {
    const bits = buildTaskMetaBits({
      topic: "Analysis",
      source: { level: "GK", year: "ab-2026" },
      examPart: "2. Prüfungsteil",
      taskType: "Prüfungsaufgabe",
      toolType: "mit Hilfsmitteln",
      primaryOperator: "begruenden",
      toolMode: "supported",
    });

    expect(bits).toContain("Operator: begruenden");
    expect(bits).toContain("Werkzeugmodus: supported");
  });

  it("renders visible notices for tool mode and figures", () => {
    const notices = buildTaskNoticeMessages(
      {
        toolMode: "cas",
        figureRequired: true,
        figureLabel: "Abbildung 1",
        figureStatus: "referenced",
        topic: "Vektorielle Geometrie",
        examPart: "1. Prüfungsteil",
        taskType: "Wahlpflichtaufgabe",
        source: { level: "LK", year: "2025-Beispiel" },
      },
      { buildToolModeHint }
    );

    renderTaskNoticeMessages(document.getElementById("root"), notices);

    expect(screen.getByText(/CAS\/MMS:/)).toBeInTheDocument();
    expect(screen.getByText(/Abbildung 1 erforderlich/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Original-PDF/ })).toHaveAttribute(
      "href",
      expect.stringContaining("Mathematik_LK_2025-Beispiel_1_Prüfungsteil_LK_Wahlpflichtaufgabe_bis_2025.pdf")
    );
  });

  it("renders a redraw status badge when a validated redraw is available", () => {
    const panel = createFigurePanel(document, {
      figureRequired: true,
      figureLabel: "Abbildung 1",
      redrawState: { status: "validated", engine: "analysis", model: { kind: "analysis-redraw" } },
    });

    expect(panel.querySelector(".pdf-panel-head")).toBeTruthy();
    expect(panel.textContent).toMatch(/Redraw validiert/);
  });
});
