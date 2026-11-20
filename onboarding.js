
// CHRONOS ResearchOS - Onboarding

const questions = [
  {
    title: "How would you describe yourself?",
    subtitle: "We'll adjust the research experience to match your background.",
    multiple: false,
    options: [
      {
        title: "Student",
        icon: "🎓",
        desc: "Learning and exploring new topics"
      },
      {
        title: "Researcher",
        icon: "🔬",
        desc: "Investigating discoveries and papers"
      },
      {
        title: "Professional",
        icon: "💼",
        desc: "Applying research to real-world problems"
      },
      {
        title: "Curious Learner",
        icon: "💡",
        desc: "Exploring science independently"
      }
    ]
  },

  {
    title: "Which fields interest you?",
    subtitle: "Select one or more areas you'd like to explore.",
    multiple: true,
    options: [
      {
        title: "Artificial Intelligence",
        icon: "🧠",
        desc: "AI and machine learning"
      },
      {
        title: "Medicine & Healthcare",
        icon: "🩺",
        desc: "Medical research and innovation"
      },
      {
        title: "Physics & Space",
        icon: "🪐",
        desc: "Physics and astrophysics"
      },
      {
        title: "Biology",
        icon: "🧬",
        desc: "Life sciences and genetics"
      },
      {
        title: "Chemistry",
        icon: "⚗️",
        desc: "Molecules and materials"
      },
      {
        title: "Computer Science",
        icon: "💻",
        desc: "Computing and technology"
      },
      {
        title: "Other / Multidisciplinary",
        icon: "🌐",
        desc: "Cross-domain research"
      }
    ]
  },

  {
    title: "What is your main research goal?",
    subtitle: "We'll prioritize the tools you need most.",
    multiple: false,
    options: [
      {
        title: "Learn a Topic",
        icon: "📖",
        desc: "Understand scientific concepts"
      },
      {
        title: "Explore Research Papers",
        icon: "📄",
        desc: "Find and analyze publications"
      },
      {
        title: "Trace Discoveries",
        icon: "⏳",
        desc: "Explore scientific history"
      },
      {
        title: "Find Research Gaps",
        icon: "🔎",
        desc: "Investigate unexplored questions"
      }
    ]
  },

  {
    title: "How detailed should explanations be?",
    subtitle: "Choose the level that feels right for you.",
    multiple: false,
    options: [
      {
        title: "Beginner",
        icon: "🌱",
        desc: "Clear and simple explanations"
      },
      {
        title: "Intermediate",
        icon: "📊",
        desc: "Balanced technical depth"
      },
      {
        title: "Advanced",
        icon: "🔬",
        desc: "Methodology, technical detail and evidence"
      }
    ]
  }
];

// Storage keys
const PROFILE_KEY = "chronosProfile";
const ONBOARDING_KEY = "chronosOnboardingComplete";

// Default preferences when user skips
const defaultProfile = {
  role: "Student",
  domains: ["Artificial Intelligence"],
  goal: "Learn a Topic",
  explanationLevel: "Intermediate"
};

// Do not show onboarding again if completed
if (localStorage.getItem(ONBOARDING_KEY) === "true") {
  window.location.replace("dashboard.html");
}

let currentStep = 0;

let answers = {
  role: "",
  domains: [],
  goal: "",
  explanationLevel: ""
};

const fieldNames = [
  "role",
  "domains",
  "goal",
  "explanationLevel"
];

// Elements
const questionTitle = document.getElementById("questionTitle");
const questionSubtitle = document.getElementById("questionSubtitle");
const optionsContainer = document.getElementById("optionsContainer");

const stepLabel = document.getElementById("stepLabel");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

const questionScreen = document.getElementById("questionScreen");
const completionScreen = document.getElementById("completionScreen");

function renderQuestion() {
  const question = questions[currentStep];
  const field = fieldNames[currentStep];

  questionTitle.textContent = question.title;
  questionSubtitle.textContent = question.subtitle;

  stepLabel.textContent =
    `Step ${currentStep + 1} of ${questions.length}`;

  const percent = Math.round(
    ((currentStep + 1) / questions.length) * 100
  );

  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;

  optionsContainer.replaceChildren();

  question.options.forEach(option => {
    const selected = question.multiple
      ? answers[field].includes(option.title)
      : answers[field] === option.title;

    const card = document.createElement("button");

    card.type = "button";
    card.className = `option-card ${selected ? "selected" : ""}`;
    card.setAttribute("aria-pressed", String(selected));

    card.innerHTML = `
      <span class="option-check">✓</span>
      <span class="option-icon"></span>
      <span class="option-title"></span>
      <span class="option-desc"></span>
    `;

    card.querySelector(".option-icon").textContent = option.icon;
    card.querySelector(".option-title").textContent = option.title;
    card.querySelector(".option-desc").textContent = option.desc;

    card.addEventListener("click", () => {
      chooseOption(option.title);
    });

    optionsContainer.appendChild(card);
  });

  backBtn.disabled = currentStep === 0;

  nextBtn.textContent =
    currentStep === questions.length - 1
      ? "Complete Setup →"
      : "Continue →";

  updateNextButton();
}

function chooseOption(value) {
  const question = questions[currentStep];
  const field = fieldNames[currentStep];

  if (question.multiple) {
    const selected = answers[field];

    if (selected.includes(value)) {
      answers[field] = selected.filter(item => item !== value);
    } else {
      answers[field] = [...selected, value];
    }
  } else {
    answers[field] = value;
  }

  renderQuestion();
}

function updateNextButton() {
  const field = fieldNames[currentStep];
  const answer = answers[field];

  const isValid = Array.isArray(answer)
    ? answer.length > 0
    : answer !== "";

  nextBtn.disabled = !isValid;
}

nextBtn.addEventListener("click", () => {
  if (nextBtn.disabled) return;

  if (currentStep < questions.length - 1) {
    currentStep++;
    renderQuestion();
  } else {
    showCompletion();
  }
});

backBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    renderQuestion();
  }
});

function showCompletion() {
  questionScreen.classList.add("hidden");
  completionScreen.classList.remove("hidden");

  stepLabel.textContent = "Setup complete";
  progressPercent.textContent = "100%";
  progressFill.style.width = "100%";

  const summary = document.getElementById("profileSummary");
  summary.replaceChildren();

  const fields = [
    ["Profile", answers.role],
    ["Research Interests", answers.domains.join(", ")],
    ["Primary Goal", answers.goal],
    ["Explanation Level", answers.explanationLevel]
  ];

  fields.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    summary.appendChild(row);
  });
}

function saveAndContinue(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(ONBOARDING_KEY, "true");

  window.location.href = "dashboard.html";
}

document.getElementById("launchBtn").addEventListener("click", () => {
  saveAndContinue(answers);
});

skipBtn.addEventListener("click", () => {
  saveAndContinue(defaultProfile);
});

// Start onboarding
renderQuestion();
