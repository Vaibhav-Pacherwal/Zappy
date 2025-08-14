function togglePassword(inputId, button) {
    const passwordInput = document.getElementById(inputId);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        button.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        button.textContent = '👁️';
    }
}

function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('passwordStrengthBar');

    if (password.length === 0) {
        strengthIndicator.style.display = 'none';
        return;
    }

    strengthIndicator.style.display = 'block';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    strengthBar.className = 'password-strength-bar';

    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 3) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

document.getElementById('pass').addEventListener('input', function (e) {
    checkPasswordStrength(e.target.value);
});

document.getElementById('confirmedPass').addEventListener('input', function (e) {
    const password = document.getElementById('pass').value;
    const confirmPassword = e.target.value;

    if (confirmPassword && password !== confirmPassword) {
        e.target.style.borderColor = 'var(--error)';
    } else {
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    }
});

document.getElementById('signupForm').addEventListener('submit', function (e) {
    const btn = document.getElementById('signupBtn');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    btn.classList.add('loading');
    btn.disabled = true;

    const firstName = document.getElementById('fname').value.trim();
    const lastName = document.getElementById('lname').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('pass').value;
    const confirmPassword = document.getElementById('confirmedPass').value;

    if (!firstName || firstName.length < 2) {
        e.preventDefault();
        showError('First name must be at least 2 characters long');
        resetButton();
        return;
    }

    if (!lastName || lastName.length < 2) {
        e.preventDefault();
        showError('Last name must be at least 2 characters long');
        resetButton();
        return;
    }

    if (!username || username.length < 3) {
        e.preventDefault();
        showError('Username must be at least 3 characters long');
        resetButton();
        return;
    }

    if (!/^[a-zA-Z0-9_@]+$/.test(username)) {
        e.preventDefault();
        showError('Username can only contain letters, numbers, and underscores');
        resetButton();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        e.preventDefault();
        showError('Please enter a valid email address');
        resetButton();
        return;
    }

    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        e.preventDefault();
        showError('Please enter a valid phone number');
        resetButton();
        return;
    }

    if (password.length < 6) {
        e.preventDefault();
        showError('Password must be at least 6 characters long');
        resetButton();
        return;
    }

    if (password !== confirmPassword) {
        e.preventDefault();
        showError('Passwords do not match');
        resetButton();
        return;
    }

    setTimeout(resetButton, 3000);
});

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function resetButton() {
    const btn = document.getElementById('signupBtn');
    btn.classList.remove('loading');
    btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fname').focus();
});

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('signupForm').dispatchEvent(new Event('submit'));
    }
});