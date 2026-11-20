
// =============================================
// CHRONOS RESEARCH OS
// Onboarding + Research Chat + Knowledge Graph
// =============================================

// Change this when your FastAPI backend is deployed.
const API_BASE = "http://127.0.0.1:8000";

const PROFILE_KEY = "chronosProfile";
const THEME_KEY = "chronosTheme";
const CHAT_HISTORY_KEY = "chronosChatHistory";
const $ = id => document.getElementById(id);

const questions = [
  {
    key: "role",
    title: "How would you describe yourself?",
    description: "We'll personalize your research experience.",
    multiple: false,
    options: [
      ["Student", "Learning and exploring topics"],
      ["Researcher", "Investigating papers and discoveries"],
      ["Professional", "Applying research in your work"],
      ["Curious Learner", "Exploring science independently"]
    ]
  },
  {
    key: "domains",
    title: "Which fields interest you?",
    description: "Select as many as you like.",
    multiple: true,
    options: [
      ["Artificial Intelligence", "AI and machine learning"],
      ["Medicine & Healthcare", "Medical research"],
      ["Physics & Space", "Physics and astronomy"],
      ["Biology", "Life sciences and genetics"],
      ["Chemistry", "Molecules and materials"],
      ["Computer Science", "Computing and software"],
      ["Archaeology & History", "Ancient civilizations and discoveries"],
      ["Other / Multidisciplinary", "Cross-domain research"]
    ]
  },
  {
    key: "goal",
    title: "What is your main research goal?",
    description: "Choose what matters most to you.",
    multiple: false,
    options: [
      ["Learn a Topic", "Understand scientific concepts"],
      ["Explore Research Papers", "Find and analyze academic papers"],
      ["Trace Discoveries", "Explore the history of science"],
      ["Find Research Gaps", "Investigate open research questions"]
    ]
  },
  {
    key: "level",
    title: "How detailed should answers be?",
    description: "You can change this later.",
    multiple: false,
    options: [
      ["Beginner", "Simple explanations and examples"],
      ["Intermediate", "Balanced scientific detail"],
      ["Advanced", "Detailed methods and evidence"]
    ]
  }
];

const defaultProfile = {
  role: "Student",
  domains: ["Artificial Intelligence"],
  goal: "Learn a Topic",
  level: "Intermediate"
};

let profile = {
  role: "",
  domains: [],
  goal: "",
  level: ""
};

let step = 0;
let currentPage = "home";
let chatHistory = [];
let previousChats = [];
let currentConversationId = null;
let researchResults = [];
let activeGraph = null;
let selectedNodeId = null;
let cy = null;
let busy = false;

// =============================================
// ONBOARDING
// =============================================

function renderQuestion() {
  const q = questions[step];
  const answer = profile[q.key];

  $("stepLabel").textContent =
    `STEP ${String(step + 1).padStart(2, "0")} OF 04`;

  $("stepPercent").textContent = `${(step + 1) * 25}%`;
  $("progressFill").style.width = `${(step + 1) * 25}%`;

  $("questionTitle").textContent = q.title;
  $("questionDesc").textContent = q.description;

  const options = $("optionList");
  options.replaceChildren();

  q.options.forEach(([name, description]) => {
    const selected = q.multiple
      ? answer.includes(name)
      : answer === name;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "option" + (selected ? " selected" : "");
    button.setAttribute("aria-pressed", String(selected));

    const title = document.createElement("strong");
    title.textContent = selected ? `✓  ${name}` : name;

    const subtitle = document.createElement("small");
    subtitle.textContent = description;

    button.append(title, subtitle);

    button.addEventListener("click", () => {
      if (q.multiple) {
        profile[q.key] = selected
          ? answer.filter(value => value !== name)
          : [...answer, name];
      } else {
        profile[q.key] = name;
      }

      renderQuestion();
    });

    options.appendChild(button);
  });

  $("backStep").disabled = step === 0;
  $("nextStep").disabled = q.multiple
    ? answer.length === 0
    : !answer;

  $("nextStep").textContent =
    step === questions.length - 1
      ? "Complete setup →"
      : "Continue →";
}

$("backStep").addEventListener("click", () => {
  if (step > 0) {
    step--;
    renderQuestion();
  }
});

