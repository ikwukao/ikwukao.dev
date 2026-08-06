document.addEventListener("DOMContentLoaded", async () => {

  const input = document.getElementById("search-input");

  if (!input) return;

  const results = document.getElementById("search-results");

  const pages = await fetch("/index.json").then(r => r.json());

  input.addEventListener("input", () => {

    const query = input.value.toLowerCase();

    results.innerHTML = "";

    if (!query) return;

    pages
      .filter(page =>
        page.title.toLowerCase().includes(query) ||
        page.content.toLowerCase().includes(query))
      .forEach(page => {

        results.innerHTML += `
          <a href="${page.permalink}"
             class="block rounded-xl border border-white/10 p-6 hover:border-emerald-500">

            <h2 class="text-xl font-semibold text-white">
              ${page.title}
            </h2>

            <p class="mt-3 text-zinc-400">
              ${page.summary}
            </p>

          </a>
        `;

      });

  });

});
