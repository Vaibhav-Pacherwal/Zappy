let addMember = document.getElementById("addM");
let form = document.querySelector("form");
let memberList = document.querySelector(".availableMembers");
let selectedCount = document.getElementById("selectedCount");
let countText = document.getElementById("countText");
let checkboxes = document.querySelectorAll('input[type="checkbox"]');

addMember.addEventListener("click", (e) => {
    e.preventDefault();
    memberList.classList.toggle("show");

    if (memberList.classList.contains("show")) {
        addMember.innerHTML = '<span></span>Hide Members';
        addMember.style.background = 'var(--error-bg)';
        addMember.style.borderColor = 'var(--error)';
        addMember.style.color = 'var(--error)';
    } else {
        addMember.innerHTML = '<span></span>Add Members';
        addMember.style.background = 'var(--accent-bg)';
        addMember.style.borderColor = 'var(--accent-light)';
        addMember.style.color = 'var(--accent-primary)';
    }
});

function updateSelectedCount() {
    let selectedMembers = Array.from(checkboxes).filter(cb => cb.checked);
    let count = selectedMembers.length;

    if (count > 0) {
        selectedCount.classList.add('show');
        countText.textContent = `${count} member${count !== 1 ? 's' : ''} selected`;
    } else {
        selectedCount.classList.remove('show');
    }
}

checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedCount);
});

form.addEventListener('submit', (e) => {
    let createBtn = document.querySelector('.create-btn');
    let selectedMembers = Array.from(checkboxes).filter(cb => cb.checked);

    if (selectedMembers.length === 0) {
        e.preventDefault();
        alert('Please select at least one member for your group.');
        return;
    }

    createBtn.innerHTML = '<div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div> Creating...';
    createBtn.disabled = true;
});

const style = document.createElement('style');
style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    const memberOptions = document.querySelectorAll('.member-option');
    memberOptions.forEach((option, index) => {
        option.style.opacity = '0';
        option.style.transform = 'translateY(10px)';
        setTimeout(() => {
            option.style.transition = 'all 0.3s ease';
            option.style.opacity = '1';
            option.style.transform = 'translateY(0)';
        }, index * 50);
    });
});