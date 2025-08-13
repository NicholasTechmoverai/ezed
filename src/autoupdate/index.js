import { SITEMETA } from "../utils";

export async function checkForUpdate() {
  if (!navigator.onLine) {
    console.log("Offline — skipping update check");
    return;
  }

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/NicholasTechmoverai/project_versions/main/version.json",
      { cache: "no-cache" }
    );
    const data = await res.json();

    const { version, buildDate } = data[SITEMETA.name || 'e-zed'];
    const currentVersion = localStorage.getItem("pwaVersion") || "0.0.0";

    console.log(` version: ${currentVersion}, New: ${version}`);
    if (version !== currentVersion) {
      localStorage.setItem("pwaVersion", version);
      console.log(`New version detected (${version}) — reloading...`);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          window.location.reload(true); 
        });
      } else {
        window.location.reload(true);
      }

    }
  } catch (err) {
    console.error("Error checking for updates:", err);
  }
}
