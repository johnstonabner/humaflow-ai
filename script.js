// ============================================================
// HumaFlow AI — script.js
// Frontend interactions, animations, API calls
// ============================================================

// ── Wait for DOM ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── Element refs ──────────────────────────────────────────
  const inputText       = document.getElementById("inputText");
  const outputText      = document.getElementById("outputText");
  const humanizeBtn     = document.getElementById("humanizeBtn");
  const clearBtn        = document.getElementById("clearBtn");
  const copyBtn         = document.getElementById("copyBtn");
  const toneOptions     = document.getElementById("toneOptions");
  const inputWordCount  = document.getElementById("inputWordCount");
  const inputCharCount  = document.getElementById("inputCharCount");
  const outputWordCount = document.getElementById("outputWordCount");
  const outputCharCount = document.getElementById("outputCharCount");
  const copyToast       = document.getElementById("copyToast");
  const btnLoader       = document.getElementById("btnLoader");
  const nav             = document.getElementById("nav");
  const hamburger       = document.getElementById("hamburger");
  const heroTyped       = document.getElementById("heroTyped");

  // ── State ──────────────────────────────────────────────────
  let selectedTone = "casual";
  let currentOutput = "";
  let typewriterTimer = null;

  // ── Navbar scroll effect ───────────────────────────────────
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  // ── Mobile hamburger nav ───────────────────────────────────
  const mobileNav        = document.createElement("div");
  const mobileOverlay    = document.createElement("div");
  mobileNav.className    = "mobile-nav";
  mobileOverlay.className = "mobile-nav-overlay";

  // Build mobile nav links
  ["App", "How It Works", "API", "About"].forEach((label, i) => {
    const hrefs = ["#app", "#how", "#api", "#about"];
    const a = document.createElement("a");
    a.href = hrefs[i];
    a.textContent = label;
    a.addEventListener("click", closeMobileNav);
    mobileNav.appendChild(a);
  });
  document.body.appendChild(mobileOverlay);
  document.body.appendChild(mobileNav);

  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    mobileOverlay.classList.toggle("open");
  });
  mobileOverlay.addEventListener("click", closeMobileNav);
  function closeMobileNav() {
    mobileNav.classList.remove("open");
    mobileOverlay.classList.remove("open");
  }

  // ── Scroll reveal ──────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Stagger within groups
        const delay = (entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -48px 0px" });

  // Stagger sibling reveal cards
  document.querySelectorAll(".reveal").forEach((el, i) => {
    const siblings = el.parentElement.querySelectorAll(".reveal");
    const siblingIdx = Array.from(siblings).indexOf(el);
    el.dataset.delay = siblingIdx * 80;
    revealObserver.observe(el);
  });

  // ── Tone selector ──────────────────────────────────────────
  toneOptions.addEventListener("click", (e) => {
    const btn = e.target.closest(".tone-btn");
    if (!btn) return;
    document.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });

  // ── Input counters ─────────────────────────────────────────
  inputText.addEventListener("input", updateInputCounts);

  function updateInputCounts() {
    const text = inputText.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    inputWordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
    inputCharCount.textContent = `${text.length} char${text.length !== 1 ? "s" : ""}`;
  }

  function updateOutputCounts(text) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    outputWordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
    outputCharCount.textContent = `${text.length} char${text.length !== 1 ? "s" : ""}`;
  }

  // ── Clear button ───────────────────────────────────────────
  clearBtn.addEventListener("click", () => {
    inputText.value = "";
    updateInputCounts();
    clearOutput();
    inputText.focus();
    // Small animation
    clearBtn.style.transform = "rotate(90deg)";
    setTimeout(() => clearBtn.style.transform = "", 300);
  });

  function clearOutput() {
    currentOutput = "";
    outputText.innerHTML = `
      <div class="output-placeholder">
        <div class="placeholder-icon">✦</div>
        <p>Your humanized text will appear here…</p>
      </div>`;
    updateOutputCounts("");
  }

  // ── Copy button ────────────────────────────────────────────
  copyBtn.addEventListener("click", async () => {
    if (!currentOutput) return;
    try {
      await navigator.clipboard.writeText(currentOutput);
      showCopyToast();
      // Animate copy icon
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="4" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4 4V2.5A1.5 1.5 0 015.5 1H11.5A1.5 1.5 0 0113 2.5V8.5A1.5 1.5 0 0111.5 10H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>`;
      }, 2000);
    } catch {
      // Fallback for older browsers
      const range = document.createRange();
      const textEl = outputText.querySelector(".typed-text") || outputText;
      range.selectNodeContents(textEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      showCopyToast();
    }
  });

  function showCopyToast() {
    copyToast.classList.add("show");
    setTimeout(() => copyToast.classList.remove("show"), 2200);
  }

  // ── Typewriter animation ───────────────────────────────────
  function typewriterEffect(text, container, speed = 12, onDone) {
    if (typewriterTimer) clearInterval(typewriterTimer);

    container.innerHTML = '<span class="typed-text"></span><span class="typed-cursor"></span>';
    const textSpan   = container.querySelector(".typed-text");
    const cursorSpan = container.querySelector(".typed-cursor");

    let i = 0;
    const chars = [...text]; // handle unicode correctly

    typewriterTimer = setInterval(() => {
      if (i < chars.length) {
        textSpan.textContent += chars[i];
        i++;
        // Auto-scroll to bottom as text types
        container.scrollTop = container.scrollHeight;
      } else {
        clearInterval(typewriterTimer);
        // Remove blinking cursor after a moment
        setTimeout(() => cursorSpan.remove(), 2000);
        if (onDone) onDone();
      }
    }, speed);
  }

  // ── MAIN: Humanize button ──────────────────────────────────
  humanizeBtn.addEventListener("click", humanize);

  // Allow Ctrl+Enter to trigger humanize
  inputText.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") humanize();
  });

  async function humanize() {
    const text = inputText.value.trim();

    // Validation
    if (!text) {
      shakeElement(inputText);
      inputText.focus();
      return;
    }
    if (text.length < 10) {
      shakeElement(inputText);
      return;
    }

    // Show loading state
    setLoading(true);

    try {
      // POST to backend /humanize endpoint
      const response = await fetch("/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone: selectedTone }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Store result
      currentOutput = data.humanized;

      // Update counts immediately
      updateOutputCounts(currentOutput);

      // Animate output with typewriter
      typewriterEffect(currentOutput, outputText, 10);

    } catch (err) {
      outputText.innerHTML = `
        <div style="padding:20px;color:#dc2626;font-size:14px;">
          ⚠️ Error: ${err.message || "Something went wrong. Is the server running?"}
        </div>`;
      console.error("HumaFlow error:", err);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(state) {
    humanizeBtn.classList.toggle("loading", state);
  }

  // ── Shake animation for validation ────────────────────────
  function shakeElement(el) {
    el.style.animation = "shake .4s cubic-bezier(.36,.07,.19,.97)";
    setTimeout(() => el.style.animation = "", 500);
  }

  // Inject shake keyframes dynamically
  const shakeStyle = document.createElement("style");
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-8px); }
      40%       { transform: translateX(8px); }
      60%       { transform: translateX(-5px); }
      80%       { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  // ── Hero typewriter demo ───────────────────────────────────
  function startHeroTyper() {
    const demoText = "Here's the thing: all of that can be done way more simply. You can use what you've got, maximize your resources, and actually boost productivity — without overcomplicating it.";
    let i = 0;
    let cursor = document.createElement("span");
    cursor.className = "typed-cursor";
    heroTyped.appendChild(cursor);

    const timer = setInterval(() => {
      if (i < demoText.length) {
        heroTyped.insertBefore(document.createTextNode(demoText[i]), cursor);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => cursor.remove(), 2500);
      }
    }, 38);
  }

  // Start hero typer after short delay
  setTimeout(startHeroTyper, 1200);

  // ── API Tester ─────────────────────────────────────────────
  const apiTestBtn  = document.getElementById("apiTestBtn");
  const apiInput    = document.getElementById("apiInput");
  const apiTone     = document.getElementById("apiTone");
  const apiResponse = document.getElementById("apiResponse");

  apiTestBtn.addEventListener("click", async () => {
    const text = apiInput.value.trim();
    if (!text) { apiInput.style.borderColor = "#ef4444"; return; }
    apiInput.style.borderColor = "";

    apiTestBtn.textContent = "Running…";
    apiTestBtn.disabled = true;
    apiResponse.innerHTML = '<span style="color:rgba(255,255,255,.3)">// Processing…</span>';

    try {
      const res = await fetch("/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone: apiTone.value }),
      });
      const data = await res.json();
      apiResponse.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      apiResponse.textContent = `// Error: ${err.message}`;
    } finally {
      apiTestBtn.textContent = "Run Request";
      apiTestBtn.disabled = false;
    }
  });

  // ── Smooth anchor links ────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  // ── Init ───────────────────────────────────────────────────
  updateInputCounts();

}); // end DOMContentLoaded
