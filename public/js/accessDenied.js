document.getElementById('joinRequestBtn').addEventListener('click', function (e) {
    this.classList.add('loading');
    this.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Sending Request...';
});

document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.access-denied-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(30px) scale(0.95)';

    setTimeout(() => {
        container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0) scale(1)';
    }, 100);
});