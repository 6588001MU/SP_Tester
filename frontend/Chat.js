const socket = new WebSocket("ws://localhost:8080");

socket.onopen = () => {
  socket.send(JSON.stringify({
    action: "join",
    roomType: TYPE,
    roomId: ROOM_ID,
    sender: CURRENT_USER
  }));
};

// fallback if no params
const params = new URLSearchParams(window.location.search);
const ROOM_ID = params.get("room") || "GLOBAL";
const TYPE = params.get("type") || "GROUP";

const chatTitle = document.getElementById("chatTitle");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");

const CURRENT_USER = localStorage.getItem("studentId") || "Guest_" + Math.floor(Math.random()*1000);

chatTitle.innerText = `${TYPE} : ${ROOM_ID}`;

//detect link
function formatMessageWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" style="color:#00bfff; text-decoration:underline;">
              ${url}
            </a>`;
  });
}


// Receive messages
socket.onmessage = (e) => {
  const data = JSON.parse(e.data);

  // 1️⃣ History load
  if (data.type === "history") {
    chatBox.innerHTML = "";
    data.messages.forEach(m => renderMessage(m));
    return;
  }

  // 2️⃣ Single incoming message
  renderMessage(data);
};


// Send message
function sendMessage(){
  const msg = messageInput.value.trim();
  if(msg === "") return;

  const payload = {
    roomType: TYPE,
    roomId: ROOM_ID,
    sender: CURRENT_USER,
    message: msg
  };

  socket.send(JSON.stringify(payload));

  // show instantly (no waiting)
  //addMessage(CURRENT_USER, msg);

  messageInput.value="";
}

// Draw message
function addMessage(user, msg){
  const row = document.createElement("div");
  const isMe = user === CURRENT_USER;

  row.className = "message";
  row.style.justifyContent = isMe ? "flex-end" : "flex-start";

  // 🔐 Prevent XSS
  const safeMsg = msg
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 🔗 Convert links
  const formattedMsg = formatMessageWithLinks(safeMsg);

  row.innerHTML = `
    ${!isMe ? '<div class="avatar"></div>' : ''}

    <div class="bubble" style="
      background:${isMe ? '#8a5b9a' : 'white'};
      color:${isMe ? 'white' : 'black'};
    ">
      <div class="sender">${user}</div>
      <div>${formattedMsg}</div>
    </div>

    ${isMe ? '<div class="avatar"></div>' : ''}
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}



// Enter key support
messageInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    sendMessage();
  }
});

//file and image picker
function openFilePicker() {
  document.getElementById("fileInput").click();
}

function openImagePicker() {
  document.getElementById("imageInput").click();
}

//handle file seclection
document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    sendBinaryMessage("file", file.name, reader.result);
  };
  reader.readAsDataURL(file);
});


//handle image selection
document.getElementById("imageInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    sendBinaryMessage("image", file.name, reader.result);
  };
  reader.readAsDataURL(file);
});

//send via websocket
function sendBinaryMessage(msgType, filename, data) {
  const payload = {
    roomType: TYPE,
    roomId: ROOM_ID,
    sender: CURRENT_USER,
    type: msgType,
    filename,
    data
  };

  socket.send(JSON.stringify(payload));
}

//render receive image and file
function addImage(user, base64) {
  const row = document.createElement("div");
  const isMe = user === CURRENT_USER;

  row.className = "message";
  row.style.justifyContent = isMe ? "flex-end" : "flex-start";

  row.innerHTML = `
    ${!isMe ? '<div class="avatar"></div>' : ''}

    <div class="bubble" style="
      background:${isMe ? '#8a5b9a' : 'white'};
      color:${isMe ? 'white' : 'black'};
    ">
      <div class="sender">${user}</div>
      <a href="${base64}" target="_blank">
        <img src="${base64}" style="max-width:200px;border-radius:10px;">
      </a>
    </div>

    ${isMe ? '<div class="avatar"></div>' : ''}
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}


function addFile(user, name, base64) {
  const row = document.createElement("div");
  const isMe = user === CURRENT_USER;

  row.className = "message";
  row.style.justifyContent = isMe ? "flex-end" : "flex-start";

  row.innerHTML = `
    ${!isMe ? '<div class="avatar"></div>' : ''}

    <div class="bubble" style="
      background:${isMe ? '#8a5b9a' : 'white'};
      color:${isMe ? 'white' : 'black'};
    ">
      <div class="sender">${user}</div>
      <a href="${base64}" download="${name}" target="_blank">
        📄 ${name}
      </a>
    </div>

    ${isMe ? '<div class="avatar"></div>' : ''}
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}



function renderMessage(data) {
  if (data.type === "image") {
    addImage(data.sender, data.data);
  } 
  else if (data.type === "file") {
    addFile(data.sender, data.filename, data.data);
  } 
  else {
    // default = text
    addMessage(data.sender, data.message);
  }
}