$("nextStep").addEventListener("click", () => {
  if ($("nextStep").disabled) return;

  if (step < questions.length - 1) {
    step++;
    renderQuestion();
  } else {
    $("questionView").classList.add("hidden");
    $("completeView").classList.remove("hidden");

    $("profileSummary").textContent =
      `${profile.role} · ${profile.level} · ` +
      profile.domains.join(", ");
  }
});

function showOnboarding() {
  $("login").classList.add("hidden");
  $("app").classList.add("hidden");
  $("onboarding").classList.remove("hidden");
  $("questionView").classList.remove("hidden");
  $("completeView").classList.add("hidden");

  step = 0;
  renderQuestion();
}

function showLogin() {
  $("login").classList.remove("hidden");
  $("onboarding").classList.add("hidden");
  $("app").classList.add("hidden");
}

$("emailLoginForm").addEventListener("submit", event => {
  event.preventDefault();
  showOnboarding();
});

$("googleLogin").addEventListener("click", () => {
  $("googleAccountDialog").showModal();
});

$("closeGoogleDialog").addEventListener("click", () => {
  $("googleAccountDialog").close();
});

$("continueAsGuest").addEventListener("click", () => {
  if (profile.role) {
    openApp();
  } else {
    showOnboarding();
  }
});

function saveProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("Unable to save profile:", error);
  }
}

$("skipSetup").addEventListener("click", () => {
  profile = {
    ...defaultProfile,
    domains: [...defaultProfile.domains]
  };

  saveProfile();
  openApp();
});

$("finishSetup").addEventListener("click", () => {
  saveProfile();
  openApp();
});

$("preferencesBtn").addEventListener("click", showOnboarding);

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  document.querySelectorAll(".theme-toggle").forEach(toggle => {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    toggle.textContent = isDark ? "☀ Light mode" : "☾ Dark mode";
  });
}

function saveThemePreference(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn("Unable to save theme preference:", error);
  }
}

document.querySelectorAll(".theme-toggle").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveThemePreference(nextTheme);
  });
});

// =============================================
// APPLICATION NAVIGATION
// =============================================

function openApp() {
  $("login").classList.add("hidden");
  $("onboarding").classList.add("hidden");
  $("app").classList.remove("hidden");

  const initial = profile.role.charAt(0).toUpperCase();

  $("profileAvatar").textContent = initial;
  $("topAvatar").textContent = initial;
  $("profileRole").textContent = profile.role;

  if (!activeGraph) {
    activeGraph = createDemoGraph();
  }

  openPage("home");
  checkBackend();
}

function openPage(page) {
  currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  $(`page-${page}`).classList.remove("hidden");

  document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const labels = {
    home: "Home",
    research: "Research AI",
    history: "Chat History",
    graph: "Knowledge Universe",
    timeline: "Time Machine",
    library: "Library"
  };

  $("breadcrumb").textContent = `Workspace / ${labels[page]}`;
  $("sidebar").classList.remove("open");

  if (page === "graph") {
    initializeGraph();
    renderGraph(activeGraph);

    // Cytoscape needs to recalculate after becoming visible.
    requestAnimationFrame(() => {
      cy.resize();
      cy.fit(undefined, 45);
    });
  }

  if (page === "timeline") renderTimeline();
  if (page === "library") renderLibrary();
  if (page === "history") renderChatHistory();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

$("newChatTop").addEventListener("click", () => {
  clearChat();
  openPage("research");
});

// =============================================
// BACKEND CONNECTION
// =============================================

async function checkBackend() {
  const status = $("connectionStatus");

  try {
    // Optional FastAPI GET /health endpoint.
    const response = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) throw new Error("API unavailable");

    status.className = "connection online";
    status.innerHTML = "<i></i> API connected";
  } catch {
    status.className = "connection offline";
    status.innerHTML = "<i></i> Backend offline";
  }
}

// =============================================
// RESEARCH CHAT
// =============================================

function addMessage(role, text) {
  $("chatEmpty")?.remove();

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const heading = document.createElement("div");
  heading.className = "message-meta";
  heading.textContent = role === "user" ? "YOU" : "CHRONOS";

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = text;

  message.append(heading, body);
  $("chatMessages").appendChild(message);

  scrollChat();

  return { message, body };
}

