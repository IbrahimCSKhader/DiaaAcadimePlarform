pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pdfDoc = null;
let currentPage = 1;
let drawCanvases = [];
let pageWrappers = [];
let scale = 1;
let drawingMode = "none";
let isDrawing = false;

let lockScroll = false;

function calculateScale() {
  const containerWidth = window.innerWidth;
  const pageWidth = 612;

  let base = containerWidth / pageWidth;

  if (containerWidth <= 480) return Math.min(1.1, Math.max(base, 0.7));
  if (containerWidth <= 768) return Math.min(1.3, Math.max(base, 1.0));
  if (containerWidth <= 1024) return Math.min(1.5, Math.max(base, 1.1));

  return Math.min(1.8, Math.max(base, 1.4));
}

function loadPDF() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("loader").innerText = "Invalid File ID";
    throw new Error("Missing id");
  }

  const url = `https://diaaapi.premiumasp.net/api/Summary/${id}/file`;

  const loadingTask = pdfjsLib.getDocument({
    url: url,
    disableStream: false,
    disableAutoFetch: false,
    disableRange: false,
  });

  loadingTask.onProgress = (progress) => {
    if (progress.total) {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      document.getElementById("percent").innerText = percent + "%";
    }
  };

  loadingTask.promise
    .then(async (pdf) => {
      pdfDoc = pdf;
      await renderAllPages();
      updateDrawingMode();
      document.getElementById("loader").style.display = "none";
      updatePageInfo();
    })
    .catch((err) => {
      console.error("PDF.js Error:", err);
      document.getElementById("loader").innerText = "Failed to load PDF";
    });
}

async function renderAllPages() {
  const viewer = document.getElementById("viewerContainer");
  viewer.innerHTML = "";

  drawCanvases = [];
  pageWrappers = [];

  scale = calculateScale();

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const wrapper = document.createElement("div");
    wrapper.className = "page-wrapper";
    wrapper.id = `page-${i}`;

    const pdfCanvas = document.createElement("canvas");
    pdfCanvas.className = "pdf-canvas";

    const DPR = window.devicePixelRatio || 1;
    pdfCanvas.width = viewport.width * DPR;
    pdfCanvas.height = viewport.height * DPR;

    pdfCanvas.style.width = viewport.width + "px";
    pdfCanvas.style.height = viewport.height + "px";

    const ctx = pdfCanvas.getContext("2d");
    ctx.scale(DPR, DPR);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const drawCanvas = document.createElement("canvas");
    drawCanvas.className = "draw-canvas no-drawing";

    drawCanvas.width = viewport.width * DPR;
    drawCanvas.height = viewport.height * DPR;

    drawCanvas.style.width = viewport.width + "px";
    drawCanvas.style.height = viewport.height + "px";

    wrapper.appendChild(pdfCanvas);
    wrapper.appendChild(drawCanvas);

    viewer.appendChild(wrapper);

    drawCanvases.push(drawCanvas);
    pageWrappers.push(wrapper);

    enableDrawing(drawCanvas);
  }
}

function enableDrawing(canvas) {
  const ctx = canvas.getContext("2d");
  let lastX = 0;
  let lastY = 0;

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const DPR = canvas.width / rect.width;

    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * DPR,
      y: (clientY - rect.top) * DPR,
    };
  }

  function start(e) {
    if (drawingMode === "none") return;

    isDrawing = true;
    lockScroll = true;
    document.body.style.overflow = "hidden";

    const { x, y } = getCoords(e);
    lastX = x;
    lastY = y;

    ctx.beginPath();
    ctx.moveTo(x, y);

    e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing || drawingMode === "none") return;

    e.preventDefault();

    if (drawingMode === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#ffeb3b";
      ctx.lineWidth = 3;
    } else if (drawingMode === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function stop() {
    isDrawing = false;
    lockScroll = false;
    document.body.style.overflow = "auto";

    ctx.beginPath();
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseleave", stop);

  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stop, { passive: false });
  canvas.addEventListener("touchcancel", stop, { passive: false });
}

function updateDrawingMode() {
  drawCanvases.forEach((canvas) => {
    canvas.className = "draw-canvas";

    if (drawingMode === "pen") {
      canvas.classList.add("pen-mode");
    } else if (drawingMode === "eraser") {
      canvas.classList.add("eraser-mode");
    } else {
      canvas.classList.add("no-drawing");
    }
  });
}

function scrollToPage(pageNum) {
  const pageEl = document.getElementById(`page-${pageNum}`);
  if (pageEl) {
    pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
    currentPage = pageNum;
    updatePageInfo();
  }
}

function updatePageInfo() {
  document.getElementById(
    "pageInfo"
  ).textContent = `Page ${currentPage} / ${pdfDoc.numPages}`;
}

document.getElementById("viewerContainer").addEventListener("scroll", () => {
  if (lockScroll) return;

  const container = document.getElementById("viewerContainer");
  const mid = container.scrollTop + container.clientHeight / 2;

  for (let i = 0; i < pageWrappers.length; i++) {
    const rect = pageWrappers[i].getBoundingClientRect();
    const top = rect.top + container.scrollTop;
    const bottom = top + rect.height;

    if (mid >= top && mid <= bottom) {
      currentPage = i + 1;
      updatePageInfo();
      break;
    }
  }
});

document.getElementById("menuToggle").addEventListener("click", () => {
  const items = document.getElementById("menuItems");
  const btn = document.getElementById("menuToggle");

  items.classList.toggle("active");
  btn.classList.toggle("active");

  btn.textContent = btn.classList.contains("active") ? "✕" : "☰";
});

document.getElementById("toggleNav").addEventListener("click", () => {
  const controls = document.getElementById("controls");
  controls.classList.toggle("hidden");
});

document.getElementById("penTool").addEventListener("click", () => {
  drawingMode = drawingMode === "pen" ? "none" : "pen";
  updateDrawingMode();

  document.getElementById("penTool").classList.toggle("active");
  document.getElementById("eraserTool").classList.remove("active");
});

document.getElementById("eraserTool").addEventListener("click", () => {
  drawingMode = drawingMode === "eraser" ? "none" : "eraser";
  updateDrawingMode();

  document.getElementById("eraserTool").classList.toggle("active");
  document.getElementById("penTool").classList.remove("active");
});

document.getElementById("nextBtn").onclick = () => {
  if (currentPage < pdfDoc.numPages) scrollToPage(currentPage + 1);
};

document.getElementById("prevBtn").onclick = () => {
  if (currentPage > 1) scrollToPage(currentPage - 1);
};

document.getElementById("goBtn").onclick = () => {
  const val = parseInt(document.getElementById("jumpPage").value);
  if (val >= 1 && val <= pdfDoc.numPages) {
    scrollToPage(val);
    document.getElementById("jumpPage").value = "";
  }
};

let resizeTimeout;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    if (pdfDoc) {
      const oldScale = scale;
      scale = calculateScale();

      if (Math.abs(oldScale - scale) > 0.1) {
        renderAllPages();
        updatePageInfo();
      }
    }
  }, 800);
});

loadPDF();
