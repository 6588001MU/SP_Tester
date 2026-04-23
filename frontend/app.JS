/* ===============================
   LOGIN
=================================*/
async function signIn() {

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (!username || !password) {
    errorMsg.textContent = "Please enter both username and password.";
    return;
  }

  errorMsg.textContent = "";

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.message || "Wrong username or password";
      return;
    }

    localStorage.setItem("studentId", data.user.student_id);
    localStorage.setItem("userData", JSON.stringify(data.user));

    window.location.href = "SKC_mainpage.html";

  } catch (err) {
    console.error(err);
    errorMsg.textContent = "Cannot connect to server.";
  }
}


/* ===============================
   ⭐ LOAD USER INFO (HEADER ทุกหน้า)
=================================*/
document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("userData"));
  if(!user) return;

  const idEl = document.getElementById("studentIdText");
  const firstEl = document.getElementById("firstNameText");
  const lastEl = document.getElementById("lastNameText");

  if(idEl) idEl.textContent = user.student_id;
  if(firstEl) firstEl.textContent = user.first_name;
  if(lastEl) lastEl.textContent = user.last_name;

});


/* ===============================
   NAVIGATION
=================================*/
function goToPage(page) {
  window.location.href = page;
}



/* ===============================
   YEAR DROPDOWN
=================================*/
function toggleYear(yearId) {

  const dropdowns = document.querySelectorAll(".sec-dropdown");

  dropdowns.forEach(d => {
    if (d.id !== yearId) d.classList.remove("open");
  });

  document.getElementById(yearId).classList.toggle("open");
}



/* ===============================
   IFRAME LOADER
=================================*/
function loadPage(page){

  const dashboard = document.getElementById("dashboardArea");
  const frameArea = document.getElementById("content-frame-area");

  if(dashboard) dashboard.style.display = "none";
  if(frameArea) frameArea.style.display = "block";

  document.getElementById("contentFrame").src = page;
}



/* ===============================
   OPEN CHAT
=================================*/
function openChat(type, room) {

  const iframe = document.getElementById("contentFrame");
  const frameArea = document.getElementById("content-frame-area");
  const dashboard = document.getElementById("dashboardArea");

  if (!iframe || !frameArea || !dashboard) return;

  dashboard.style.display = "none";
  frameArea.style.display = "block";

  iframe.src = `Chat.html?type=${type}&room=${room}`;
}



/* ===============================
   SHOW DASHBOARD
=================================*/
function showDashboard(){

  const dashboard = document.getElementById("dashboardArea");
  const frameArea = document.getElementById("content-frame-area");

  if(dashboard) dashboard.style.display = "block";
  if(frameArea) frameArea.style.display = "none";

  updateAISubjectUI();
}



/* ===============================
   RANDOM AVATAR COLOR
=================================*/
document.addEventListener("DOMContentLoaded", () => {

  const avatars = document.querySelectorAll(".avatar");

  avatars.forEach(avatar => {

    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    avatar.style.boxShadow = `0 0 0 6px rgb(${r},${g},${b}) inset`;

  });

});



/* ===============================
   MESSAGE HANDLER
=================================*/
window.addEventListener("message", (event) => {

  if (!event.data || !event.data.action) return;

  if (event.data.action === "LOAD_GROUP_CHAT") {
    loadPage("GroupChat.html");
  }

  if (event.data.action === "OPEN_GROUP_ROOM") {
    openChat("GROUP", event.data.room);
  }

  if (event.data.action === "OPEN_RATING") {
    loadPage("Rating.html");
  }

  if (event.data.action === "SUBJECT_SELECTED") {
    showDashboard();
    document.getElementById("contentFrame").src = "";
  }

  if (event.data.action === "OPEN_FRIEND_PROFILE") {
  localStorage.setItem("selectedFriendId", event.data.studentId);
  loadPage("userProfile.html");
}
});



/* ===============================
   AI ASSIST
=================================*/
function loadRecommendGroup() {
  loadPage("Recommend_Group.html");
}

function loadRecommendPeople() {
  loadPage("Recommend_People.html");
}


