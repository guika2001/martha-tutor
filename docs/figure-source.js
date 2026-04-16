(function (root) {
  const PDF_FILES = [
    "Mathematik_GK_2025-Beispiel_1_Prüfungsteil_GK_Wahlpflichtaufgaben_bis_2025.pdf",
    "Mathematik_GK_2025-Beispiel_2_Prüfungsteil_GK_Analysis_2025.pdf",
    "Mathematik_GK_2025-Beispiel_2_Prüfungsteil_GK_Stochastik_2025.pdf",
    "Mathematik_GK_2025_GK_Vektorielle_Geometrie_GTR_2025.pdf",
    "Mathematik_GK_ab-2026_GK_Analysis_B1_CAS-MMS.pdf",
    "Mathematik_GK_ab-2026_GK_Analysis_B2_CAS-MMS.pdf",
    "Mathematik_GK_ab-2026_GK_Analysis_B2_einfacher_WTR.pdf",
    "Mathematik_GK_ab-2026_GK_Pflichtaufgaben_ab_2026_neuer_KLP.pdf",
    "Mathematik_GK_ab-2026_GK_Stochastik_B4_CAS-MMS.pdf",
    "Mathematik_GK_ab-2026_GK_Stochastik_B4_einfacher_WTR.pdf",
    "Mathematik_GK_ab-2026_GK_Vektorielle_Geometrie_B3_CAS-MMS.pdf",
    "Mathematik_GK_ab-2026_GK_Vektorielle_Geometrie_B3_einfacher_WTR.pdf",
    "Mathematik_GK_ab-2026_GK_Wahlpflichtaufgaben_ab_2026_neuer_KLP.pdf",
    "Mathematik_GK_bis-2025_GK_Pflichtaufgaben_bis_2025.pdf",
    "Mathematik_LK_2025-Beispiel_1_Prüfungsteil_LK_Wahlpflichtaufgabe_bis_2025.pdf",
    "Mathematik_LK_2025-Beispiel_2_Prüfungsteil_LK_Analysis_2025.pdf",
    "Mathematik_LK_2025-Beispiel_2_Prüfungsteil_LK_Analysis_WBK_2025.pdf",
    "Mathematik_LK_2025_LK_Stochastik_GTR_2025.pdf",
    "Mathematik_LK_2025_LK_Vektorielle_Geometrie_GTR_2025.pdf",
    "Mathematik_LK_ab-2026_LK_Analysis_B1_CAS-MMS.pdf",
    "Mathematik_LK_ab-2026_LK_Analysis_B2_CAS-MMS.pdf",
    "Mathematik_LK_ab-2026_LK_Analysis_B2_einfacher_WTR.pdf",
    "Mathematik_LK_ab-2026_LK_Pflichtaufgaben_ab_2026_neuer_KLP.pdf",
    "Mathematik_LK_ab-2026_LK_Stochastik_B4_CAS-MMS.pdf",
    "Mathematik_LK_ab-2026_LK_Stochastik_B4_einfacher_WTR.pdf",
    "Mathematik_LK_ab-2026_LK_Vektorielle_Geometrie_B3_CAS-MMS.pdf",
    "Mathematik_LK_ab-2026_LK_Vektorielle_Geometrie_B3_einfacher_WTR.pdf",
    "Mathematik_LK_ab-2026_LK_Wahlpflichtaufgaben_ab_2026_neuer_KLP.pdf",
    "Mathematik_LK_bis-2025_LK_Pflichtaufgaben_bis_2025.pdf",
  ];

  function parsePdfMeta(file) {
    const lower = file.toLowerCase();
    const level = file.includes("_GK_") ? "GK" : file.includes("_LK_") ? "LK" : "";
    const year = file.includes("_2025-Beispiel_")
      ? "2025-Beispiel"
      : file.includes("_ab-2026_")
        ? "ab-2026"
        : file.includes("_bis-2025_")
          ? "bis-2025"
          : file.includes("_2025_")
            ? "2025"
            : "";
    const examPart = file.includes("1_Prüfungsteil")
      ? "1. Prüfungsteil"
      : file.includes("2_Prüfungsteil")
        ? "2. Prüfungsteil"
        : file.includes("Pflichtaufgaben")
          ? "1. Prüfungsteil"
          : "";
    const taskType = lower.includes("wahlpflicht")
      ? "Wahlpflichtaufgabe"
      : lower.includes("pflichtaufgaben")
        ? "Pflichtaufgabe"
        : examPart === "2. Prüfungsteil"
          ? "Prüfungsaufgabe"
          : "";
    const topic = file.includes("Vektorielle_Geometrie")
      ? "Vektorielle Geometrie"
      : file.includes("Stochastik")
        ? "Stochastik"
        : file.includes("Analysis")
          ? "Analysis"
          : "";
    const toolMode = lower.includes("cas-mms")
      ? "cas"
      : lower.includes("wtr") || lower.includes("gtr") || lower.includes("wbk")
        ? "wtr"
        : "";
    return { file, level, year, examPart, taskType, topic, toolMode };
  }

  const PDF_CATALOG = PDF_FILES.map(parsePdfMeta);

  function buildPdfHref(file) {
    const loc = root && root.location ? root.location : { host: "", pathname: "" };
    const host = String(loc.host || "");
    const path = String(loc.pathname || "");
    if (host.includes("github.io")) return "pdfs/" + file;
    if (/\/docs(?:\/|$)/.test(path)) return "pdfs/" + file;
    return "docs/pdfs/" + file;
  }

  function scoreMatch(task, candidate) {
    let score = 0;
    if (task.source && task.source.level === candidate.level) score += 4;
    if (task.source && task.source.year === candidate.year) score += 4;
    if (task.examPart && task.examPart === candidate.examPart) score += 3;
    if (task.taskType && task.taskType === candidate.taskType) score += 3;
    if (task.topic && task.topic === candidate.topic) score += 3;
    if (task.toolMode && candidate.toolMode && task.toolMode === candidate.toolMode) score += 2;
    if (candidate.toolMode) score += 1;
    return score;
  }

  function isCandidateMatch(task, candidate) {
    if (!task || !task.figureRequired) return false;
    if (task.source && task.source.level && candidate.level && task.source.level !== candidate.level) return false;
    if (task.source && task.source.year && candidate.year && task.source.year !== candidate.year) return false;
    if (task.examPart && candidate.examPart && task.examPart !== candidate.examPart) return false;
    if (task.taskType && candidate.taskType && task.taskType !== candidate.taskType) return false;
    if (task.topic && candidate.topic && task.topic !== candidate.topic) return false;
    if (task.toolMode && !["supported", null, ""].includes(task.toolMode) && candidate.toolMode && task.toolMode !== candidate.toolMode) return false;
    return true;
  }

  function labelForCandidate(candidate, multiple) {
    if (!multiple) return "Original-PDF";
    if (candidate.toolMode === "cas") return "CAS/MMS PDF";
    if (candidate.toolMode === "wtr") return "WTR/GTR PDF";
    return "Original-PDF";
  }

  function validateFigurePdfSource(task, candidate) {
    const checks = [];
    if (task && task.source && task.source.level && task.source.level === candidate.level) checks.push("level");
    if (task && task.source && task.source.year && task.source.year === candidate.year) checks.push("year");
    if (task && task.examPart && task.examPart === candidate.examPart) checks.push("examPart");
    if (task && task.taskType && task.taskType === candidate.taskType) checks.push("taskType");
    if (task && task.topic && task.topic === candidate.topic) checks.push("topic");
    if (task && task.toolMode && !["supported", null, ""].includes(task.toolMode) && task.toolMode === candidate.toolMode) checks.push("toolMode");
    const strictChecks = [
      candidate.level ? "level" : null,
      candidate.year ? "year" : null,
      candidate.examPart ? "examPart" : null,
      candidate.taskType ? "taskType" : null,
      candidate.topic ? "topic" : null,
    ].filter(Boolean);
    const strictPass = strictChecks.every((key) => checks.includes(key));
    return {
      valid: strictPass,
      matchedFields: checks,
      confidence: strictPass ? (checks.length >= 6 ? "high" : "medium") : "low",
    };
  }

  function resolveFigurePdfSources(task) {
    if (!task || !task.figureRequired) return [];
    const matches = PDF_CATALOG
      .filter((candidate) => isCandidateMatch(task, candidate))
      .sort((left, right) => scoreMatch(task, right) - scoreMatch(task, left));
    if (!matches.length) return [];
    const topScore = scoreMatch(task, matches[0]);
    const narrowed = matches.filter((candidate) => scoreMatch(task, candidate) === topScore);
    return narrowed.map((candidate) => ({
      href: buildPdfHref(candidate.file),
      label: labelForCandidate(candidate, narrowed.length > 1),
      file: candidate.file,
      validation: validateFigurePdfSource(task, candidate),
    }));
  }

  const api = {
    buildPdfHref,
    parsePdfMeta,
    resolveFigurePdfSources,
    validateFigurePdfSource,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaFigureSources = api;
})(typeof window !== "undefined" ? window : globalThis);
