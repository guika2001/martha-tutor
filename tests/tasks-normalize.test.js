(function () {
  const sampleTasks = [
    { task_id: "Pflichtaufgabe 1a", topic: "Analysis", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Pflichtaufgabe 1b", topic: "Analysis", source: { level: "GK", year: "ab-2026" }, points: 3 },
    { task_id: "Pflichtaufgabe 2a", topic: "Analysis", source: { level: "GK", year: "ab-2026" }, points: 2 },
    { task_id: "Aufgabe a) (1)", topic: "Stochastik", source: { level: "LK", year: "2025-Beispiel" }, points: 2 },
    { task_id: "Aufgabe a) (2)", topic: "Stochastik", source: { level: "LK", year: "2025-Beispiel" }, points: 4 },
  ];

  const index = MarthaTaskNav.buildTaskIndex(sampleTasks);
  const blockView = MarthaTaskNav.getVisibleItems(index, { level: "LK", year: "2025-Beispiel", topic: "Stochastik" });

  const cases = [
    ["keeps GK and LK separate", index.levels.length, 2],
    ["groups numbered subparts into one block", blockView.items.length, 1],
    ["maps task index to block id", !!MarthaTaskNav.findBlockIdByTaskIndex(index, 4), true],
  ];

  function render(name, ok, detail) {
    const root = document.getElementById("results");
    const div = document.createElement("div");
    div.className = ok ? "ok" : "fail";
    div.textContent = (ok ? "PASS: " : "FAIL: ") + name;
    root.appendChild(div);
    if (!ok) {
      const pre = document.createElement("pre");
      pre.textContent = detail;
      root.appendChild(pre);
    }
  }

  cases.forEach(([name, actual, expected]) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    render(name, ok, "Expected: " + JSON.stringify(expected) + "\nActual: " + JSON.stringify(actual));
  });
})();
