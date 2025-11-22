// Load Header
fetch('Header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
        const navContact = document.getElementById('nav-contact');
        if (navContact) navContact.classList.add('active');
    })
    .catch(error => console.error('Error loading header:', error));

fetch('Footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading footer:', error));

// // Handle Contact Form Submission (graceful if element missing)
// const contactForm = document.getElementById('contactForm');
// if (contactForm) {
//     contactForm.addEventListener('submit', function(e) {
//         e.preventDefault();
//
//         // Get form values
//         const name = document.getElementById('name').value.trim();
//         const email = document.getElementById('email').value.trim();
//         const phone = document.getElementById('phone').value.trim();
//         const message = document.getElementById('message').value.trim();
//
//         // Basic validation (example)
//         if (!name || !email || !message) {
//             alert('Please fill in the required fields.');
//             return;
//         }
//
//         // For now we'll show a success message
//         alert(`Thank you for contacting us, ${name}! We'll get back to you soon at ${email}.`);
//
//         // Reset form
//         this.reset();
//     });
// }
