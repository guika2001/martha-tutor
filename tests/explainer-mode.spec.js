const { buildExplainerTask } = require("../explainer-mode.js");

describe("explainer mode", () => {
  it("builds a Hungarian explainer task with task-free copy", () => {
    const task = buildExplainerTask("hu");

    expect(task.isExplainerMode).toBe(true);
    expect(task.task_id).toBe("Magyarázó");
    expect(task.subtopic).toContain("Általános matekkérdések");
    expect(task.explainerGreeting).toContain("konkrét feladat nélkül");
  });
});
