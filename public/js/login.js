function togglePassword() {
    const passwordInput = document.getElementById('pass');
    const toggleButton = document.querySelector('.password-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
    const btn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    btn.classList.add('loading');
    btn.disabled = true;

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('pass').value;

    if (!username || !password) {
        e.preventDefault();
        showError('Please fill in all fields');
        resetButton();
        return;
    }

    if (username.length < 3) {
        e.preventDefault();
        showError('Username must be at least 3 characters long');
        resetButton();
        return;
    }

    if (password.length < 6) {
        e.preventDefault();
        showError('Password must be at least 6 characters long');
        resetButton();
        return;
    }

    setTimeout(resetButton, 3000);
});

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetButton() {
    const btn = document.getElementById('loginBtn');
    btn.classList.remove('loading');
    btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('username').focus();
});

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});

const inputs = document.querySelectorAll('input[required]');
inputs.forEach(input => {
    input.addEventListener('blur', function () {
        if (this.value.trim() === '') {
            this.style.borderColor = 'var(--error)';
        } else {
            this.style.borderColor = 'var(--border-medium)';
        }
    });

    input.addEventListener('input', function () {
        if (this.style.borderColor === 'var(--error)' && this.value.trim() !== '') {
            this.style.borderColor = 'var(--border-medium)';
        }
    });
});