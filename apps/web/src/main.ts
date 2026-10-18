import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <section class="shell">
    <p class="eyebrow">B-List</p>
    <h1>Find something worth watching.</h1>
    <p class="lede">A local-first movie guide for your living room.</p>
    <div class="actions">
      <button id="discover" type="button">Discover VIZIO TVs</button>
      <span id="status" role="status">Ready</span>
    </div>
    <ul id="devices" class="devices" aria-live="polite"></ul>
  </section>
`;

const button = document.querySelector<HTMLButtonElement>("#discover");
const status = document.querySelector<HTMLSpanElement>("#status");
const devices = document.querySelector<HTMLUListElement>("#devices");

button?.addEventListener("click", async () => {
  if (!status || !devices || !button) return;

  button.disabled = true;
  status.textContent = "Discovering on the local network…";
  devices.replaceChildren();

  try {
    const response = await fetch("/api/tv/discover");
    if (!response.ok) throw new Error(`Discovery failed with HTTP ${response.status}`);

    const payload = (await response.json()) as {
      devices: Array<{ id: string; location: string }>;
    };

    if (payload.devices.length === 0) {
      status.textContent = "No VIZIO devices found.";
      return;
    }

    for (const device of payload.devices) {
      const item = document.createElement("li");
      item.textContent = `${device.id} — ${device.location}`;
      devices.append(item);
    }
    status.textContent = `${payload.devices.length} device(s) found.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Discovery failed.";
  } finally {
    button.disabled = false;
  }
});
