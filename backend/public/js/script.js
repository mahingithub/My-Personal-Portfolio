// ============================================
// 1. Typed.js Animation (Fixed typos & upgraded skills)
// ============================================
var typed = new Typed(".multiple-text", {
  strings: ["Full-Stack Developer.", "MERN Stack Expert.", "UI/UX Integrator.", "Video Editor."],
  typeSpeed: 80,
  backSpeed: 50,
  backDelay: 1500,
  loop: true,
});

// ============================================
// 2. Mobile Menu Toggle (Updated for new Navbar)
// ============================================
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar-pill'); // Updated class name

menuIcon.onclick = () => {
  menuIcon.classList.toggle('bx-x');
  navbar.classList.toggle('active');
};

// ============================================
// 3. Scroll Sections Active Link (Fixed classList error)
// ============================================
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
  let top = window.scrollY;

  sections.forEach(sec => {
      let offset = sec.offsetTop - 150;
      let height = sec.offsetHeight;
      let id = sec.getAttribute('id');

      if (top >= offset && top < offset + height) {
          navLinks.forEach(links => {
              links.classList.remove('active');
          });
          
          // Added null check to prevent website crash
          let activeLink = document.querySelector('header nav a[href*=' + id + ']');
          if (activeLink) {
              activeLink.classList.add('active');
          }
      };
  });

  // Sticky navbar
  let header = document.querySelector('.header-pill'); // Updated class name
  if (header) {
      header.classList.toggle('sticky', window.scrollY > 100);
  }

  // Remove toggle icon and navbar when clicking navbar link (scroll)
  if (menuIcon && navbar) {
      menuIcon.classList.remove('bx-x');
      navbar.classList.remove('active');
  }
};

// ============================================
// 4. Contact Form - Backend API Integration
// ============================================
const BACKEND_URL = 'https://my-personal-portfolio-lzff.onrender.com';
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('contactSubmitBtn');
  const originalText = submitBtn.innerHTML;

  const formData = {
    name: document.getElementById('contactName').value.trim(),
    email: document.getElementById('contactEmail').value.trim(),
    subject: document.getElementById('contactSubject').value.trim(),
    message: document.getElementById('contactMessage').value.trim(),
  };

  if (!formData.name || !formData.email || !formData.subject || !formData.message) {
    formStatus.textContent = '⚠️ Please fill in all fields.';
    formStatus.style.color = '#ffa502';
    return;
  }

  if (formData.message.length < 10) {
    formStatus.textContent = '⚠️ Message must be at least 10 characters.';
    formStatus.style.color = '#ffa502';
    return;
  }

  submitBtn.innerHTML = 'Sending... <i class="bx bx-loader-alt bx-spin"></i>';
  submitBtn.disabled = true;
  formStatus.textContent = '';

  try {
    const response = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      formStatus.textContent = '✅ ' + data.message;
      formStatus.style.color = '#10b981'; // Modern green
      contactForm.reset();
    } else {
      const errorMsg = data.errors ? data.errors.map((err) => err.message).join(', ') : data.message;
      formStatus.textContent = '❌ ' + errorMsg;
      formStatus.style.color = '#ba0036'; // Theme red
    }
  } catch (error) {
    formStatus.textContent = '❌ Connection failed. Please try again later.';
    formStatus.style.color = '#ba0036'; // Theme red
    console.error('Contact form error:', error);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});
}
