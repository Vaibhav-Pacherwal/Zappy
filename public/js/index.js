const signup = document.getElementById("signup");
const login = document.getElementById("login");
const signupMobile = document.getElementById("signup-mobile");
const loginMobile = document.getElementById("login-mobile");
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");

signup?.addEventListener("click", () => {
    window.location.href = "/signup-form";
});

login?.addEventListener("click", () => {
    window.location.href = "/login-form";
});

signupMobile?.addEventListener("click", () => {
    window.location.href = "/signup-form";
});

loginMobile?.addEventListener("click", () => {
    window.location.href = "/login-form";
});

hamburger?.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobileMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove("active");
        mobileMenu.classList.remove("active");
    }
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 20) {
        navbar.style.background = 'rgba(247, 247, 248, 0.98)';
        navbar.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
    } else {
        navbar.style.background = 'rgba(247, 247, 248, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
    });

    const techItems = document.querySelectorAll('.tech-item');
    techItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--accent-primary)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--border-light)';
        });
    });
});