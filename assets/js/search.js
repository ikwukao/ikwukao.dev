document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  const count = document.getElementById("search-result-count");
  const status = document.getElementById("search-status");

  if (!input || !results) return;

  let pages = [];

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[character];
    });

  const getType = (page) => {
    const permalink = page.permalink || "";

    if (permalink.includes("/projects/")) return "Project";
    if (permalink.includes("/journal/")) return "Journal";
    if (permalink.includes("/skills/")) return "Skills";
    if (permalink.includes("/about/")) return "About";
    if (permalink.includes("/resume/")) return "Resume";
    if (permalink.includes("/contact/")) return "Contact";

    return "Page";
  };

  const renderInitialState = () => {
    if (count) count.textContent = "";
    if (status) status.textContent = "";

    results.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-zinc-950/30 px-6 py-10 text-center">
        <p class="text-sm text-zinc-500">
          Start typing to search projects, journal entries, skills, and engineering topics.
        </p>
      </div>
    `;
  };

  const renderNoResults = () => {
    if (count) count.textContent = "0 results";
    if (status) status.textContent = "No results found.";

    results.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-zinc-950/40 px-6 py-12 text-center">
        <p class="text-lg font-semibold text-white">
          No results found
        </p>

        <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
          Try a broader search or explore projects, journal entries,
          and engineering topics.
        </p>
      </div>
    `;
  };

  const renderResults = (matches) => {
    if (!matches.length) {
      renderNoResults();
      return;
    }

    if (count) {
      count.textContent = `${matches.length} ${
        matches.length === 1 ? "result" : "results"
      }`;
    }

    if (status) {
      status.textContent = `${matches.length} search ${
        matches.length === 1 ? "result" : "results"
      } found.`;
    }

    results.innerHTML = `
      <div class="space-y-4">
        ${matches
          .map((page) => {
            const type = getType(page);
            const title = escapeHTML(page.title || "Untitled");
            const summary = escapeHTML(
              page.summary ||
                page.description ||
                "Explore this section of the engineering portfolio."
            );

            return `
              <a
                href="${escapeHTML(page.permalink || "#")}"
                class="group block rounded-2xl border border-white/10 bg-zinc-950/40 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-zinc-950/70">

                <div class="flex items-start justify-between gap-6">

                  <div class="min-w-0">

                    <div class="mb-3 flex items-center gap-3">
                      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                        ${type}
                      </span>

                      <span class="text-xs text-zinc-600">
                        ikwukao.dev
                      </span>
                    </div>

                    <h2 class="text-xl font-semibold tracking-tight text-white">
                      ${title}
                    </h2>

                    <p class="mt-3 text-sm leading-6 text-zinc-400">
                      ${summary}
                    </p>

                  </div>

                  <span
                    aria-hidden="true"
                    class="shrink-0 pt-1 text-lg text-zinc-600 transition duration-300 group-hover:translate-x-1 group-hover:text-emerald-400">
                    →
                  </span>

                </div>

              </a>
            `;
          })
          .join("")}
      </div>
    `;
  };

  const runSearch = (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      renderInitialState();
      return;
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const matches = pages
      .map((page) => {
        const title = (page.title || "").toLowerCase();
        const summary = (page.summary || "").toLowerCase();
        const content = (page.content || "").toLowerCase();

        let score = 0;

        for (const term of terms) {
          if (title.includes(term)) score += 10;
          if (summary.includes(term)) score += 5;
          if (content.includes(term)) score += 1;
        }

        return { page, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ page }) => page);

    renderResults(matches);
  };

  try {
    const response = await fetch("/index.json");

    if (!response.ok) {
      throw new Error(`Search index returned ${response.status}`);
    }

    pages = await response.json();

    if (!Array.isArray(pages)) {
      throw new Error("Invalid search index.");
    }

    input.addEventListener("input", () => {
      runSearch(input.value);
    });

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");

    if (initialQuery) {
      input.value = initialQuery;
      runSearch(initialQuery);
    } else {
      renderInitialState();
    }
  } catch (error) {
    console.error("Search initialization failed:", error);

    if (count) count.textContent = "";
    if (status) status.textContent = "Search is temporarily unavailable.";

    results.innerHTML = `
      <div class="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
        <p class="text-sm font-medium text-red-300">
          Search is temporarily unavailable.
        </p>

        <p class="mt-2 text-sm text-zinc-500">
          Please try again shortly or browse the site directly.
        </p>
      </div>
    `;
  }
});