function scrollChat() {
  const box = $("chatMessages");
  box.scrollTop = box.scrollHeight;
}

function clearChat() {
  if (busy) return;

  chatHistory = [];
  currentConversationId = null;
  $("chatMessages").replaceChildren();

  const empty = document.createElement("div");
  empty.className = "chat-empty";
  empty.id = "chatEmpty";

  empty.innerHTML = `
    <div class="chat-empty-symbol">✳</div>
    <h2>Ask CHRONOS anything.</h2>
    <p>Research papers, historical discoveries and
    scientific questions — with supporting sources.</p>
  `;

  $("chatMessages").appendChild(empty);
  $("agentStatus").textContent =
    "Research • Evidence • History • Connections • Future";
}

$("clearChat").addEventListener("click", clearChat);

function isValidConversation(conversation) {
  return conversation &&
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    typeof conversation.updatedAt === "string" &&
    Number.isFinite(Date.parse(conversation.updatedAt)) &&
    Array.isArray(conversation.turns) &&
    conversation.turns.length > 0 &&
    conversation.turns.every(turn =>
      turn &&
      typeof turn.question === "string" &&
      typeof turn.answer === "string" &&
      (turn.sources === undefined || Array.isArray(turn.sources))
    );
}

function loadPreviousChats() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(CHAT_HISTORY_KEY) || "[]"
    );

    if (!Array.isArray(stored)) {
      throw new Error("Saved chat history is not a list");
    }

    previousChats = stored.filter(isValidConversation);

    if (previousChats.length !== stored.length) {
      console.warn("Some invalid saved conversations were ignored.");
    }
  } catch (error) {
    console.warn("Unable to load previous chats:", error);
  }
}

function persistPreviousChats() {
  try {
    localStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(previousChats)
    );
  } catch (error) {
    console.warn("Unable to save previous chats:", error);
  }
}

function saveConversationTurn(question, answer, sources) {
  let conversation = previousChats.find(
    item => item.id === currentConversationId
  );

  if (!conversation) {
    currentConversationId =
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    conversation = {
      id: currentConversationId,
      title: question.trim(),
      updatedAt: new Date().toISOString(),
      turns: []
    };
    previousChats.push(conversation);
  }

  conversation.turns.push({
    question,
    answer,
    sources: Array.isArray(sources) ? sources : []
  });
  conversation.updatedAt = new Date().toISOString();
  persistPreviousChats();
}

function renderChatHistory() {
  const container = $("chatHistoryList");
  container.replaceChildren();

  if (!previousChats.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "No previous chats yet. Completed Research AI conversations will appear here.";
    container.appendChild(empty);
    return;
  }

  [...previousChats]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .forEach(conversation => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "library-item chat-history-item";

      const title = document.createElement("strong");
      title.textContent = conversation.title;

      const updated = document.createElement("p");
      updated.textContent =
        `${conversation.turns.length} ` +
        `${conversation.turns.length === 1 ? "question" : "questions"} · ` +
        new Date(conversation.updatedAt).toLocaleString();

      card.append(title, updated);
      card.addEventListener("click", () => {
        loadPreviousChat(conversation.id);
      });

      container.appendChild(card);
    });
}

function loadPreviousChat(id) {
  if (busy) return;

  const conversation = previousChats.find(item => item.id === id);
  if (!conversation) {
    console.warn("Unable to find the selected previous chat.");
    return;
  }

  currentConversationId = conversation.id;
  chatHistory = conversation.turns.flatMap(turn => [
    { role: "user", content: turn.question },
    { role: "assistant", content: turn.answer }
  ]);
  $("chatMessages").replaceChildren();

  conversation.turns.forEach(turn => {
    addMessage("user", turn.question);
    const assistant = addMessage("assistant", turn.answer);
    renderSources(assistant.message, turn.sources);
  });

  $("agentStatus").textContent = "Previous conversation loaded";
  openPage("research");
}

