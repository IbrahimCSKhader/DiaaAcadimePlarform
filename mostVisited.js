const container = document.getElementById("visited-container");
const totalVisitsCount = document.getElementById("total-visits-count");
// use the same base constant as other scripts if needed
const apiUrl = "https://diaaapi.premiumasp.net/api/Summary/most-visited-new";
const totalVisitsUrl = "https://diaaapi.premiumasp.net/api/Summary/total-visits";

const formatNumber = (value) => new Intl.NumberFormat("ar").format(value || 0);

fetch(totalVisitsUrl)
  .then((response) => response.json())
  .then((data) => {
    totalVisitsCount.textContent = formatNumber(data.totalVisits);
  })
  .catch((err) => {
    console.error("فشل تحميل كامل الزيارات:", err);
    totalVisitsCount.textContent = "غير متاح";
  });

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "visited-card";

      const viewCount = formatNumber(item.visits);
      card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.specializationName}</p>
                <div class="visited-views">
                    <i class="fas fa-eye"></i>
                    <span>${viewCount}</span>
                </div>
                <a target="_blank" href="view-pdf.html?id=${item.id}" class="view-button">عرض الملف</a>
            `;

      container.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("فشل تحميل الملفات الأكثر زيارة:", err);
    container.innerHTML = "<p>لا يمكن تحميل الملفات حالياً.</p>";
  });
