// Load Header
fetch('Header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
        const navAbout = document.getElementById('nav-about');
        if (navAbout) navAbout.classList.add('active');
    })
    .catch(error => console.error('Error loading header:', error));

fetch('Footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading footer:', error));

// Handle Contact Form Submission
// document.getElementById('contactForm').addEventListener('submit', function(e) {
//     e.preventDefault();
//
//     // Get form values
//     const name = document.getElementById('name').value;
//     const email = document.getElementById('email').value;
//     const phone = document.getElementById('phone').value;
//     const message = document.getElementById('message').value;
//
//
//     alert(`Thank you for contacting us, ${name}! We'll get back to you soon at ${email}.`);
//
//     // Reset form
//     this.reset();
//
//
// });