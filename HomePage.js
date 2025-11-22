fetch('Header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;

        const toggler = document.querySelector('.navbar-toggler');
        if (toggler) {
            toggler.addEventListener("click", function () {
            });
        }
    })
    .catch(error => console.error('Error loading header:', error));

fetch('Footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading footer:', error));
