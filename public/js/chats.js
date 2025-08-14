const socket = io("https://zappy-3.onrender.com", {
    withCredentials: true
});

let peerConnection;
let localStream = null;
let remoteStream = null;
let mySocketId = null;
let targetSocketId = null;
let isInitiator = false;
let pendingCandidates = [];
let remoteDescSet = false;
let callInProgress = false;

const roomName = "<%= user1.fname %>";
const currentUser = "<%= user1.fname %>";
const targetUser = "<%= user2.fname %>";

socket.on("connect", () => {
    mySocketId = socket.id;
    console.log("My socket ID:", mySocketId);
});

socket.emit("join room", "<%= user1.fname %>");

socket.emit("register-user", {
    room: roomName,
    name: "<%= user1.fname %>",
});

socket.emit("get target id", "<%= user2.fname %>");

let targetCheckInterval = setInterval(() => {
    if (!targetSocketId) {
        console.log("🔍 Still looking for target user...");
        socket.emit("get target id", "<%= user2.fname %>");
    } else {
        clearInterval(targetCheckInterval);
    }
}, 5000);

socket.on("target id", (targetId) => {
    targetSocketId = targetId;
    console.log("Target socket ID:", targetSocketId);

    const statusEl = document.getElementById('connection-status');
    if (!targetId) {
        statusEl.textContent = "User offline";
        statusEl.style.color = '#ef4444';
        showNotification("⚠️ <%= user2.fname %> is not online", 'error');
    } else {
        statusEl.textContent = "Active now";
        statusEl.style.color = 'var(--success)';
        showNotification("✅ <%= user2.fname %> connected", 'success');
        clearInterval(targetCheckInterval);
    }
});

console.log("Socket connected:", socket.connected);

let form = document.querySelector("form");
let input = document.getElementById("currMsg");
let messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let currentMessage = input.value.trim();
    let currTime = moment().format("hh:mm A");

    if (currentMessage !== "") {
        socket.emit("chat message", {
            content: currentMessage,
            sender: "<%= user1.fname %>",
            reciever: "<%= user2.fname %>"
        });
        input.value = "";
    }
});

