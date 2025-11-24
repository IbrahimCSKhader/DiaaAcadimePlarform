fetch("Header.html")
  .then((r) => r.text())
  .then((data) => {
    document.getElementById("header-placeholder").innerHTML = data;
    const navSummaries = document.getElementById("nav-summaries");
    if (navSummaries) navSummaries.classList.add("active");
  })
  .catch((e) => console.error("Error loading header:", e));

fetch("Footer.html")
  .then((r) => r.text())
  .then((data) => {
    document.getElementById("footer-placeholder").innerHTML = data;
  })
  .catch((e) => console.error("Error loading footer:", e));

const BASE_URL = "https://diaaapi.premiumasp.net/api";
let allSummaries = [];
let specializations = [];

async function loadSpecializations() {
  try {
    const res = await fetch(`${BASE_URL}/Summary/specializations`);
    if (!res.ok) throw new Error("Failed to load specializations");
    specializations = await res.json();
    const select = document.getElementById("specialization");
    specializations.forEach((spec) => {
      const opt = document.createElement("option");
      opt.value = spec.id;
      opt.textContent = spec.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading specializations:", err);
  }
}

async function loadSummaries() {
  const loading = document.getElementById("loading");
  const errorContainer = document.getElementById("error-message");
  try {
    loading.style.display = "block";
    errorContainer.innerHTML = "";
    const res = await fetch(`${BASE_URL}/Summary`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    allSummaries = await res.json();
    displaySummaries(allSummaries);
  } catch (err) {
    console.error("Error loading summaries:", err);
    errorContainer.innerHTML = `<div class="error">فشل تحميل التلخيصات. حاول لاحقاً.</div>`;
  } finally {
    loading.style.display = "none";
  }
}

function displaySummaries(summaries) {
  const container = document.getElementById("summaries");
  container.innerHTML = "";
  if (!summaries || summaries.length === 0) {
    container.innerHTML =
      '<div class="no-results">لا يوجد تلخيصات مطابقة</div>';
    return;
  }
  summaries.forEach((s) => {
    const card = document.createElement("div");
    card.className = "summary-card";
    const safeName = (s.name || "file").replace(/'/g, "\\'");
    const viewCount = s.visits;
    card.innerHTML = `
            <div class="summary-title">${s.name || "بدون عنوان"}</div>
            <div class="summary-info"><strong>التخصص:</strong> ${
              s.specializationName || "عام"
            }</div>
            <div class="summary-views">
                <i class="fas fa-eye"></i>
                <span>${viewCount}</span>
            </div>
            <div class="summary-actions">
                <button class="btn btn-preview"  style=" background: var(--primary-color);
    color: var(--white);
    flex: 1; " onclick="openPDF(${s.id})"> معاينة</button>
            </div>
        `;
    container.appendChild(card);
  });
}

function filterSummaries() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const selectedSpec = document.getElementById("specialization").value;
  let filtered = allSummaries;
  if (selectedSpec)
    filtered = filtered.filter((s) => s.specializationId == selectedSpec);
  if (searchTerm)
    filtered = filtered.filter((s) =>
      (s.name || "").toLowerCase().includes(searchTerm)
    );
  displaySummaries(filtered);
}

function openPDF(id) {
  window.open(`view-pdf.html?id=${id}`, "_blank");
}

document
  .getElementById("specialization")
  .addEventListener("change", filterSummaries);
document.getElementById("search").addEventListener("input", filterSummaries);

window.addEventListener("load", () => {
  loadSpecializations();
  loadSummaries();
});
