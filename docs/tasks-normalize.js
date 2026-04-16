(function (root) {
  function cleanText(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function deriveTaskBlockLabel(task) {
    const raw = cleanText(task.task_id, "Aufgabe");
    let label = raw.replace(/\s*-\s.*$/, "").trim();
    label = label.replace(/\s*\((?:i|ii|iii|iv|v|\d+)\)\s*$/i, "").trim();
    label = label.replace(/\s+Teil\s+[a-z0-9]+$/i, "").trim();
    if (!label) label = raw;
    return label;
  }

  function buildTaskIndex(tasks) {
    const levels = [];
    const levelMap = new Map();
    const blockByTaskIndex = {};

    tasks.forEach((task, taskIndex) => {
      const level = cleanText(task.source && task.source.level, "Ohne Stufe");
      const year = cleanText(task.source && task.source.year, "Ohne Jahr");
      const topic = cleanText(task.topic, "Sonstige");
      const blockLabel = deriveTaskBlockLabel(task);

      if (!levelMap.has(level)) {
        const levelNode = { id: level, label: level, years: [], yearMap: new Map(), count: 0 };
        levelMap.set(level, levelNode);
        levels.push(levelNode);
      }
      const levelNode = levelMap.get(level);
      levelNode.count++;

      if (!levelNode.yearMap.has(year)) {
        const yearNode = { id: year, label: year, topics: [], topicMap: new Map(), count: 0 };
        levelNode.yearMap.set(year, yearNode);
        levelNode.years.push(yearNode);
      }
      const yearNode = levelNode.yearMap.get(year);
      yearNode.count++;

      if (!yearNode.topicMap.has(topic)) {
        const topicNode = { id: topic, label: topic, blocks: [], blockMap: new Map(), count: 0 };
        yearNode.topicMap.set(topic, topicNode);
        yearNode.topics.push(topicNode);
      }
      const topicNode = yearNode.topicMap.get(topic);
      topicNode.count++;

      const blockId = [level, year, topic, blockLabel].join("::");
      if (!topicNode.blockMap.has(blockId)) {
        topicNode.blockMap.set(blockId, {
          id: blockId,
          label: blockLabel,
          level,
          year,
          topic,
          taskIndexes: [],
          tasks: [],
          points: 0,
          representativeIndex: taskIndex,
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

    return { levels, blockByTaskIndex };
  }

  function getVisibleItems(index, path) {
    const levels = index && index.levels ? index.levels : [];
    const level = levels.find((item) => item.id === path.level) || null;
    if (!level) {
      return { kind: "level", title: "Stufe wählen", items: levels };
    }
    if (!path.year) {
      return { kind: "year", title: level.label, items: level.years, level };
    }
    const year = level.years.find((item) => item.id === path.year) || null;
    if (!year) {
      return { kind: "year", title: level.label, items: level.years, level };
    }
    if (!path.topic) {
      return { kind: "topic", title: year.label, items: year.topics, level, year };
    }
    const topic = year.topics.find((item) => item.id === path.topic) || null;
    if (!topic) {
      return { kind: "topic", title: year.label, items: year.topics, level, year };
    }
    return { kind: "block", title: topic.label, items: topic.blocks, level, year, topic };
  }

  function findBlockIdByTaskIndex(index, taskIndex) {
    if (!index || !index.blockByTaskIndex) return "";
    return index.blockByTaskIndex[taskIndex] || "";
  }

  function buildCombinedTask(block) {
    const tasks = block && block.tasks ? block.tasks : [];
    const question = tasks.map((task) => {
      return "[" + cleanText(task.task_id, "Aufgabe") + "]\n" + cleanText(task.question, "");
    }).join("\n\n");
    const expected = tasks
      .filter((task) => task.expected_answer)
      .map((task) => "[" + cleanText(task.task_id, "Aufgabe") + "]\n" + cleanText(task.expected_answer, ""))
      .join("\n\n");
    return {
      task_id: block.label,
      topic: block.topic,
      subtopic: block.topic,
      source: { level: block.level, year: block.year, subject: "Mathematik" },
      points: block.points || null,
      question,
      expected_answer: expected,
      isSyntheticBlock: true,
    };
  }

  const api = {
    deriveTaskBlockLabel,
    buildTaskIndex,
    getVisibleItems,
    findBlockIdByTaskIndex,
    buildCombinedTask,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaTaskNav = api;
})(typeof window !== "undefined" ? window : globalThis);
