(function (root) {
  function cleanText(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
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

  function deriveFunctionSnippet(text) {
    const match = stripTaskLeadIn(text).match(/([fgh]\s*\(\s*x\s*\)\s*=\s*[^.\n,;]{3,80})/i);
    return match ? match[1].replace(/\s+/g, " ").trim() : "";
  }

  function buildBlockDisplayLabel(tasks, fallback) {
    const firstQuestion = tasks.length ? stripTaskLeadIn(tasks[0].question || "") : "";
    const functionSnippet = deriveFunctionSnippet(firstQuestion);
    if (functionSnippet) return functionSnippet;
    const firstSentence = shortenSentence(firstQuestion, 78);
    return firstSentence || fallback;
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

    tasks.forEach((task, taskIndex) => {
      const level = cleanText(task.source && task.source.level, "Ohne Stufe");
      const year = cleanText(task.source && task.source.year, "Ohne Jahr");
      const topic = cleanText(task.topic, "Sonstige");
      const blockKey = deriveTaskBlockKey(task);

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

      const blockId = [level, year, topic, blockKey].join("::");
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
        });
        topicNode.blocks.push(topicNode.blockMap.get(blockId));
      }

      const block = topicNode.blockMap.get(blockId);
      block.taskIndexes.push(taskIndex);
      block.tasks.push(task);
      block.points += Number(task.points || 0);
      if (block.taskIndexes.length === 1) block.representativeIndex = taskIndex;
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

  function getVisibleItems(index, path) {
    const levels = index && index.levels ? index.levels : [];
    const level = levels.find((item) => item.id === path.level) || null;
    if (!level) {
      return { kind: "level", title: "Stufe wählen", items: levels };
    }

    if (!path.topic) {
      const topics = level.topics
        .map((topic) => ({
          id: topic.id,
          label: topic.label,
          blocks: topic.blocks,
          count: path.year ? (topic.yearCounts.get(path.year) || 0) : topic.count,
          yearCounts: topic.yearCounts,
        }))
        .filter((topic) => topic.count > 0);
      return {
        kind: "topic",
        title: level.label,
        items: topics,
        level,
        filters: { years: getYearFilters(level, null), selectedYear: path.year || "" },
      };
    }

    const topic = level.topics.find((item) => item.id === path.topic) || null;
    if (!topic) {
      return {
        kind: "topic",
        title: level.label,
        items: level.topics,
        level,
        filters: { years: getYearFilters(level, null), selectedYear: path.year || "" },
      };
    }

    const blocks = topic.blocks.filter((block) => !path.year || block.year === path.year);
    return {
      kind: "block",
      title: topic.label,
      items: blocks,
      level,
      topic,
      filters: { years: getYearFilters(level, topic), selectedYear: path.year || "" },
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
    return {
      task_id: block.displayLabel || block.label,
      topic: block.topic,
      subtopic: block.label,
      source: { level: block.level, year: block.year, subject: "Mathematik" },
      points: block.points || null,
      question,
      expected_answer: expected,
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
