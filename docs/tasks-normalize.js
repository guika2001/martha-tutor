(function (root) {
  const operatorApi = typeof module !== "undefined" && module.exports
    ? require("./operatoren.js")
    : root && root.MarthaOperatoren
      ? root.MarthaOperatoren
      : null;
  const toolModeApi = typeof module !== "undefined" && module.exports
    ? require("./tool-mode.js")
    : root && root.MarthaToolMode
      ? root.MarthaToolMode
      : null;

  function detectOperators(text) {
    return operatorApi && typeof operatorApi.detectOperators === "function"
      ? operatorApi.detectOperators(text)
      : [];
  }

  function normalizeToolMode(value) {
    return toolModeApi && typeof toolModeApi.normalizeToolMode === "function"
      ? toolModeApi.normalizeToolMode(value)
      : null;
  }

  function cleanText(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function countTasks(blocks) {
    return blocks.reduce((sum, block) => sum + (block.taskIndexes ? block.taskIndexes.length : 0), 0);
  }

  function deriveTaskBlockKey(task) {
    const raw = cleanText(task.task_id, "Aufgabe");
    let label = raw.replace(/\s*-\s.*$/, "").trim();
    label = label.replace(/\s*\((?:i|ii|iii|iv|v|\d+)\)\s*$/i, "").trim();
    label = label.replace(/\s+Teil\s+[a-z0-9]+$/i, "").trim();
    if (!label) label = raw;
    return label;
  }

  function normalizeWhitespace(text) {
    return cleanText(text, "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  }

  function canonicalizeForGrouping(text) {
    const cleaned = normalizeWhitespace(stripTaskLeadIn(text));
    const core = cleaned.split(/\n\s*\n/)[0] || cleaned;
    return core
      .toLowerCase()
      .replace(/\$+/g, "")
      .replace(/\\[a-z]+/g, " ")
      .replace(/[{}[\]()|]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
  }

  function stripTaskLeadIn(text) {
    return normalizeWhitespace(text)
      .replace(/^L[öo]se folgende Aufgabe aus dem NRW Abitur[^\n:]*:\s*/i, "")
      .replace(/^Bearbeite folgende Aufgabe aus dem NRW Abitur[^\n:]*:\s*/i, "")
      .replace(/^Es gelten die Angaben aus dem NRW Abitur[^\n:]*:\s*/i, "")
      .trim();
  }

  function shortenSentence(text, maxLength) {
    const sentence = normalizeWhitespace(text).split(/(?<=[.!?])\s+/)[0] || "";
    if (sentence.length <= maxLength) return sentence;
    return sentence.slice(0, maxLength - 1).trimEnd() + "…";
  }

  function sanitizeTitleText(text) {
    return normalizeWhitespace(text)
      .replace(/\$+/g, "")
      .replace(/\\begin\{[^}]+\}.*?\\end\{[^}]+\}/g, " ")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
      .replace(/\\vec\{([^}]+)\}/g, "$1")
      .replace(/\\overrightarrow\{([^}]+)\}/g, "$1")
      .replace(/\\mathbb\{R\}/g, "R")
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function deriveFunctionSnippet(text) {
    const plain = sanitizeTitleText(stripTaskLeadIn(text));
    const match = plain.match(/([fgh]\s*\(\s*x\s*\)\s*=\s*[^.\n,;]{3,80})/i);
    return match ? match[1].replace(/\s+/g, " ").trim() : "";
  }

  function detectFigureMeta(text) {
    const plain = normalizeWhitespace(text || "");
    const lower = plain.toLowerCase();
    const labelMatch = plain.match(/\b(Abbildung\s+\d+)\b/i);
    const genericFigure = /\b(abbildung|grafik|skizze|histogramm|diagramm)\b/i.test(plain);
    if (!genericFigure && !labelMatch) {
      return {
        figureRequired: false,
        figureLabel: "",
        figureSource: "unknown",
        figureStatus: "present",
      };
    }
    return {
      figureRequired: true,
      figureLabel: labelMatch ? labelMatch[1] : (lower.includes("grafik") ? "Grafik" : lower.includes("skizze") ? "Skizze" : "Abbildung"),
      figureSource: "task",
      figureStatus: "missing",
    };
  }

  function buildBlockDisplayLabel(tasks, fallback) {
    const firstQuestion = tasks.length ? stripTaskLeadIn(tasks[0].question || "") : "";
    const functionSnippet = deriveFunctionSnippet(firstQuestion);
    if (functionSnippet) return functionSnippet;
    const firstSentence = shortenSentence(sanitizeTitleText(firstQuestion), 78);
    return firstSentence || fallback;
  }

  function deriveAssessmentMeta(task) {
    const rawId = cleanText(task.task_id, "");
    const year = cleanText(task.source && task.source.year, "");
    if (/^Pflichtaufgabe/i.test(rawId)) {
      return { examPart: "1. Prüfungsteil", taskType: "Pflichtaufgabe", toolType: "hilfsmittelfrei" };
    }
    if (/^Wahlpflichtaufgabe/i.test(rawId)) {
      return { examPart: "1. Prüfungsteil", taskType: "Wahlpflichtaufgabe", toolType: "hilfsmittelfrei" };
    }
    if (year === "ab-2026" || year === "2025-Beispiel") {
      return { examPart: "2. Prüfungsteil", taskType: "Prüfungsaufgabe", toolType: "mit Hilfsmitteln" };
    }
    return { examPart: "Bestandsformat", taskType: "Originalprüfung", toolType: "Bestandsformat" };
  }

  function formatTaskPartLabel(task, index) {
    const raw = cleanText(task.task_id, "");
    const parenNumber = raw.match(/\((\d+)\)\s*$/);
    if (parenNumber) return "Teil " + parenNumber[1];
    const trailingLetter = raw.match(/([a-z])\)?\s*$/i);
    if (trailingLetter) return "Teil " + trailingLetter[1].toLowerCase();
    return "Teil " + (index + 1);
  }

  function extractCommonLeadingLines(texts) {
    if (!texts.length) return { common: "", rests: texts };
    const lineGroups = texts.map((text) => normalizeWhitespace(text).split("\n").map((line) => line.trim()).filter(Boolean));
    const common = [];
    let cursor = 0;
    while (true) {
      const candidate = lineGroups[0][cursor];
      if (!candidate) break;
      if (!lineGroups.every((group) => group[cursor] === candidate)) break;
      common.push(candidate);
      cursor++;
    }
    if (!common.length) return { common: "", rests: texts };
    return {
      common: common.join("\n"),
      rests: lineGroups.map((group) => group.slice(cursor).join("\n").trim()),
    };
  }

  function buildCombinedText(tasks, field) {
    const rawTexts = tasks.map((task) => stripTaskLeadIn(task[field] || ""));
    const withSharedLead = field === "question" ? extractCommonLeadingLines(rawTexts) : { common: "", rests: rawTexts };
    const parts = tasks
      .map((task, index) => {
        const text = withSharedLead.rests[index] || rawTexts[index] || "";
        if (!text) return "";
        return formatTaskPartLabel(task, index) + "\n" + text;
      })
      .filter(Boolean);
    return [withSharedLead.common, parts.join("\n\n")].filter(Boolean).join("\n\n");
  }

  function buildTaskIndex(tasks) {
    const levels = [];
    const levelMap = new Map();
    const blockByTaskIndex = {};
    const variantByTaskIndex = new Map();
    const variantCounters = new Map();

    tasks.forEach((task, taskIndex) => {
      const level = cleanText(task.source && task.source.level, "Ohne Stufe");
      const year = cleanText(task.source && task.source.year, "Ohne Jahr");
      const topic = cleanText(task.topic, "Sonstige");
      const blockKey = deriveTaskBlockKey(task);
      const contentKey = canonicalizeForGrouping(task.question || "");
      const variantScope = [level, year, topic, blockKey].join("::");
      if (!variantCounters.has(variantScope)) variantCounters.set(variantScope, []);
      const known = variantCounters.get(variantScope);
      let variantIndex = known.findIndex((value) => value === contentKey);
      if (variantIndex === -1) {
        known.push(contentKey);
        variantIndex = known.length - 1;
      }
      variantByTaskIndex.set(taskIndex, variantIndex);
    });

    tasks.forEach((task, taskIndex) => {
      const level = cleanText(task.source && task.source.level, "Ohne Stufe");
      const year = cleanText(task.source && task.source.year, "Ohne Jahr");
      const topic = cleanText(task.topic, "Sonstige");
      const blockKey = deriveTaskBlockKey(task);
      const meta = deriveAssessmentMeta(task);
      const variantIndex = variantByTaskIndex.get(taskIndex) || 0;
      const variantScope = [level, year, topic, blockKey].join("::");
      const variantCount = (variantCounters.get(variantScope) || []).length;
      const variantLabel = variantCount > 1 ? "Variante " + String.fromCharCode(65 + variantIndex) : "";

      if (!levelMap.has(level)) {
        const levelNode = {
          id: level,
          label: level,
          topics: [],
          topicMap: new Map(),
          yearCounts: new Map(),
          count: 0,
        };
        levelMap.set(level, levelNode);
        levels.push(levelNode);
      }
      const levelNode = levelMap.get(level);
      levelNode.count++;
      levelNode.yearCounts.set(year, (levelNode.yearCounts.get(year) || 0) + 1);

      if (!levelNode.topicMap.has(topic)) {
        const topicNode = {
          id: topic,
          label: topic,
          blocks: [],
          blockMap: new Map(),
          count: 0,
          yearCounts: new Map(),
        };
        levelNode.topicMap.set(topic, topicNode);
        levelNode.topics.push(topicNode);
      }
      const topicNode = levelNode.topicMap.get(topic);
      topicNode.count++;
      topicNode.yearCounts.set(year, (topicNode.yearCounts.get(year) || 0) + 1);

      const blockId = [level, year, topic, blockKey, variantIndex].join("::");
      if (!topicNode.blockMap.has(blockId)) {
        topicNode.blockMap.set(blockId, {
          id: blockId,
          label: blockKey,
          level,
          year,
          topic,
          taskIndexes: [],
          tasks: [],
          points: 0,
          representativeIndex: taskIndex,
          displayLabel: "",
          examPart: meta.examPart,
          taskType: meta.taskType,
          toolType: meta.toolType,
          variantLabel,
        });
        topicNode.blocks.push(topicNode.blockMap.get(blockId));
      }

      const block = topicNode.blockMap.get(blockId);
      block.taskIndexes.push(taskIndex);
      block.tasks.push(task);
      block.points += Number(task.points || 0);
      if (block.taskIndexes.length === 1) block.representativeIndex = taskIndex;
      const figureMeta = detectFigureMeta(task.question || "");
      if (figureMeta.figureRequired) {
        block.figureRequired = true;
        block.figureLabel = block.figureLabel || figureMeta.figureLabel;
        block.figureSource = figureMeta.figureSource;
        block.figureStatus = "missing";
      }
      blockByTaskIndex[taskIndex] = blockId;
    });

    levels.forEach((levelNode) => {
      levelNode.topics.forEach((topicNode) => {
        topicNode.blocks.forEach((block) => {
          block.displayLabel = buildBlockDisplayLabel(block.tasks, block.label);
        });
      });
    });

    return { levels, blockByTaskIndex };
  }

  function getYearFilters(levelNode, topicNode) {
    const source = topicNode ? topicNode.yearCounts : levelNode ? levelNode.yearCounts : new Map();
    const years = Array.from(source.entries())
      .map(([id, count]) => ({ id, label: id, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "", label: "Alle Jahre", count: years.reduce((sum, item) => sum + item.count, 0) }].concat(years);
  }

  function matchesBlockFilters(block, path) {
    if (path.year && block.year !== path.year) return false;
    if (path.examPart && block.examPart !== path.examPart) return false;
    if (path.taskType && block.taskType !== path.taskType) return false;
    if (path.toolType && block.toolType !== path.toolType) return false;
    if (path.variantLabel && block.variantLabel !== path.variantLabel) return false;
    return true;
  }

  function buildOptionList(blocks, key, allLabel) {
    const counts = new Map();
    blocks.forEach((block) => {
      const value = block[key];
      counts.set(value, (counts.get(value) || 0) + block.taskIndexes.length);
    });
    const items = Array.from(counts.entries())
      .map(([id, count]) => ({ id, label: id, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "", label: allLabel, count: countTasks(blocks) }].concat(items);
  }

  function getVisibleItems(index, path) {
    const levels = index && index.levels ? index.levels : [];
    const level = levels.find((item) => item.id === path.level) || null;
    if (!level) {
      return { kind: "level", title: "Stufe wählen", items: levels };
    }

    const levelBlocks = level.topics.flatMap((topic) => topic.blocks);
    const scopedLevelBlocks = levelBlocks.filter((block) => matchesBlockFilters(block, {
      year: path.year,
      examPart: path.examPart,
      taskType: path.taskType,
      toolType: path.toolType,
    }));
    const filters = {
      years: getYearFilters(level, null),
      selectedYear: path.year || "",
      examParts: buildOptionList(levelBlocks.filter((block) => matchesBlockFilters(block, {
        year: path.year,
        taskType: path.taskType,
        toolType: path.toolType,
        variantLabel: path.variantLabel,
      })), "examPart", "Alle Prüfungsteile"),
      selectedExamPart: path.examPart || "",
      taskTypes: buildOptionList(levelBlocks.filter((block) => matchesBlockFilters(block, {
        year: path.year,
        examPart: path.examPart,
        toolType: path.toolType,
        variantLabel: path.variantLabel,
      })), "taskType", "Alle Aufgabentypen"),
      selectedTaskType: path.taskType || "",
      toolTypes: buildOptionList(levelBlocks.filter((block) => matchesBlockFilters(block, {
        year: path.year,
        examPart: path.examPart,
        taskType: path.taskType,
        variantLabel: path.variantLabel,
      })), "toolType", "Alle Werkzeuge"),
      selectedToolType: path.toolType || "",
      variants: buildOptionList(levelBlocks.filter((block) => matchesBlockFilters(block, {
        year: path.year,
        examPart: path.examPart,
        taskType: path.taskType,
        toolType: path.toolType,
      })), "variantLabel", "Alle Varianten").filter((item) => item.id),
      selectedVariant: path.variantLabel || "",
    };

    if (!path.topic) {
      const topics = level.topics
        .map((topic) => ({
          id: topic.id,
          label: topic.label,
          blocks: topic.blocks,
          count: countTasks(topic.blocks.filter((block) => matchesBlockFilters(block, path))),
          yearCounts: topic.yearCounts,
        }))
        .filter((topic) => topic.count > 0);
      return {
        kind: "topic",
        title: level.label,
        items: topics,
        level,
        filters,
      };
    }

    const topic = level.topics.find((item) => item.id === path.topic) || null;
    if (!topic) {
      return {
        kind: "topic",
        title: level.label,
        items: level.topics,
        level,
        filters,
      };
    }

    const blocks = topic.blocks.filter((block) => matchesBlockFilters(block, path));
    return {
      kind: "block",
      title: topic.label,
      items: blocks,
      level,
      topic,
      filters: {
        years: getYearFilters(level, topic),
        selectedYear: path.year || "",
        examParts: buildOptionList(topic.blocks.filter((block) => matchesBlockFilters(block, {
          year: path.year,
          taskType: path.taskType,
          toolType: path.toolType,
          variantLabel: path.variantLabel,
        })), "examPart", "Alle Prüfungsteile"),
        selectedExamPart: path.examPart || "",
        taskTypes: buildOptionList(topic.blocks.filter((block) => matchesBlockFilters(block, {
          year: path.year,
          examPart: path.examPart,
          toolType: path.toolType,
          variantLabel: path.variantLabel,
        })), "taskType", "Alle Aufgabentypen"),
        selectedTaskType: path.taskType || "",
        toolTypes: buildOptionList(topic.blocks.filter((block) => matchesBlockFilters(block, {
          year: path.year,
          examPart: path.examPart,
          taskType: path.taskType,
          variantLabel: path.variantLabel,
        })), "toolType", "Alle Werkzeuge"),
        selectedToolType: path.toolType || "",
        variants: buildOptionList(topic.blocks.filter((block) => matchesBlockFilters(block, {
          year: path.year,
          examPart: path.examPart,
          taskType: path.taskType,
          toolType: path.toolType,
        })), "variantLabel", "Alle Varianten").filter((item) => item.id),
        selectedVariant: path.variantLabel || "",
      },
    };
  }

  function findBlockIdByTaskIndex(index, taskIndex) {
    if (!index || !index.blockByTaskIndex) return "";
    return index.blockByTaskIndex[taskIndex] || "";
  }

  function buildCombinedTask(block) {
    const tasks = block && block.tasks ? block.tasks : [];
    const question = buildCombinedText(tasks, "question");
    const expected = buildCombinedText(tasks.filter((task) => task.expected_answer), "expected_answer");
    const operators = detectOperators(question + "\n" + expected);
    return {
      task_id: block.displayLabel || block.label,
      topic: block.topic,
      subtopic: block.label,
      source: { level: block.level, year: block.year, subject: "Mathematik" },
      points: block.points || null,
      question,
      expected_answer: expected,
      examPart: block.examPart,
      taskType: block.taskType,
      toolType: block.toolType,
      toolMode: normalizeToolMode(block.toolType),
      operators,
      primaryOperator: operators[0] || null,
      figureRequired: Boolean(block.figureRequired),
      figureLabel: block.figureLabel || "",
      figureSource: block.figureSource || "unknown",
      figureStatus: block.figureRequired ? (block.figureStatus || "missing") : "present",
      variantLabel: block.variantLabel,
      isSyntheticBlock: true,
    };
  }

  const api = {
    deriveTaskBlockKey,
    stripTaskLeadIn,
    buildTaskIndex,
    getVisibleItems,
    findBlockIdByTaskIndex,
    buildCombinedTask,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaTaskNav = api;
})(typeof window !== "undefined" ? window : globalThis);
