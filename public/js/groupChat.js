let about = document.getElementById("about");
let closeInfo = document.getElementById("close-info");
let exitGroup = document.getElementById("exit");
let yesBtn = document.getElementById("yes");
let noBtn = document.getElementById("no");
let form = document.getElementById("inputBox");
let input = document.getElementById("content");
let messages = document.getElementById("messages");
let confirmationBox = document.getElementById("exit-confirmation");
let detailBox = document.getElementById("group-info-modal");

about.addEventListener("click", (e) => {
    e.preventDefault();
    detailBox.classList.add("show-modal");
});

closeInfo.addEventListener("click", () => {
    detailBox.classList.remove("show-modal");
});

exitGroup.addEventListener("click", (e) => {
    e.preventDefault();
    confirmationBox.classList.add("show-modal");
});

noBtn.addEventListener("click", () => {
    confirmationBox.classList.remove("show-modal");
});

yesBtn.addEventListener("click", () => {
    console.log("Leaving group...");
    window.location.href = "/exit/<%= grpDetails._id %>/";
});

detailBox.addEventListener("click", (e) => {
    if (e.target === detailBox) {
        detailBox.classList.remove("show-modal");
    }
});

confirmationBox.addEventListener("click", (e) => {
    if (e.target === confirmationBox) {
        confirmationBox.classList.remove("show-modal");
    }
});

async function deleteUser(grpName, nominee) {
    await fetch(`/${grpName}/remove/${nominee}`, {
        method: "DELETE"
    })
        .then(res => {
            if (res) {
                showNotification("Member removed successfully", "success");
                location.reload();
            } else {
                showNotification("Only admin can remove members", "error");
            }
        })
        .catch((err) => {
            showNotification("Error removing member", "error");
            console.log("Error:", err);
        });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    if (type === 'success') {
        notification.style.borderLeft = '4px solid var(--success)';
    } else if (type === 'error') {
        notification.style.borderLeft = '4px solid var(--danger)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

messages.scrollTop = messages.scrollHeight;

const socket = io("https://zappy-3.onrender.com", {
    withCredentials: true
});
const roomName = "<%= grpDetails.groupName %>";
const currentUser = "<%= userDetails.username %>";

socket.emit("join group", roomName);

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let currentMessage = input.value.trim();

    if (currentMessage !== "") {
        socket.emit("group chat", {
            content: currentMessage,
            sender: currentUser,
            groupName: roomName
        });
        input.value = "";
    }
});

socket.on("group chat", (msg) => {
    let li = document.createElement("li");
    li.className = msg.sender === currentUser ? 'sent' : 'received';

    if (msg.sender === currentUser) {
        li.innerHTML = `${msg.content}`;
    } else {
        li.innerHTML = `<strong>${msg.sender}</strong> ${msg.content}`;
    }

    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});

socket.on("user joined", (data) => {
    showNotification(`${data.username} joined the group`, 'success');
});

socket.on("user left", (data) => {
    showNotification(`${data.username} left the group`, 'info');
});