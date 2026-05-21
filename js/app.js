/* ============================================================
   NEW TAB DASHBOARD — app.js
   Features: Greeting, Clock, Focus Timer (custom duration),
             To-Do List, Quick Links
   Challenges: Light/Dark mode, Custom name, Prevent duplicates,
               Sort tasks
   ============================================================ */

"use strict";

/* ============================================================
   STORAGE HELPERS
   ============================================================ */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("LocalStorage write failed:", e);
    }
  },
};

/* ============================================================
   THEME
   ============================================================ */
const Theme = (() => {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  function apply(theme) {
    html.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    Storage.set("theme", theme);
  }

  function init() {
    const saved = Storage.get("theme", "dark");
    apply(saved);
    toggleBtn.addEventListener("click", () => {
      const current = html.getAttribute("data-theme");
      apply(current === "dark" ? "light" : "dark");
    });
  }

  return { init };
})();

/* ============================================================
   GREETING & CLOCK
   ============================================================ */
const Greeting = (() => {
  const greetingText = document.getElementById("greeting-text");
  const greetingName = document.getElementById("greeting-name");
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date-display");
  const nameModal = document.getElementById("name-modal");
  const nameInput = document.getElementById("name-input");
  const nameSave = document.getElementById("name-save");
  const overlay = document.getElementById("modal-overlay");

  const GREETINGS = [
    { range: [5, 12], text: "Good morning" },
    { range: [12, 17], text: "Good afternoon" },
    { range: [17, 21], text: "Good evening" },
    { range: [21, 24], text: "Good night" },
    { range: [0, 5], text: "Good night" },
  ];

  function getGreeting(hour) {
    return GREETINGS.find((g) => hour >= g.range[0] && hour < g.range[1])?.text ?? "Hello";
  }

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    clockEl.textContent = `${h}:${m}:${s}`;

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    greetingText.textContent = getGreeting(now.getHours()) + ",";
  }

  function openNameModal() {
    nameInput.value = Storage.get("userName", "");
    nameModal.classList.remove("hidden");
    overlay.classList.add("visible");
    nameInput.focus();
  }

  function closeNameModal() {
    nameModal.classList.add("hidden");
    overlay.classList.remove("visible");
  }

  function saveName() {
    const name = nameInput.value.trim();
    if (!name) return;
    Storage.set("userName", name);
    renderName(name);
    closeNameModal();
  }

  function renderName(name) {
    greetingName.textContent = name ? `👋 ${name}` : "(click to set your name)";
  }

  function init() {
    updateClock();
    setInterval(updateClock, 1000);

    const savedName = Storage.get("userName", "");
    renderName(savedName);

    // Show name modal on first visit
    if (!savedName) openNameModal();

    greetingName.addEventListener("click", openNameModal);
    nameSave.addEventListener("click", saveName);
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveName();
    });
  }

  return { init };
})();

/* ============================================================
   FOCUS TIMER
   ============================================================ */
const Timer = (() => {
  const display = document.getElementById("timer-display");
  const startBtn = document.getElementById("timer-start");
  const stopBtn = document.getElementById("timer-stop");
  const resetBtn = document.getElementById("timer-reset");
  const durationInput = document.getElementById("timer-duration");
  const setBtn = document.getElementById("timer-set");

  let totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let intervalId = null;
  let isRunning = false;

  function format(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function render() {
    display.textContent = format(remaining);
    display.classList.toggle("running", isRunning && remaining > 0);
    display.classList.toggle("finished", remaining === 0);
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      render();
      notifyDone();
      return;
    }
    remaining--;
    render();
  }

  function notifyDone() {
    // Browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification("Focus session complete!", {
        body: "Time to take a break.",
        icon: "",
      });
    }
  }

  function start() {
    if (isRunning || remaining === 0) return;
    // Request notification permission lazily
    if (Notification.permission === "default") Notification.requestPermission();
    isRunning = true;
    intervalId = setInterval(tick, 1000);
    render();
  }

  function stop() {
    if (!isRunning) return;
    clearInterval(intervalId);
    isRunning = false;
    render();
  }

  function reset() {
    stop();
    remaining = totalSeconds;
    render();
  }

  function setDuration() {
    const mins = parseInt(durationInput.value, 10);
    if (isNaN(mins) || mins < 1 || mins > 120) {
      durationInput.value = Math.floor(totalSeconds / 60);
      return;
    }
    stop();
    totalSeconds = mins * 60;
    remaining = totalSeconds;
    render();
  }

  function init() {
    render();
    startBtn.addEventListener("click", start);
    stopBtn.addEventListener("click", stop);
    resetBtn.addEventListener("click", reset);
    setBtn.addEventListener("click", setDuration);
    durationInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") setDuration();
    });
  }

  return { init };
})();

