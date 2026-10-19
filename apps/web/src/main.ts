import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("App root was not found.");

app.innerHTML = `
  <section class="shell">
    <p class="eyebrow">B-List</p>
    <h1>Find something worth watching.</h1>
    <p class="lede">A local-first movie guide for your living room.</p>

    <section class="card" aria-labelledby="movies-heading">
      <p class="section-label">Movie discovery</p>
      <h2 id="movies-heading">Start with a title, mood, or genre.</h2>
      <form id="movie-search" class="form-row">
        <label class="sr-only" for="movie-query">Movie search</label>
        <input id="movie-query" name="query" placeholder="Try science fiction" maxlength="120" required />
        <button type="submit">Search</button>
      </form>
      <p id="movie-status" class="status" role="status">The local fixture catalog is ready.</p>
      <ul id="movies" class="results" aria-live="polite"></ul>
    </section>

    <section class="card" aria-labelledby="tv-heading">
      <p class="section-label">TV companion</p>
      <h2 id="tv-heading">Practice the safe flow while the TV is off.</h2>
      <p class="note">This simulator never touches the network or a real TV. Live pairing remains a separate final step.</p>
      <div class="actions">
        <button id="discover" type="button">Discover VIZIO TVs</button>
        <button id="dry-start" type="button" class="secondary">Start dry-run pairing</button>
      </div>
      <p id="tv-status" class="status" role="status">Ready.</p>
      <div id="pairing" class="pairing" hidden>
        <p id="pin-hint"></p>
        <form id="pin-form" class="form-row">
          <label class="sr-only" for="pin">Pairing PIN</label>
          <input id="pin" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="4-digit PIN" required />
          <button type="submit">Confirm pairing</button>
        </form>
      </div>
      <div id="controls" class="control-grid" hidden>
        <p class="note">Each control requires an explicit confirmation.</p>
        <button type="button" data-command="volumeDown">Volume −</button>
        <button type="button" data-command="volumeUp">Volume +</button>
        <button type="button" data-command="muteToggle">Mute</button>
        <button type="button" data-command="cycleInput">Cycle input</button>
      </div>
      <ul id="devices" class="results" aria-live="polite"></ul>
    </section>
  </section>
`;

type Movie = { id: string; title: string; year?: number; genres: string[]; overview?: string };
type MovieResponse = { results: Movie[]; provider: string };
type PairingStart = { simulatorPin: string };

const movieForm = getElement<HTMLFormElement>("movie-search");
const movieQuery = getElement<HTMLInputElement>("movie-query");
const movieStatus = getElement<HTMLParagraphElement>("movie-status");
const movies = getElement<HTMLUListElement>("movies");
const discoverButton = getElement<HTMLButtonElement>("discover");
const dryStartButton = getElement<HTMLButtonElement>("dry-start");
const tvStatus = getElement<HTMLParagraphElement>("tv-status");
const pairing = getElement<HTMLDivElement>("pairing");
const pinHint = getElement<HTMLParagraphElement>("pin-hint");
const pinForm = getElement<HTMLFormElement>("pin-form");
const pinInput = getElement<HTMLInputElement>("pin");
const controls = getElement<HTMLDivElement>("controls");
const devices = getElement<HTMLUListElement>("devices");

movieForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  movieStatus.textContent = "Searching the local catalog…";
  movies.replaceChildren();
  try {
    const result = await requestJson<MovieResponse>(`/api/movies/search?query=${encodeURIComponent(movieQuery.value)}`);
    for (const movie of result.results) {
      const item = document.createElement("li");
      item.innerHTML = `<strong></strong><span></span><small></small>`;
      item.querySelector("strong")!.textContent = movie.title;
      item.querySelector("span")!.textContent = movie.year ? ` (${movie.year})` : "";
      item.querySelector("small")!.textContent = movie.genres.join(" · ");
      movies.append(item);
    }
    movieStatus.textContent = `${result.results.length} result(s) from ${result.provider}.`;
  } catch (error) {
    movieStatus.textContent = messageFor(error, "Movie search failed.");
  }
});

discoverButton.addEventListener("click", async () => {
  discoverButton.disabled = true;
  tvStatus.textContent = "Discovering on the local network…";
  devices.replaceChildren();
  try {
    const payload = await requestJson<{ devices: Array<{ id: string; location: string }> }>("/api/tv/discover");
    for (const device of payload.devices) {
      const item = document.createElement("li");
      item.textContent = `${device.id} — ${device.location}`;
      devices.append(item);
    }
    tvStatus.textContent = payload.devices.length ? `${payload.devices.length} device(s) found.` : "No VIZIO devices found.";
  } catch (error) {
    tvStatus.textContent = messageFor(error, "Discovery failed.");
  } finally {
    discoverButton.disabled = false;
  }
});

dryStartButton.addEventListener("click", async () => {
  dryStartButton.disabled = true;
  try {
    const result = await requestJson<PairingStart>("/api/tv/dry-run/pairing/start", { method: "POST" });
    pairing.hidden = false;
    pinHint.textContent = `Simulator PIN: ${result.simulatorPin}`;
    tvStatus.textContent = "Pairing challenge started. Enter the simulator PIN to continue.";
  } catch (error) {
    tvStatus.textContent = messageFor(error, "Dry-run pairing could not start.");
  } finally {
    dryStartButton.disabled = false;
  }
});

pinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await requestJson("/api/tv/dry-run/pairing/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinInput.value }),
    });
    pairing.hidden = true;
    controls.hidden = false;
    tvStatus.textContent = "Dry-run paired. Choose a command to see the confirmation gate.";
  } catch (error) {
    tvStatus.textContent = messageFor(error, "Pairing confirmation failed.");
  }
});

for (const button of controls.querySelectorAll<HTMLButtonElement>("[data-command]")) {
  button.addEventListener("click", async () => {
    const command = button.dataset.command;
    if (!command) return;
    if (!window.confirm(`Confirm the dry-run command: ${command}?`)) {
      tvStatus.textContent = "Command cancelled before it was sent.";
      return;
    }
    try {
      await requestJson("/api/tv/dry-run/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, confirmed: true }),
      });
      tvStatus.textContent = `Dry-run ${command} accepted. No real TV command was sent.`;
    } catch (error) {
      tvStatus.textContent = messageFor(error, "Command failed.");
    }
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed with HTTP ${response.status}`);
  return payload;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element as T;
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
