// Smooth scroll
const links = document.querySelectorAll('nav a');
links.forEach(link => {
    link.addEventListener('click', e=>{
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Contact form success message
const form = document.getElementById('contact-form');
const successMsg = document.querySelector('.success-message');
form.addEventListener('submit', e=>{
    e.preventDefault();
    successMsg.style.display = 'block';
    form.reset();
});