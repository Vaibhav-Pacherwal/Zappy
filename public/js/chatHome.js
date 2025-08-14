const navbar = document.getElementById('navbar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const requestsMenu = document.getElementById('requestsMenu');

let lastScrollY = window.scrollY;
let ticking = false;

function updateNavbar() {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 80 && currentScrollY > lastScrollY) {
        if (!navbar.classList.contains('collapsed')) {
            navbar.classList.add('collapsed');
        }
    } else if (currentScrollY < lastScrollY && currentScrollY < 50) {
        if (navbar.classList.contains('collapsed')) {
            navbar.classList.remove('collapsed');
        }
    }

    lastScrollY = currentScrollY;
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    requestsMenu.classList.toggle('show');

    if (requestsMenu.classList.contains('show')) {
        mobileMenuToggle.innerHTML = '✕';
        mobileMenuToggle.style.transform = 'rotate(180deg)';
    } else {
        mobileMenuToggle.innerHTML = '☰';
        mobileMenuToggle.style.transform = 'rotate(0deg)';
    }
});

document.addEventListener('click', (e) => {
    if (!requestsMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        requestsMenu.classList.remove('show');
        mobileMenuToggle.innerHTML = '☰';
        mobileMenuToggle.style.transform = 'rotate(0deg)';
    }
});

const createGroup = document.getElementById("group-creation");
createGroup.addEventListener("click", () => {
    createGroup.style.transform = 'scale(0.95)';
    setTimeout(() => {
        createGroup.style.transform = '';
        window.location.href = "/create-group";
    }, 150);
});

const userItems = document.querySelectorAll('.users');
userItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    setTimeout(() => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    }, index * 50 + 200);

    item.addEventListener('click', (e) => {
        e.preventDefault();
        item.style.transform = 'translateX(6px) scale(0.98)';
        setTimeout(() => {
            window.location.href = item.getAttribute('href');
        }, 150);
    });
});

const panels = document.querySelectorAll('.sidebar, .recents, .groups');
panels.forEach(panel => {
    panel.addEventListener('mouseenter', () => {
        panel.style.borderColor = 'var(--border-medium)';
    });

    panel.addEventListener('mouseleave', () => {
        panel.style.borderColor = 'var(--border-light)';
    });
});