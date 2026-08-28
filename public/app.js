const socket = io();

let currentUsername = "";
let currentChat = "general";
let currentRecipient = "";

const termsScreen = document.getElementById("termsScreen");
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const termsCheckbox = document.getElementById("termsCheckbox");
const acceptTermsButton = document.getElementById("acceptTermsButton");
const usernameInput = document.getElementById("usernameInput");
const joinButton = document.getElementById("joinButton");
const loginError = document.getElementById("loginError");

const myUsername = document.getElementById("myUsername");

const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");

const generalButton = document.getElementById("generalButton");

const recipientInput = document.getElementById("recipientInput");
const dmButton = document.getElementById("dmButton");

const userList = document.getElementById("userList");


// --------------------
// LOGIN
// --------------------

termsCheckbox.addEventListener("change", () => {
    acceptTermsButton.disabled = !termsCheckbox.checked;
});

acceptTermsButton.addEventListener("click", () => {
    termsScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    usernameInput.focus();
});

joinButton.addEventListener("click", joinChat);

usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        joinChat();
    }
});

function joinChat() {
    const username = usernameInput.value.trim();

    if (!username) {
        loginError.textContent = "Please enter a username.";
        return;
    }

    socket.emit("join", username);
}

socket.on("joined", (data) => {
    currentUsername = data.username;

    myUsername.textContent = currentUsername;

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    messageInput.focus();
});

socket.on("joinError", (message) => {
    loginError.textContent = message;
});


// --------------------
// GENERAL CHAT
// --------------------

generalButton.addEventListener("click", () => {
    currentChat = "general";
    currentRecipient = "";

    chatTitle.textContent = "General Chat";
    chatSubtitle.textContent = "Everyone can see these messages";

    generalButton.classList.add("active");

    messages.innerHTML = "";

    messageInput.placeholder = "Message everyone...";
    messageInput.focus();
});

socket.on("generalMessage", (data) => {
    if (currentChat !== "general") return;

    addMessage(
        data.username,
        data.message,
        data.time
    );
});


// --------------------
// DIRECT MESSAGES
// --------------------

dmButton.addEventListener("click", openDirectMessage);

recipientInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        openDirectMessage();
    }
});

function openDirectMessage() {
    const recipient = recipientInput.value.trim();

    if (!recipient) return;

    if (recipient === currentUsername) {
        alert("You cannot message yourself.");
        return;
    }

    currentChat = "private";
    currentRecipient = recipient;

    chatTitle.textContent = `@${recipient}`;
    chatSubtitle.textContent = "Private conversation";

    generalButton.classList.remove("active");

    messages.innerHTML = "";

    messageInput.placeholder = `Message @${recipient}...`;

    messageInput.focus();
}

socket.on("privateMessage", (data) => {

    const isRelevant =
        currentChat === "private" &&
        (
            data.sender === currentRecipient ||
            data.recipient === currentRecipient
        );

    if (!isRelevant) return;

    addMessage(
        data.sender,
        data.message,
        data.time
    );
});

socket.on("privateError", (message) => {
    alert(message);
});


// --------------------
// SEND MESSAGE
// --------------------

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    if (currentChat === "general") {

        socket.emit("generalMessage", message);

    } else if (currentChat === "private") {

        socket.emit("privateMessage", {
            recipient: currentRecipient,
            message
        });
    }

    messageInput.value = "";
    messageInput.focus();
});


// --------------------
// DISPLAY MESSAGES
// --------------------

function addMessage(username, text, time) {

    const message = document.createElement("div");
    message.className = "message";

    const header = document.createElement("div");
    header.className = "messageHeader";

    const usernameElement = document.createElement("span");
    usernameElement.className = "messageUsername";
    usernameElement.textContent = username;

    const timeElement = document.createElement("span");
    timeElement.className = "messageTime";
    timeElement.textContent = time;

    const textElement = document.createElement("div");
    textElement.className = "messageText";
    textElement.textContent = text;

    header.appendChild(usernameElement);
    header.appendChild(timeElement);

    message.appendChild(header);
    message.appendChild(textElement);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}


// --------------------
// SYSTEM MESSAGES
// --------------------

socket.on("systemMessage", (data) => {

    if (currentChat !== "general") return;

    const element = document.createElement("div");

    element.className = "systemMessage";
    element.textContent = data.message;

    messages.appendChild(element);

    messages.scrollTop = messages.scrollHeight;
});


// --------------------
// ONLINE USERS
// --------------------

socket.on("userList", (users) => {

    userList.innerHTML = "";

    users.forEach((username) => {

        const element = document.createElement("div");

        element.className = "onlineUser";
        element.textContent = username;

        userList.appendChild(element);
    });
});