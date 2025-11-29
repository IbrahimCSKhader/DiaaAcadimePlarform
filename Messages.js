const API_BASE_URL = "https://diaaapi.premiumasp.net";
fetch("Header.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("header-placeholder").innerHTML = data;
    const navMessages = document.getElementById("nav-messages");
    if (navMessages) navMessages.classList.add("active");
  })
  .catch((error) => console.error("Error loading header:", error));

fetch("Footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-placeholder").innerHTML = data;
  })
  .catch((error) => console.error("Error loading footer:", error));

const messagesApi = {
  addMessage: async (messageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "فشل في إرسال الرسالة");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  },
};

const messageForm = document.getElementById("messageForm");
const authorNameInput = document.getElementById("authorName");
const messageTextInput = document.getElementById("messageText");
const ratingSlider = document.getElementById("ratingSlider");
const ratingInput = document.getElementById("ratingInput");
const ratingDisplay = document.getElementById("ratingDisplay");
const ratingStars = document.getElementById("ratingStars");
const charCount = document.getElementById("charCount");
const submitBtn = document.getElementById("submitBtn");
const successMessage = document.getElementById("successMessage");

function initializeRatingStars() {
  ratingStars.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const star = document.createElement("i");
    star.className = "fas fa-star star";
    star.dataset.rating = i;
    ratingStars.appendChild(star);
  }
  updateRatingStars(5);
}

function updateRating(value) {
  const rating = parseInt(value);
  ratingSlider.value = rating;
  ratingInput.value = rating;
  ratingDisplay.textContent = rating;
  updateRatingStars(rating);
}

function updateRatingStars(rating) {
  const stars = ratingStars.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

messageTextInput.addEventListener("input", (e) => {
  const count = e.target.value.length;
  charCount.textContent = count;

  if (count > 900) {
    charCount.style.color = "#dc3545";
  } else {
    charCount.style.color = "#999";
  }
});

ratingSlider.addEventListener("input", (e) => {
  updateRating(e.target.value);
});

ratingInput.addEventListener("input", (e) => {
  let value = parseInt(e.target.value);
  if (value < 1) value = 1;
  if (value > 10) value = 10;
  updateRating(value);
});

ratingStars.addEventListener("click", (e) => {
  if (e.target.classList.contains("star")) {
    const rating = parseInt(e.target.dataset.rating);
    updateRating(rating);
  }
});

initializeRatingStars();

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.classList.remove("show");
    el.textContent = "";
  });
}

function validateForm() {
  clearErrors();
  let isValid = true;

  const authorName = authorNameInput.value.trim();
  if (!authorName) {
    showError("authorName", "الرجاء إدخال الاسم");
    isValid = false;
  }

  const messageText = messageTextInput.value.trim();
  if (!messageText) {
    showError("messageText", "الرجاء إدخال الرسالة");
    isValid = false;
  } else if (messageText.length > 1000) {
    showError("messageText", "الرسالة طويلة جداً (الحد الأقصى 1000 حرف)");
    isValid = false;
  }

  const rating = parseInt(ratingInput.value);
  if (isNaN(rating) || rating < 1 || rating > 10) {
    showError("rating", "التقييم يجب أن يكون بين 1 و 10");
    isValid = false;
  }

  return isValid;
}

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

  const messageData = {
    authorName: authorNameInput.value.trim(),
    messageText: messageTextInput.value.trim(),
    rating: parseInt(ratingInput.value),
  };

  try {
    const newMessage = await messagesApi.addMessage(messageData);

    successMessage.classList.add("show");
    successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });

    messageForm.reset();
    updateRating(5);
    charCount.textContent = "0";
    charCount.style.color = "#999";
    clearErrors();

    setTimeout(() => {
      successMessage.classList.remove("show");
    }, 5000);
  } catch (error) {
    console.error("Error submitting message:", error);
    alert(`خطأ في إرسال الرسالة: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الرسالة';
  }
});