function updateAISubjectUI() {

  const subject = localStorage.getItem("selectedSubject");

  const subjectText = document.getElementById("selectedSubjectText");
  const groupBtn = document.getElementById("findGroupBtn");
  const peopleBtn = document.getElementById("findPeopleBtn");

  if (!subject) {

    if(subjectText) subjectText.textContent = "SELECT SUBJECT";
    if(groupBtn) groupBtn.disabled = true;
    if(peopleBtn) peopleBtn.disabled = true;

    return;
  }

  if(subjectText) subjectText.textContent = subject;
  if(groupBtn) groupBtn.disabled = false;
  if(peopleBtn) peopleBtn.disabled = false;

}



/* ===============================
   MAIL / INVITE
=================================*/
function sendGroupRequest(groupName){

  const currentUser = localStorage.getItem("studentId") || "Unknown";

  let requests = JSON.parse(localStorage.getItem("groupRequests")) || [];

  requests.push({
    uid: currentUser,
    group: groupName,
    type: "JOIN_REQUEST"
  });

  localStorage.setItem("groupRequests", JSON.stringify(requests));

  alert("Request Sent Successfully!");
}


function sendPeopleInvite(groupName){

  const currentUser = localStorage.getItem("studentId") || "Unknown";

  let invites = JSON.parse(localStorage.getItem("peopleInvites")) || [];

  invites.push({
    from: currentUser,
    group: groupName,
    type: "INVITE"
  });

  localStorage.setItem("peopleInvites", JSON.stringify(invites));

  alert("Invitation Sent Successfully!");
}

async function findPeople() {
  const subject = document.getElementById("selectedSubjectText").innerText;
  const currentStudentId = localStorage.getItem("studentId");

  if (!subject || subject === "SELECT SUBJECT") {
    alert("Please select a subject first.");
    return;
  }

  const res = await fetch("http://localhost:3000/find-people", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ subject, currentStudentId })
  });

  const data = await res.json();

  localStorage.setItem("recommendedPeople", JSON.stringify(data));
  localStorage.setItem("recommendedSubject", subject);

  window.location.href = "Recommend_people.html";
}

async function findGroup() {
  const subject = document.getElementById("selectedSubjectText").innerText;
  const currentStudentId = localStorage.getItem("studentId");

  if (!subject || subject === "SELECT SUBJECT") {
    alert("Please select a subject first.");
    return;
  }

  const res = await fetch("http://localhost:3000/find-group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ subject, currentStudentId })
  });

  const data = await res.json();

  localStorage.setItem("recommendedGroups", JSON.stringify(data));
  localStorage.setItem("recommendedSubject", subject);

  window.location.href = "Recommend_group.html";
}

function renderRecommendedPeople() {
  const peopleList = document.getElementById("peopleList");
  const recommendTitle = document.getElementById("recommendTitle");

  if (!peopleList) return;

  const people = JSON.parse(localStorage.getItem("recommendedPeople")) || [];
  const subject = localStorage.getItem("recommendedSubject") || "";

  if (recommendTitle) {
    recommendTitle.textContent = subject
      ? `Recommended People : ${subject}`
      : "Recommended People";
  }

  if (people.length === 0) {
    peopleList.innerHTML = `<div class="rp-empty">No recommended people found.</div>`;
    return;
  }

  let html = "";

  people.forEach(person => {
    html += `
      <div class="rp-row">
        <div class="rp-left">
          <div class="rp-avatar"></div>

          <div class="rp-info">
            <div class="rp-uid">UID : ${person.student_id}</div>
            <div class="rp-name">Name : ${person.first_name} &nbsp;&nbsp; Surname : ${person.last_name}</div>
          </div>
        </div>

        <div class="rp-right">
          <button class="rp-view">👁</button>
          <button class="rp-invite" onclick="sendPeopleInvite('${person.student_id}')">Invite</button>
        </div>
      </div>
    `;
  });

  peopleList.innerHTML = html;
}

function renderRecommendedGroups() {
  const groupList = document.getElementById("groupList");
  const groupRecommendTitle = document.getElementById("groupRecommendTitle");

  if (!groupList) return;

  const groups = JSON.parse(localStorage.getItem("recommendedGroups")) || [];
  const subject = localStorage.getItem("recommendedSubject") || "";

  if (groupRecommendTitle) {
    groupRecommendTitle.textContent = subject
      ? `Recommended Groups : ${subject}`
      : "Recommended Groups";
  }

  if (groups.length === 0) {
    groupList.innerHTML = `<div class="rg-empty">No recommended groups found.</div>`;
    return;
  }

  let html = "";

  groups.forEach(group => {
    html += `
      <div class="rg-row">
        <div class="rg-left">
          <div class="rg-avatar"></div>

          <div class="rg-info">
            <div class="rg-title">${group.group_name}</div>
            <div class="rg-members"><b>Members:</b> ${group.members || '-'}</div>
            <div class="rg-missing"><b>Missing strength:</b> ${group.missing_strength}</div>
            <div class="rg-reason"><b>Reason:</b> ${group.reason}</div>
          </div>
        </div>

        <div class="rg-right">
          <button class="rg-view">👁</button>
          <button class="rg-request" onclick="sendGroupRequest('${group.group_name}')">Request</button>
        </div>
      </div>
    `;
  });

  groupList.innerHTML = html;
}