/* ============================================================
   TO-DO LIST
   ============================================================ */
const Todo = (() => {
  const input = document.getElementById("todo-input");
  const addBtn = document.getElementById("todo-add");
  const listEl = document.getElementById("todo-list");
  const emptyEl = document.getElementById("todo-empty");
  const filterBtns = document.querySelectorAll(".btn--filter[data-filter]");
  const sortBtn = document.getElementById("todo-sort");
  const editModal = document.getElementById("edit-modal");
  const editInput = document.getElementById("edit-input");
  const editSave = document.getElementById("edit-save");
  const editCancel = document.getElementById("edit-cancel");
  const overlay = document.getElementById("modal-overlay");

  let tasks = [];
  let currentFilter = "all";
  let sortAsc = true;
  let editingId = null;

  /* ---- persistence ---- */
  function load() {
    tasks = Storage.get("tasks", []);
  }
  function save() {
    Storage.set("tasks", tasks);
  }

  /* ---- helpers ---- */
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function isDuplicate(text) {
    return tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
  }

  /* ---- CRUD ---- */
  function addTask() {
    const text = input.value.trim();
    if (!text) return;

    if (isDuplicate(text)) {
      flashInput(input, "Duplicate task!");
      return;
    }

    tasks.push({ id: genId(), text, done: false });
    save();
    render();
    input.value = "";
    input.focus();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      save();
      render();
    }
  }

  function openEdit(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    editingId = id;
    editInput.value = task.text;
    editModal.classList.remove("hidden");
    overlay.classList.add("visible");
    editInput.focus();
    editInput.select();
  }

  function saveEdit() {
    const text = editInput.value.trim();
    if (!text) return;

    // Allow saving same text (no change), but block duplicate against OTHER tasks
    const duplicate = tasks.some((t) => t.id !== editingId && t.text.toLowerCase() === text.toLowerCase());
    if (duplicate) {
      flashInput(editInput, "Duplicate task!");
      return;
    }

    const task = tasks.find((t) => t.id === editingId);
    if (task) {
      task.text = text;
      save();
      render();
    }
    closeEdit();
  }

  function closeEdit() {
    editModal.classList.add("hidden");
    overlay.classList.remove("visible");
    editingId = null;
  }

  /* ---- filter & sort ---- */
  function filteredTasks() {
    let list = [...tasks];
    if (currentFilter === "active") list = list.filter((t) => !t.done);
    if (currentFilter === "done") list = list.filter((t) => t.done);
    return list;
  }

  function sortedTasks(list) {
    return [...list].sort((a, b) => (sortAsc ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text)));
  }

  /* ---- render ---- */
  function render() {
    let list = filteredTasks();
    // Only apply sort if sort has been toggled at least once
    if (sortBtn.dataset.sorted === "true") list = sortedTasks(list);

    listEl.innerHTML = "";

    if (list.length === 0) {
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    list.forEach((task) => {
      const li = document.createElement("li");
      li.className = `todo__item${task.done ? " done" : ""}`;
      li.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo__checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const span = document.createElement("span");
      span.className = "todo__text";
      span.textContent = task.text;

      const actions = document.createElement("div");
      actions.className = "todo__actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn--ghost btn--small";
      editBtn.textContent = "✏️";
      editBtn.setAttribute("aria-label", `Edit task: ${task.text}`);
      editBtn.addEventListener("click", () => openEdit(task.id));

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn--danger btn--small";
      delBtn.textContent = "🗑️";
      delBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
      delBtn.addEventListener("click", () => deleteTask(task.id));

      actions.append(editBtn, delBtn);
      li.append(checkbox, span, actions);
      listEl.appendChild(li);
    });
  }

  /* ---- flash feedback ---- */
  function flashInput(el, message) {
    el.style.borderColor = "var(--danger)";
    el.placeholder = message;
    el.value = "";
    setTimeout(() => {
      el.style.borderColor = "";
      el.placeholder = el === input ? "Add a new task…" : "";
    }, 1500);
  }

  function init() {
    load();
    render();

    addBtn.addEventListener("click", addTask);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTask();
    });

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        render();
      });
    });

    sortBtn.addEventListener("click", () => {
      sortBtn.dataset.sorted = "true";
      sortAsc = !sortAsc;
      sortBtn.textContent = sortAsc ? "⇅ Sort A→Z" : "⇅ Sort Z→A";
      render();
    });

    editSave.addEventListener("click", saveEdit);
    editCancel.addEventListener("click", closeEdit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") closeEdit();
    });
  }

  return { init };
})();

