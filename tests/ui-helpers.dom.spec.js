const { screen } = require("@testing-library/dom");
const {
  buildTaskMetaBits,
  buildTaskNoticeMessages,
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
        question: "Der Graph ist in Abbildung 1 dargestellt.",
        figureRequired: true,
        figureLabel: "Abbildung 1",
        figureStatus: "referenced",
      },
      { buildToolModeHint }
    );

    renderTaskNoticeMessages(document.getElementById("root"), notices);

    expect(screen.getByText(/CAS\/MMS:/)).toBeInTheDocument();
    expect(screen.getByText(/Abbildung 1 erforderlich/)).toBeInTheDocument();
    expect(screen.getByText(/Originalabbildung in der Quelle öffnen/)).toBeInTheDocument();
  });
});