function renderSources(message, sources) {
  if (!Array.isArray(sources) || !sources.length) return;

  const container = document.createElement("div");
  container.className = "message-sources";

  const title = document.createElement("strong");
  title.textContent = "Sources";
  container.appendChild(title);

  sources.forEach((source, index) => {
    if (!source?.url) return;

    let url;

    try {
      url = new URL(source.url);

      if (!["https:", "http:"].includes(url.protocol)) return;
    } catch {
      return;
    }

    const link = document.createElement("a");
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent =
      `[${index + 1}] ${source.title || "Research paper"}`;

    container.appendChild(link);
  });

  message.appendChild(container);
}

function renderResultActions(message, result) {
  const actions = document.createElement("div");
  actions.className = "message-actions";

  if (result.graph?.nodes?.length) {
    const graphButton = document.createElement("button");
    graphButton.textContent = "◎ View Knowledge Graph";

    graphButton.addEventListener("click", () => {
      activeGraph = normalizeBackendGraph(result.graph);
      openPage("graph");
    });

    actions.appendChild(graphButton);
  }

  if (Array.isArray(result.timeline) && result.timeline.length) {
    const timelineButton = document.createElement("button");
    timelineButton.textContent = "◷ View Timeline";

    timelineButton.addEventListener("click", () => {
      openPage("timeline");
    });

    actions.appendChild(timelineButton);
  }

  message.appendChild(actions);
}