async function loadFriendList() {
  const friendListBox = document.getElementById("friendListBox");
  const titleEl = document.getElementById("friendListTitle");

  if (!friendListBox) return;

  const myId = String(localStorage.getItem("studentId") || "").trim();
  const friendListOwner = String(localStorage.getItem("friendListOwner") || "").trim();

  const currentStudentId = friendListOwner || myId;

  if (titleEl) {
    if (friendListOwner && friendListOwner !== myId) {
      titleEl.textContent = `${friendListOwner} Friendlist :`;
    } else {
      titleEl.textContent = "Your Friendlist :";
    }
  }

  try {
    const res = await fetch(`http://localhost:3000/friends?currentStudentId=${encodeURIComponent(currentStudentId)}`);
    const data = await res.json();

    console.log("currentStudentId =", currentStudentId);
    console.log("friends from server =", data);

    let html = "";

    data.forEach(friend => {
      if (String(friend.student_id).trim() === currentStudentId) return;

      html += `
        <div class="friend-item" onclick="openFriendProfile('${friend.student_id}')">
          <div class="avatar"></div>
          <div class="name-bar">${friend.student_id}</div>
        </div>
      `;
    });

    friendListBox.innerHTML = html;
  } catch (err) {
    console.error(err);
    friendListBox.innerHTML = "<p>Cannot load friend list.</p>";
  }
}



function openMyFriendList() {
  localStorage.removeItem("friendListOwner");

  if (window.parent && window.parent !== window && typeof window.parent.loadPage === "function") {
    window.parent.loadPage("FriendList.html");
  } else {
    loadPage("FriendList.html");
  }
}


function openFriendFriendList() {
  const friendId = localStorage.getItem("selectedFriendId");
  localStorage.setItem("friendListOwner", friendId);

  if (window.parent && window.parent !== window && typeof window.parent.loadPage === "function") {
    window.parent.loadPage("FriendList.html");
  } else {
    loadPage("FriendList.html");
  }
}

function openFriendProfile(studentId) {
  localStorage.setItem("selectedFriendId", studentId);

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      action: "OPEN_FRIEND_PROFILE",
      studentId: studentId
    }, "*");
  } else {
    loadPage("userProfile.html");
  }
}

async function loadFriendProfile() {
  const friendId = localStorage.getItem("selectedFriendId");
  console.log("selectedFriendId =", friendId);

  if (!friendId) return;

  const firstNameEl = document.getElementById("friendFirstNameText");
  const lastNameEl = document.getElementById("friendLastNameText");
  const ratingEl = document.getElementById("ratingText");

  if (!firstNameEl || !lastNameEl) {
    console.log("friend profile elements not found");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/friend-profile/${friendId}`);
    const data = await res.json();

    console.log("friend profile data =", data);

    if (!data.user) return;

    firstNameEl.textContent = data.user.first_name || "";
    lastNameEl.textContent = data.user.last_name || "";

    const strongs = (data.strongSubjects || []).map(s => s.subject_name);

    const s1 = document.getElementById("strong1");
    const s2 = document.getElementById("strong2");
    const s3 = document.getElementById("strong3");
    const s4 = document.getElementById("strong4");

    if (s1) s1.textContent = strongs[0] || "";
    if (s2) s2.textContent = strongs[1] || "";
    if (s3) s3.textContent = strongs[2] || "";
    if (s4) s4.textContent = strongs[3] || "";

    if (ratingEl) {
      ratingEl.textContent = (Math.random() * 1 + 4).toFixed(1);
    }
  } catch (err) {
    console.error("loadFriendProfile error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFriendList();
  loadFriendProfile();
  renderRecommendedPeople();
  renderRecommendedGroups();
});