/* ============================================================
   QUICK LINKS
   ============================================================ */
const Links = (() => {
  const nameInput = document.getElementById("link-name");
  const urlInput = document.getElementById("link-url");
  const addBtn = document.getElementById("link-add");
  const grid = document.getElementById("links-grid");
  const emptyEl = document.getElementById("links-empty");

  let links = [];

  function load() {
    links = Storage.get("links", []);
  }
  function save() {
    Storage.set("links", links);
  }
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function normalizeUrl(url) {
    url = url.trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return url;
  }

  function addLink() {
    const label = nameInput.value.trim();
    const raw = urlInput.value.trim();
    if (!label || !raw) return;

    const url = normalizeUrl(raw);
    try {
      new URL(url);
    } catch {
      urlInput.style.borderColor = "var(--danger)";
      setTimeout(() => (urlInput.style.borderColor = ""), 1500);
      return;
    }

    links.push({ id: genId(), label, url });
    save();
    render();
    nameInput.value = "";
    urlInput.value = "";
    nameInput.focus();
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    save();
    render();
  }

  function getFavicon(url) {
    try {
      const origin = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch {
      return "";
    }
  }

  function render() {
    grid.innerHTML = "";

    if (links.length === 0) {
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    links.forEach((link) => {
      const chip = document.createElement("div");
      chip.className = "link-chip";

      const favicon = document.createElement("img");
      favicon.src = getFavicon(link.url);
      favicon.width = 16;
      favicon.height = 16;
      favicon.alt = "";
      favicon.style.borderRadius = "2px";
      favicon.onerror = () => {
        favicon.style.display = "none";
      };

      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.label;
      anchor.style.cssText = "color:inherit;text-decoration:none;";

      const delBtn = document.createElement("button");
      delBtn.className = "link-chip__delete";
      delBtn.textContent = "✕";
      delBtn.setAttribute("aria-label", `Remove link: ${link.label}`);
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteLink(link.id);
      });

      chip.append(favicon, anchor, delBtn);
      grid.appendChild(chip);
    });
  }

  function init() {
    load();
    render();
    addBtn.addEventListener("click", addLink);
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addLink();
    });
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") urlInput.focus();
    });
  }

  return { init };
})();

/* ============================================================
   BOOTSTRAP
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Greeting.init();
  Timer.init();
  Todo.init();
  Links.init();
});
