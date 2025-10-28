// public/js/admin.js

document.addEventListener("DOMContentLoaded", () => {
    const tabEvents = document.getElementById("tab-events");
    const tabUsers = document.getElementById("tab-users");
    const sectionEvents = document.getElementById("section-events");
    const sectionUsers = document.getElementById("section-users");
    const eventsTable = document.getElementById("eventsTable");
    const usersTable = document.getElementById("usersTable");
    const msg = document.getElementById("msg");
    const searchInput = document.querySelector(".search-container input");
    const addEventBtn = document.getElementById("addEventBtn");
    const eventFormContainer = document.getElementById("eventFormContainer");

    function showMsg(text, color = "#333", timeout = 3000) {
        msg.textContent = text;
        msg.style.color = color;
        msg.style.display = "block";
        if (timeout > 0) {
            setTimeout(() => {
                msg.textContent = "";
                msg.style.display = "none";
            }, timeout);
        }
    }

    addEventBtn.onclick = () => {
        if (eventFormContainer.innerHTML.trim()) return; 
        eventFormContainer.style.display = "block";
       eventFormContainer.innerHTML = `
  <form id="addEventForm">
    <input name="title" placeholder="שם האירוע" required />
    <input name="location" placeholder="מיקום" required />
    <input name="time" type="time" required />
    <input name="type" placeholder="סוג האירוע (football/concert/...)" required />
    <input name="event_date" type="date" required />
    <button type="submit">הוסף אירוע</button>
    <button type="button" id="cancelAddEvent">ביטול</button>
  </form>
`;


    
        document.getElementById("cancelAddEvent").onclick = () => {
            eventFormContainer.innerHTML = "";
            eventFormContainer.style.display = "none";
        };
        document.getElementById("addEventForm").onsubmit = async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            try {
                const res = await fetch("/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                showMsg(data.message || "אירוע נוסף", "#22C55E");
                eventFormContainer.innerHTML = "";
                eventFormContainer.style.display = "none";
                loadEvents();
            } catch {
                showMsg("שגיאה בהוספת אירוע", "#F87171");
            }
        };
    };

    tabEvents.onclick = () => {
        tabEvents.classList.add("active");
        tabUsers.classList.remove("active");
        sectionEvents.style.display = "";
        sectionUsers.style.display = "none";
        loadEvents();
    };
    tabUsers.onclick = () => {
        tabUsers.classList.add("active");
        tabEvents.classList.remove("active");
        sectionEvents.style.display = "none";
        sectionUsers.style.display = "";
        loadUsers();
    };

    async function loadEvents(filter = "") {
        eventsTable.innerHTML = "<tr><th>מס' אירוע</th><th>כותרת</th><th>סוג</th><th>תאריך</th><th>שעה</th><th>מיקום</th><th>פעולות</th></tr>";
        try {
            const res = await fetch("/events");
            const data = await res.json();
            let filtered = data;
            if (filter) {
                filtered = data.filter(e =>
                    (e.title && e.title.includes(filter)) ||
                    (e.location && e.location.includes(filter))
                );
            }
            filtered.forEach(event => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${event.id}</td>
                    <td>${event.title}</td>
                    <td>${event.type || ""}</td>
                    <td>${event.event_date ? event.event_date.split("T")[0] : ""}</td>
                    <td>${event.time || ""}</td>
                    <td>${event.location || ""}</td>
                    <td>
                        <button onclick="editEvent(${event.id})">ערוך</button>
                        <button onclick="deleteEvent(${event.id})">מחק</button>
                    </td>
                `;
                eventsTable.appendChild(tr);
            });
            if (filtered.length === 0) {
                eventsTable.innerHTML += `<tr><td colspan="7">לא נמצאו אירועים</td></tr>`;
            }
        } catch (err) {
            eventsTable.innerHTML += `<tr><td colspan="7">שגיאה בטעינת אירועים</td></tr>`;
        }
    }

    async function loadUsers() {
        usersTable.innerHTML = "<tr><th>מס' משתמש</th><th>שם</th><th>אימייל</th><th>טלפון</th><th>פעולות</th></tr>";
        try {
            const res = await fetch("/users");
            const data = await res.json();
            data.forEach(user => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.phone_number}</td>
                    <td>
                        <button onclick="editUser(${user.id})">ערוך</button>
                        <button onclick="deleteUser(${user.id})">מחק</button>
                    </td>
                `;
                usersTable.appendChild(tr);
            });
            if (data.length === 0) {
                usersTable.innerHTML += `<tr><td colspan="5">לא נמצאו משתמשים</td></tr>`;
            }
        } catch (err) {
            usersTable.innerHTML += `<tr><td colspan="5">שגיאה בטעינת משתמשים</td></tr>`;
        }
    }

    window.deleteEvent = async (id) => {
        if (confirm("האם למחוק אירוע זה?")) {
            try {
                const res = await fetch(`/events/${id}`, { method: "DELETE" });
                const data = await res.json();
                loadEvents();
                showMsg(data.message || "אירוע נמחק", "#22C55E");
            } catch {
                showMsg("שגיאה במחיקת אירוע", "#F87171");
            }
        }
    };

    window.deleteUser = async (id) => {
        if (confirm("האם למחוק משתמש זה?")) {
            try {
                const res = await fetch(`/users/${id}`, { method: "DELETE" });
                const data = await res.json();
                loadUsers();
                showMsg(data.message || "משתמש נמחק", "#22C55E");
            } catch {
                showMsg("שגיאה במחיקת משתמש", "#F87171");
            }
        }
    };

    window.editUser = async (id) => {

        const oldForm = document.getElementById("user-edit-form");
        if (oldForm) oldForm.remove();

        let user;
        try {
            const res = await fetch(`/user/${id}`);
            user = await res.json();
            if (user.message) {
                showMsg("משתמש לא נמצא", "#F87171");
                return;
            }
        } catch {
            showMsg("שגיאה בשליפת משתמש", "#F87171");
            return;
        }

        const row = [...usersTable.rows].find(r => r.cells[0] && Number(r.cells[0].textContent) === Number(id));
        if (!row) return;

        const form = document.createElement("tr");
        form.id = "user-edit-form";
        form.innerHTML = `
            <td colspan="5">
                <form id="editUserForm" style="display:flex;gap:1em;align-items:center">
                    <input name="username" value="${user.username || ""}" required placeholder="שם משתמש" />
                    <input name="email" value="${user.email || ""}" placeholder="אימייל" />
                    <input name="phone_number" value="${user.phone_number || ""}" placeholder="טלפון" />
                    <button type="submit">שמור</button>
                    <button type="button" id="cancelEditUser">ביטול</button>
                </form>
            </td>
        `;
        row.parentNode.insertBefore(form, row.nextSibling);

        form.querySelector("form").onsubmit = async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            try {
                const res = await fetch(`/users/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                showMsg(data.message || "המשתמש עודכן", "#22C55E");
                form.remove();
                loadUsers();
            } catch {
                showMsg("שגיאה בעדכון משתמש", "#F87171");
            }
        };

        form.querySelector("#cancelEditUser").onclick = () => form.remove();
    };

    window.editEvent = async (id) => {

        const oldForm = document.getElementById("event-edit-form");
        if (oldForm) oldForm.remove();

        let event;
        try {
            const res = await fetch(`/events/${id}`);
            event = await res.json();
            if (event.message) {
                showMsg("אירוע לא נמצא", "#F87171");
                return;
            }
        } catch {
            showMsg("שגיאה בשליפת אירוע", "#F87171");
            return;
        }

        const row = [...eventsTable.rows].find(r => r.cells[0] && Number(r.cells[0].textContent) === Number(id));
        if (!row) return;

        const form = document.createElement("tr");
        form.id = "event-edit-form";
        form.innerHTML = `
            <td colspan="7">
                <form id="editEventForm" style="display:flex;gap:1em;align-items:center">
                    <input name="title" value="${event.title || ""}" required placeholder="כותרת" />
                    <input name="type" value="${event.type || ""}" required placeholder="סוג" />
                    <input name="event_date" type="date" value="${event.event_date ? event.event_date.split('T')[0] : ""}" required />
                    <input name="time" value="${event.time || ""}" placeholder="שעה" />
                    <input name="location" value="${event.location || ""}" placeholder="מיקום" />
                    <button type="submit">שמור</button>
                    <button type="button" id="cancelEditEvent">ביטול</button>
                </form>
            </td>
        `;
        row.parentNode.insertBefore(form, row.nextSibling);

        form.querySelector("form").onsubmit = async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            try {
                const res = await fetch(`/events/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                showMsg(data.message || "האירוע עודכן", "#22C55E");
                form.remove();
                loadEvents();
            } catch {
                showMsg("שגיאה בעדכון אירוע", "#F87171");
            }
        };

        form.querySelector("#cancelEditEvent").onclick = () => form.remove();
    };

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const filter = e.target.value.trim();
            loadEvents(filter);
        });
    }

    loadEvents();
});