async function askResearch(question) {
  if (busy || !question.trim()) return;

  busy = true;
  $("sendChat").disabled = true;

  openPage("research");

  addMessage("user", question);

  const loading = addMessage(
    "Connecting to research backend...",
    "assistant"
  );

  $("agentStatus").textContent = "Research request in progress...";

  try {
    const response = await fetch(`${API_BASE}/api/research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        profile,
        history: chatHistory.slice(-10)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (typeof result.answer !== "string") {
      throw new Error("Invalid backend response");
    }

    loading.body.textContent = result.answer;
    renderSources(loading.message, result.sources);
    renderResultActions(loading.message, result);

    chatHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: result.answer }
    );

    researchResults.push({
      question,
      answer: result.answer,
      sources: result.sources || [],
      date: new Date().toISOString()
    });
    saveConversationTurn(question, result.answer, result.sources);

    if (result.graph?.nodes?.length) {
      activeGraph = normalizeBackendGraph(result.graph);
    }

    if (Array.isArray(result.timeline)) {
      latestTimeline = result.timeline;
    }

    // Use only backend-provided status.
    $("agentStatus").textContent =
      result.status || "Research completed";

    $("connectionStatus").className = "connection online";
    $("connectionStatus").innerHTML = "<i></i> API connected";

  } catch (error) {
    console.error(error);

    loading.body.textContent =
      "Could not retrieve a research answer. " +
      "Check that the FastAPI backend is running at " +
      API_BASE + " and that /api/research is available.";

    $("agentStatus").textContent = "Research request failed";

  } finally {
    busy = false;
    $("sendChat").disabled = false;
    scrollChat();
  }
}

$("homeForm").addEventListener("submit", event => {
  event.preventDefault();

  const question = $("homeQuestion").value.trim();
  if (!question) return;

  $("homeQuestion").value = "";
  askResearch(question);
});

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const question = $("chatQuestion").value.trim();
  if (!question) return;

  $("chatQuestion").value = "";
  askResearch(question);
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    askResearch(button.dataset.prompt);
  });
});

// =============================================
// DENSE KNOWLEDGE GRAPH — DEMO DATA
// =============================================

// The graph uses deterministic sample nodes.
// It does not claim these are real citations.

function makeRandomGenerator(seed = 314159) {
  return function () {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const rand = makeRandomGenerator();

const researchClusters = [
  {
    name: "Machine Learning",
    x: -580, y: -310,
    topics: [
      "Classification", "Regression", "Ensemble Models",
      "Decision Trees", "Feature Engineering",
      "Supervised Learning"
    ]
  },
  {
    name: "Deep Learning",
    x: -50, y: -530,
    topics: [
      "Transformers", "Neural Networks", "CNN",
      "Representation Learning", "Attention",
      "Optimization"
    ]
  },
  {
    name: "Medical Imaging",
    x: 520, y: -420,
    topics: [
      "Image Segmentation", "Radiology AI",
      "Medical Vision", "MRI Analysis",
      "Image Recognition"
    ]
  },
  {
    name: "Clinical NLP",
    x: 700, y: -80,
    topics: [
      "Clinical BERT", "EHR Mining", "Medical Text",
      "Clinical Notes", "Language Models"
    ]
  },
  {
    name: "Healthcare Systems",
    x: 710, y: 300,
    topics: [
      "Resource Allocation", "Clinical Workflows",
      "Decision Support", "Hospital Operations"
    ]
  },
  {
    name: "Drug Discovery",
    x: 420, y: 600,
    topics: [
      "Protein Folding", "Generative Models",
      "Molecular Screening", "Drug Design",
      "Molecular Prediction"
    ]
  },
  {
    name: "Patient Outcomes",
    x: -190, y: 640,
    topics: [
      "Survival Analysis", "Treatment Outcomes",
      "Risk Factors", "Patient Monitoring"
    ]
  },
  {
    name: "Predictive Analytics",
    x: -650, y: 430,
    topics: [
      "Time Series", "Early Detection",
      "Risk Prediction", "Forecasting"
    ]
  },
  {
    name: "Medical Diagnostics",
    x: -820, y: 50,
    topics: [
      "Disease Classification", "Diagnostic Models",
      "Clinical Testing", "Screening"
    ]
  }
];

function createDemoGraph() {
  const nodes = [];
  const edges = [];

  let nextId = 0;

  function addNode(label, x, y, type, size, parent = null) {
    const id = `demo-${nextId++}`;

    nodes.push({
      data: {
        id,
        label,
        type,
        size,
        description: `${label} is part of this illustrative research network.`,
        parentConcept: parent
      },
      position: { x, y }
    });

    return id;
  }

  function addEdge(source, target, strength = "normal") {
    if (source === target) return;

    edges.push({
      data: {
        id: `edge-${edges.length}`,
        source,
        target,
        strength
      }
    });
  }

  const centerId = addNode(
    "AI in Healthcare", 0, 0, "core", 21
  );

  const hubs = [];

  researchClusters.forEach((cluster, clusterIndex) => {
    const hub = addNode(
      cluster.name,
      cluster.x,
      cluster.y,
      "hub",
      14,
      centerId
    );

    hubs.push(hub);
    addEdge(centerId, hub, "strong");

    const topicIds = [];

    cluster.topics.forEach((topic, topicIndex) => {
      const angle =
        (topicIndex / cluster.topics.length) * Math.PI * 2;

      const radius = 110 + rand() * 100;

      const x = cluster.x + Math.cos(angle) * radius;
      const y = cluster.y + Math.sin(angle) * radius;

      const topicId = addNode(
        topic, x, y, "topic", 8, hub
      );

      topicIds.push(topicId);
      addEdge(hub, topicId, "strong");

      // Each topic receives many satellite nodes.
      for (let i = 0; i < 12; i++) {
        const a = rand() * Math.PI * 2;
        const r = 25 + rand() * 125;

        const type = i === 10
          ? "researcher"
          : i % 3 === 0
            ? "paper"
            : "concept";

        const satelliteId = addNode(
          `${topic} ${type} ${i + 1}`,
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          type,
          type === "paper" ? 3.1 : 2.5,
          topicId
        );

        addEdge(topicId, satelliteId);

        if (rand() > .55) {
          addEdge(hub, satelliteId);
        }

        if (rand() > .75) {
          addEdge(centerId, satelliteId);
        }
      }
    });

    // Connections inside clusters.
    topicIds.forEach((id, index) => {
      addEdge(id, topicIds[(index + 1) % topicIds.length]);
    });

    // Connect nearby larger branches.
    if (clusterIndex > 0) {
      addEdge(hubs[clusterIndex - 1], hub, "strong");
    }
  });

  addEdge(hubs[0], hubs[1], "strong");
  addEdge(hubs[1], hubs[2], "strong");
  addEdge(hubs[1], hubs[5], "strong");
  addEdge(hubs[2], hubs[3], "strong");
  addEdge(hubs[3], hubs[4], "strong");
  addEdge(hubs[5], hubs[6], "strong");
  addEdge(hubs[6], hubs[7], "strong");

  // Additional cross-connections for visual density.
  for (let i = 0; i < 650; i++) {
    const a = nodes[Math.floor(rand() * nodes.length)];
    const b = nodes[Math.floor(rand() * nodes.length)];

    if (a.data.id !== b.data.id) {
      addEdge(a.data.id, b.data.id);
    }
  }

  return {
    nodes,
    edges,
    demo: true,
    topic: "AI in Healthcare"
  };
}

// =============================================
// BACKEND GRAPH NORMALIZATION
// =============================================

function normalizeBackendGraph(graph) {
  const nodes = (graph.nodes || []).map((node, index) => {
    const item = node.data || node;

    return {
      data: {
        id: String(item.id),
        label: String(item.label || item.name || item.id),
        type: item.type || "concept",
        size: Number(item.size) || 6,
        description: item.description || "",
        url: item.url || "",
        source_ids: item.source_ids || []
      },
      ...(node.position
        ? { position: node.position }
        : {})
    };
  });

  const edges = (graph.edges || []).map((edge, index) => {
    const item = edge.data || edge;

    return {
      data: {
        id: String(item.id || `backend-edge-${index}`),
        source: String(item.source),
        target: String(item.target),
        strength: item.strength || "normal",
        type: item.type || "RELATED_TO",
        evidence: item.evidence || ""
      }
    };
  });

  return {
    nodes,
    edges,
    topic: graph.topic || "Research Network",
    demo: false
  };
}

// =============================================
// CYTOSCAPE VISUALIZATION
// =============================================

function initializeGraph() {
  if (cy) return;

  if (typeof cytoscape === "undefined") {
    $("cy").textContent =
      "Cytoscape.js could not load. Check your internet connection.";
    return;
  }

  cy = cytoscape({
    container: $("cy"),
    elements: [],
    layout: { name: "preset" },
    minZoom: 0.08,
    maxZoom: 5,
    wheelSensitivity: 0.25,
    boxSelectionEnabled: false,
    selectionType: "single",

    style: [
      {
        selector: "node",
        style: {
          "width": "data(size)",
          "height": "data(size)",
          "background-color": "#c9a67d",
          "border-width": 0.5,
          "border-color": "#e1c39a",
          "opacity": 0.9,
          "label": "",
          "text-wrap": "wrap",
          "text-max-width": 115,
          "color": "#f0dfc7",
          "font-family": "Arial, sans-serif",
          "font-size": 11,
          "text-outline-width": 2,
          "text-outline-color": "#19191e",
          "text-valign": "top",
          "text-margin-y": -10,
          "z-index": 5
        }
      },
      {
        selector: 'node[type="core"]',
        style: {
          "background-color": "#f1debb",
          "border-width": 2,
          "border-color": "#bc8068",
          "label": "data(label)",
          "font-size": 23,
          "font-weight": "bold",
          "text-margin-y": -21,
          "z-index": 20
        }
      },
      {
        selector: 'node[type="hub"]',
        style: {
          "background-color": "#dbbf98",
          "label": "data(label)",
          "font-size": 15,
          "font-weight": "bold",
          "text-margin-y": -14,
          "z-index": 15
        }
      },
      {
        selector: 'node[type="topic"]',
        style: {
          "background-color": "#c9a67d",
          "label": "data(label)",
          "font-size": 10,
          "text-margin-y": -10
        }
      },
      {
        selector: 'node[type="paper"]',
        style: {
          "background-color": "#948290",
          "border-color": "#b6a4b7"
        }
      },
      {
        selector: 'node[type="researcher"]',
        style: {
          "background-color": "#b87969",
          "border-color": "#d19b87"
        }
      },
      {
        selector: "edge",
        style: {
          "width": 0.6,
          "line-color": "#a68569",
          "opacity": 0.18,
          "curve-style": "straight",
          "line-cap": "round"
        }
      },
      {
        selector: 'edge[strength="strong"]',
        style: {
          "width": 1.25,
          "opacity": 0.46,
          "line-color": "#cf9a76"
        }
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 3,
          "border-color": "#f7eee3",
          "opacity": 1,
          "z-index": 30,
          "label": "data(label)"
        }
      },
      {
        selector: "edge.highlighted",
        style: {
          "opacity": 0.85,
          "width": 1.7,
          "line-color": "#f0bb9d"
        }
      },
      {
        selector: "node.dimmed",
        style: {
          "opacity": 0.18
        }
      },
      {
        selector: "edge.dimmed",
        style: {
          "opacity": 0.025
        }
      }
    ]
  });

  cy.on("tap", "node", event => {
    selectGraphNode(event.target.id());
  });

  cy.on("tap", event => {
    if (event.target === cy && window.innerWidth <= 760) {
      document.querySelector(".graph-inspector")
        .classList.remove("open");
    }
  });
}

function renderGraph(graph) {
  if (!cy || !graph) return;

  $("graphSubtitle").textContent =
    graph.topic || "Research Knowledge Network";

  cy.elements().remove();

  const hasPositions = graph.nodes.every(node =>
    node.position &&
    Number.isFinite(node.position.x) &&
    Number.isFinite(node.position.y)
  );

  cy.add([...graph.nodes, ...graph.edges]);

  // Demo graph uses predefined clustered positions.
  // Backend graph uses a force-directed layout if positions are absent.
  cy.layout(
    hasPositions
      ? { name: "preset", fit: true, padding: 45 }
      : {
          name: "cose",
          animate: false,
          fit: true,
          padding: 45,
          nodeRepulsion: () => 300000,
          idealEdgeLength: () => 110,
          numIter: 450
        }
  ).run();

  $("graphCounts").textContent =
    `${graph.nodes.length} nodes · ` +
    `${graph.edges.length} connections` +
    (graph.demo ? " · Demo data" : "");

  const firstId = graph.demo
    ? graph.nodes[0]?.data.id
    : graph.nodes[0]?.data.id;

  if (firstId) selectGraphNode(firstId);
}

function selectGraphNode(id) {
  if (!cy) return;

  const node = cy.getElementById(id);
  if (!node.length) return;

  selectedNodeId = id;

  cy.elements().removeClass("highlighted dimmed");
  cy.nodes().unselect();
  node.select();

  const neighborhood = node.closedNeighborhood();

  cy.nodes().not(neighborhood.nodes()).addClass("dimmed");
  cy.edges().not(neighborhood.edges()).addClass("dimmed");
  node.connectedEdges().addClass("highlighted");

  $("nodeType").textContent =
    (node.data("type") || "concept").toUpperCase();

  $("nodeTitle").textContent = node.data("label");

  $("nodeDescription").textContent =
    node.data("description") ||
    "Research information will appear here when supported by retrieved sources.";

  renderNodeConnections(node);

  if (window.innerWidth <= 760) {
    document.querySelector(".graph-inspector")
      .classList.add("open");
  }
}

function renderNodeConnections(node) {
  const connections = $("nodeConnections");
  const sources = $("nodeSources");

  connections.replaceChildren();
  sources.replaceChildren();

  const connectedNodes = node.neighborhood("node");

  connectedNodes.slice(0, 12).forEach(other => {
    const button = document.createElement("button");
    button.className = "connected-item";
    button.textContent =
      `${other.data("label")} · ${other.data("type") || "concept"}`;

    button.addEventListener("click", () => {
      selectGraphNode(other.id());
      cy.animate({
        center: { eles: other },
        duration: 350
      });
    });

    connections.appendChild(button);
  });

  if (!connectedNodes.length) {
    connections.textContent = "No connected nodes.";
  }

  const url = node.data("url");

  if (url) {
    try {
      const parsed = new URL(url);

      if (["https:", "http:"].includes(parsed.protocol)) {
        const link = document.createElement("a");
        link.className = "source-link";
        link.href = parsed.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open source ↗";
        sources.appendChild(link);
      }
    } catch {
      // Ignore invalid URLs.
    }
  }

  if (!sources.children.length) {
    const note = document.createElement("p");
    note.style.cssText =
      "font-size:11px;color:#8799ab;line-height:1.7";
    note.textContent =
      activeGraph?.demo
        ? "Demo graph — no verified sources attached."
        : "No direct source link attached to this node.";

    sources.appendChild(note);
  }
}

// =============================================
// GRAPH CONTROLS
// =============================================

$("graphZoomIn").addEventListener("click", () => {
  if (cy) cy.zoom({
    level: Math.min(cy.zoom() * 1.25, 5),
    renderedPosition: {
      x: cy.width() / 2,
      y: cy.height() / 2
    }
  });
});

$("graphZoomOut").addEventListener("click", () => {
  if (cy) cy.zoom({
    level: Math.max(cy.zoom() / 1.25, 0.08),
    renderedPosition: {
      x: cy.width() / 2,
      y: cy.height() / 2
    }
  });
});

$("graphFit").addEventListener("click", () => {
  if (cy) cy.fit(undefined, 45);
});

$("graphDemoReset").addEventListener("click", () => {
  activeGraph = createDemoGraph();
  $("graphSearch").value = "";
  renderGraph(activeGraph);
});

$("graphSearch").addEventListener("input", event => {
  if (!cy) return;

  const query = event.target.value.trim().toLowerCase();
  if (!query) return;

  const match = cy.nodes().filter(node =>
    node.data("label").toLowerCase().includes(query)
  ).first();

  if (match.length) {
    selectGraphNode(match.id());

    cy.animate({
      center: { eles: match },
      zoom: Math.max(cy.zoom(), 0.9),
      duration: 350
    });
  }
});

$("askAboutNode").addEventListener("click", () => {
  if (!cy || !selectedNodeId) return;

  const node = cy.getElementById(selectedNodeId);
  const question =
    `Explain the scientific research related to ${node.data("label")}. ` +
    "Include supporting academic sources and important developments.";

  document.querySelector(".graph-inspector")
    .classList.remove("open");

  askResearch(question);
});

// =============================================
// TIMELINE
// =============================================

let latestTimeline = [];

const demoTimeline = [
  {
    year: 2012,
    title: "AlexNet",
    description: "A landmark deep-learning result in image classification."
  },
  {
    year: 2017,
    title: "Transformer architecture",
    description: "The attention-based Transformer architecture was introduced."
  },
  {
    year: 2018,
    title: "BERT",
    description: "Bidirectional Transformer pre-training became influential in NLP."
  },
  {
    year: 2020,
    title: "GPT-3",
    description: "Large-scale language modeling demonstrated strong few-shot capabilities."
  }
];

function renderTimeline() {
  const container = $("timelineList");
  container.replaceChildren();

  const events = latestTimeline.length
    ? latestTimeline
    : demoTimeline;

  events.forEach(event => {
    const card = document.createElement("div");
    card.className = "timeline-item";

    const year = document.createElement("strong");
    year.textContent = String(event.year || "");

    const title = document.createElement("h3");
    title.textContent = event.title || "Research milestone";

    const description = document.createElement("p");
    description.textContent = event.description || "";

    card.append(year, title, description);
    container.appendChild(card);
  });

  if (!latestTimeline.length) {
    const note = document.createElement("p");
    note.className = "empty-state";
    note.textContent =
      "Example timeline. Research-specific milestones will appear when the backend returns them.";
    container.prepend(note);
  }
}

// =============================================
// RESEARCH LIBRARY
// =============================================

function renderLibrary() {
  const container = $("libraryList");
  container.replaceChildren();

  if (!researchResults.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "No completed research requests yet. Ask your first question in Research AI.";
    container.appendChild(empty);
    return;
  }

  [...researchResults].reverse().forEach(result => {
    const card = document.createElement("button");
    card.className = "library-item";

    const title = document.createElement("strong");
    title.textContent = result.question;

    const date = document.createElement("p");
    date.textContent = new Date(result.date).toLocaleString();

    card.append(title, date);

    card.addEventListener("click", () => {
      openPage("research");
    });

    container.appendChild(card);
  });
}

// =============================================
// INITIALIZE APP
// =============================================

function initialize() {
  let savedTheme = "light";
  let savedProfile = null;

  loadPreviousChats();

  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      savedTheme = storedTheme;
    }
  } catch (error) {
    console.warn("Unable to load theme preference:", error);
  }
  setTheme(savedTheme);

  try {
    savedProfile = JSON.parse(
      localStorage.getItem(PROFILE_KEY)
    );
  } catch {
    savedProfile = null;
  }

  if (
    savedProfile &&
    typeof savedProfile.role === "string" &&
    Array.isArray(savedProfile.domains)
  ) {
    profile = {
      ...defaultProfile,
      ...savedProfile
    };
  }

  showLogin();
}

initialize();
