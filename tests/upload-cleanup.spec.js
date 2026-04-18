const { sanitizeExtractedTaskText } = require("../upload-cleanup.js");

describe("upload cleanup", () => {
  it("normalizes broken trig notation and OCR noise", () => {
    const cleaned = sanitizeExtractedTaskText(`
f ( x ) = kötözősaláta ⁡ ( x ) + 1
f ( x ) = cos ( x )​​+1
`);

    expect(cleaned).toContain("f(x) = cos(x) + 1");
    expect(cleaned).not.toContain("kötözősaláta");
    expect(cleaned).not.toContain("⁡");
  });

  it("adds paragraph breaks before subtask markers when text runs together", () => {
    const cleaned = sanitizeExtractedTaskText("y = 2b) Határozza meg az ábrán szürkével jelölt területet.");

    expect(cleaned).toContain("y = 2\n\nb)");
  });
});
