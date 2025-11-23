const container = document.getElementById("visited-container");
const apiUrl = "https://diaaapi.premiumasp.net/api/Summary/recent?limit=6";
const BASE_URL = "https://diaaapi.premiumasp.net/api";

async function trackVisit(id) {
  try {
    await fetch(`${BASE_URL}/Summary/${id}/visit`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error tracking visit:", err);
  }
}

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "visited-card";

      const link = document.createElement("a");
      link.href = `view-pdf.html?id=${item.id}`;
      link.className = "view-button";
      link.textContent = "عرض الملف";
      link.onclick = (e) => {
        e.preventDefault();
        trackVisit(item.id);
        window.open(link.href, "_blank");
      };

      card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.specializationName}</p>
            `;
      card.appendChild(link);

      container.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("فشل تحميل الملفات الأكثر زيارة:", err);
    container.innerHTML = "<p>لا يمكن تحميل الملفات حالياً.</p>";
  });
