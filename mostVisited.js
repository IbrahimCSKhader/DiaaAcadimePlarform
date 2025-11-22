const container = document.getElementById("visited-container");
const apiUrl = "https://diaaapi.premiumasp.net/api/Summary/recent?limit=6";

fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "visited-card";

            card.innerHTML = `
                
                <h3>${item.name}</h3>
                <p>${item.specializationName}</p>
                <a href="view-pdf.html?id=${item.id}" class="view-button">عرض الملف</a>
            `;

            container.appendChild(card);
        });
    })
    .catch(err => {
        console.error("فشل تحميل الملفات الأكثر زيارة:", err);
        container.innerHTML = "<p>لا يمكن تحميل الملفات حالياً.</p>";
    });