socket.on("chat message", (msg) => {
    console.log(msg);
    let li = document.createElement("li");
    li.className = msg.sender === "<%= user1.fname %>" ? 'sent' : 'received';
    li.innerHTML = `<strong>${msg.sender}</strong>${msg.content}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});

const pcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ],
    iceCandidatePoolSize: 10
};

function createPeerConnection() {
    console.log("🔧 Creating peer connection with config:", pcConfig);

    const pc = new RTCPeerConnection(pcConfig);

    pc.onicecandidate = (event) => {
        console.log("🧊 ICE candidate event:", event.candidate);
        if (event.candidate && targetSocketId) {
            socket.emit("candidate", {
                candidate: event.candidate,
                target: targetSocketId
            });
        }
    };

    pc.onconnectionstatechange = () => {
        console.log("🔗 Connection state:", pc.connectionState);
        updateCallStatus(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
        console.log("📺 Received remote track:", event);
        console.log("📺 Track kind:", event.track.kind);
        console.log("📺 Streams:", event.streams);

        if (event.streams && event.streams.length > 0) {
            const stream = event.streams[0];
            console.log("📺 Setting remote stream:", stream);

            const remoteVideo = document.getElementById("remote-video");
            if (remoteVideo) {
                remoteVideo.srcObject = stream;
                remoteVideo.onloadedmetadata = () => {
                    console.log("📺 Remote video metadata loaded");
                    remoteVideo.play().catch(e => console.error("Error playing remote video:", e));
                };
            }

            const videoSection = document.getElementById("video-section");
            const callControls = document.getElementById("call-controls");
            if (videoSection) videoSection.style.display = "flex";
            if (callControls) callControls.style.display = "flex";

            showNotification("📺 Remote video connected!", 'success');
        } else {
            console.warn("⚠️ No streams in track event");
        }
    };

    return pc;
}

function updateCallStatus(state) {
    const statusEl = document.getElementById('connection-status');
    switch (state) {
        case 'connected':
            statusEl.textContent = "In call";
            statusEl.style.color = 'var(--success)';
            break;
        case 'connecting':
            statusEl.textContent = "Connecting call...";
            statusEl.style.color = 'var(--accent-primary)';
            break;
        case 'disconnected':
        case 'failed':
        case 'closed':
            statusEl.textContent = "Call ended";
            statusEl.style.color = 'var(--text-tertiary)';
            break;
    }
}

async function startCall(audioOnly = false) {
    if (callInProgress) {
        showNotification("📞 Call already in progress", 'info');
        return;
    }

    if (!targetSocketId) {
        showNotification("⛔ Target user not connected!", 'error');
        socket.emit("get target id", targetUser);
        return;
    }

    console.log("📞 Starting call - Audio only:", audioOnly);
    callInProgress = true;

    const constraints = {
        audio: true,
        video: !audioOnly ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
        } : false
    };

    try {
        console.log("🎥 Requesting user media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("🎥 Got local stream:", stream);

        localStream = stream;

        const localVideo = document.getElementById("your-call");
        if (localVideo) {
            localVideo.srcObject = stream;
            localVideo.muted = true;
        }

        document.getElementById("video-section").style.display = "flex";
        document.getElementById("call-controls").style.display = "flex";

        peerConnection = createPeerConnection();

        stream.getTracks().forEach((track) => {
            console.log("➕ Adding track to peer connection:", track.kind);
            peerConnection.addTrack(track, stream);
        });

        updateCallButtons(true);

        isInitiator = true;
        console.log("📤 Emitting call-user to:", targetSocketId);
        socket.emit("call-user", { target: targetSocketId });
        showNotification("📞 Calling...", 'success');

    } catch (error) {
        console.error("❌ Error accessing media devices:", error);
        showNotification(`❌ Media access error: ${error.message}`, 'error');
        callInProgress = false;
        updateCallButtons(false);
    }
}

function updateCallButtons(inCall) {
    const audioBtn = document.getElementById("audio");
    const videoBtn = document.getElementById("video");

    if (inCall) {
        audioBtn.classList.add("active");
        videoBtn.classList.add("active");
    } else {
        audioBtn.classList.remove("active");
        videoBtn.classList.remove("active");
    }
}

document.getElementById("audio").addEventListener("click", (e) => {
    e.preventDefault();
    startCall(true);
});

document.getElementById("video").addEventListener("click", (e) => {
    e.preventDefault();
    startCall(false);
});

socket.on("call-user", async ({ target }) => {
    console.log("📞 Received incoming call from:", target);
    targetSocketId = target;

    showIncomingCallModal(target);
});

function showIncomingCallModal(from) {
    const modal = document.getElementById('call-modal');
    modal.style.display = 'flex';

    showNotification("📞 Incoming call...", 'info');
}

function hideIncomingCallModal() {
    const modal = document.getElementById('call-modal');
    modal.style.display = 'none';
}

document.getElementById('accept-call').addEventListener('click', async () => {
    console.log("✅ Call accepted");
    hideIncomingCallModal();

    try {
        const constraints = {
            audio: true,
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            }
        };

        console.log("🎥 Getting user media for incoming call...");
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        localStream = stream;
        callInProgress = true;

        const localVideo = document.getElementById("your-call");
        if (localVideo) {
            localVideo.srcObject = stream;
            localVideo.muted = true;
        }

        document.getElementById("video-section").style.display = "flex";
        document.getElementById("call-controls").style.display = "flex";

        if (!peerConnection) {
            peerConnection = createPeerConnection();
        }

        stream.getTracks().forEach((track) => {
            console.log("➕ Adding track to peer connection:", track.kind);
            peerConnection.addTrack(track, stream);
        });

        updateCallButtons(true);
        isInitiator = false;

        console.log("📤 Sending ready signal to caller");
        socket.emit("ready", { from: mySocketId });
        showNotification("📞 Call accepted", 'success');

    } catch (error) {
        console.error("❌ Error accepting call:", error);
        showNotification(`❌ Could not accept call: ${error.message}`, 'error');
        hideIncomingCallModal();
    }
});

document.getElementById('reject-call').addEventListener('click', () => {
    console.log("❌ Call rejected");
    hideIncomingCallModal();
    socket.emit("call-rejected", { target: targetSocketId });
    showNotification("📞 Call rejected", 'info');
});

socket.on("call-rejected", () => {
    console.log("❌ Call was rejected by remote user");
    endCall();
    showNotification("📞 Call rejected by user", 'info');
});

socket.on("ready", async ({ from }) => {
    console.log("✅ Received ready from", from);

    if (isInitiator && peerConnection) {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", {
                offer,
                target: targetSocketId,
                from: mySocketId
            });
        } catch (error) {
            console.error("❌ Error creating offer:", error);
        }
    }
});

socket.on("offer", async ({ offer, from }) => {
    console.log("📩 Received offer from", from);
    targetSocketId = from;

    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            remoteDescSet = true;

            for (const candidate of pendingCandidates) {
                try {
                    await peerConnection.addIceCandidate(candidate);
                } catch (err) {
                    console.error("❌ Error adding queued ICE candidate:", err);
                }
            }
            pendingCandidates = [];

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", { answer, target: from });
        } catch (error) {
            console.error("❌ Error processing offer:", error);
        }
    }
});

socket.on("answer", async ({ answer, from }) => {
    console.log("📩 Received answer from:", from);
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            remoteDescSet = true;

            for (const candidate of pendingCandidates) {
                try {
                    await peerConnection.addIceCandidate(candidate);
                } catch (err) {
                    console.error("❌ Error adding queued ICE candidate:", err);
                }
            }
            pendingCandidates = [];
        } catch (error) {
            console.error("❌ Error processing answer:", error);
        }
    }
});

socket.on("candidate", async ({ candidate, from }) => {
    console.log("📩 Received ICE candidate from:", from);
    if (peerConnection && candidate) {
        try {
            const iceCandidate = new RTCIceCandidate(candidate);
            if (remoteDescSet) {
                await peerConnection.addIceCandidate(iceCandidate);
            } else {
                pendingCandidates.push(iceCandidate);
            }
        } catch (error) {
            console.error("❌ Error processing ICE candidate:", error);
        }
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    document.getElementById("video-section").style.display = "none";
    document.getElementById("call-controls").style.display = "none";
    isInitiator = false;
    remoteDescSet = false;
    pendingCandidates = [];
    callInProgress = false;
    updateCallButtons(false);
}

const endCallBtn = document.getElementById("end-call");
if (endCallBtn) {
    endCallBtn.addEventListener("click", () => {
        endCall();
        socket.emit("call-ended", { target: targetSocketId });
    });
}

socket.on("call-ended", () => {
    endCall();
    showNotification("📞 Call ended", 'info');
});

window.addEventListener("beforeunload", () => {
    endCall();
    socket.disconnect();
});