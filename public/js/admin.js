const selectAdminBtn = document.getElementById("selectAdmin");
const adminForm = document.getElementById("adminForm");
const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");
const radioButtons = document.querySelectorAll('input[type="radio"]');
const memberOptions = document.querySelectorAll('.member-option');

selectAdminBtn.addEventListener("click", (e) => {
    e.preventDefault();
    adminForm.classList.add("show");
    selectAdminBtn.style.display = "none";
});

cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    adminForm.classList.remove("show");
    selectAdminBtn.style.display = "flex";

    radioButtons.forEach(radio => {
        radio.checked = false;
    });
    memberOptions.forEach(option => {
        option.classList.remove('selected');
    });
    submitBtn.disabled = true;
});

radioButtons.forEach(radio => {
    radio.addEventListener('change', function () {
        memberOptions.forEach(option => {
            option.classList.remove('selected');
        });

        this.closest('.member-option').classList.add('selected');

        submitBtn.disabled = false;
    });
});

memberOptions.forEach(option => {
    option.addEventListener('click', function () {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
    });
});

adminForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const selectedMember = document.querySelector('input[name="user"]:checked');
    if (!selectedMember) {
        alert('Please select a new admin first.');
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to make "${selectedMember.value}" the new admin? ` +
        `You will be removed from this group immediately and cannot access it unless the new admin adds you back.`
    );

    if (confirmed) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        this.submit();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.admin-change-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(30px) scale(0.95)';

    setTimeout(() => {
        container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0) scale(1)';
    }, 100);
});