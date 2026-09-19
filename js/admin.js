const OWNER_UID = "a2f2dda0-e1dc-46fe-bd16-e234933372fb";

let currentPage = "dashboard";
let currentEdit = null;

let cache = {
    teams: [],
    players: [],
    events: [],
    matches: [],
    streams: [],
    news: [],
    standings: []
};

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
    bindGlobalEvents();

    const user = await OvertimeDB.getCurrentUser();

    if (user?.id === OWNER_UID) {
        showAdmin();
    } else {
        await OvertimeDB.adminLogout();
        showLogin();
    }
}

function bindGlobalEvents() {
    document.getElementById("loginForm").onsubmit = login;

    document.getElementById("logoutButton").onclick = async () => {
        await OvertimeDB.adminLogout();
        location.reload();
    };

    document.querySelectorAll(".admin-nav-button").forEach(button => {
        button.onclick = () => switchPage(button.dataset.page);
    });

    document.getElementById("closeModal").onclick = closeModal;
    document.getElementById("cancelModal").onclick = closeModal;
    document.getElementById("modalBackdrop").onclick = closeModal;

    document.getElementById("entityForm").onsubmit = saveEntity;

    document.getElementById("primaryAction").onclick = () => {
        if (currentPage === "settings") return;
        openEditor(currentPage);
    };
}

async function login(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await OvertimeDB.adminLogin(email,password);

    if (error) {
        document.getElementById("loginError").textContent = error.message;
        return;
    }

    if (data.user?.id !== OWNER_UID) {
        await OvertimeDB.adminLogout();
        document.getElementById("loginError").textContent =
            "This account is not authorized for Overtime Admin.";
        return;
    }

    showAdmin();
}

function showLogin() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("adminApp").classList.add("hidden");
}

function showAdmin() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("adminApp").classList.remove("hidden");
    switchPage("dashboard");
}

async function switchPage(page) {
    currentPage = page;

    document.querySelectorAll(".admin-nav-button").forEach(button => {
        button.classList.toggle("active",button.dataset.page === page);
    });

    document.getElementById("adminPageTitle").textContent =
        titleCase(page);

    const add = document.getElementById("primaryAction");

    if (["matches","teams","players","events","streams","news","standings"].includes(page)) {
        add.classList.remove("hidden");
        add.textContent = `+ ADD ${page === "news" ? "ARTICLE" : page.slice(0,-1).toUpperCase()}`;
    } else {
        add.classList.add("hidden");
    }

    if (page === "dashboard") return renderDashboard();
    if (page === "settings") return renderSettings();

    await renderEntityPage(page);
}

async function refreshCache() {
    const [
        teams,
        players,
        events,
        matches,
        streams,
        news,
        standings
    ] = await Promise.all([
        OvertimeDB.client.from("teams").select("*").order("name"),
        OvertimeDB.client.from("players").select("*").order("gamer_tag"),
        OvertimeDB.client.from("events").select("*").order("start_date",{ascending:false}),
        OvertimeDB.client.from("matches").select("*").order("scheduled_at",{ascending:false}),
        OvertimeDB.client.from("streams").select("*").order("sort_order"),
        OvertimeDB.client.from("news").select("*").order("created_at",{ascending:false}),
        OvertimeDB.client.from("standings").select("*").order("position")
    ]);

    cache.teams = teams.data || [];
    cache.players = players.data || [];
    cache.events = events.data || [];
    cache.matches = matches.data || [];
    cache.streams = streams.data || [];
    cache.news = news.data || [];
    cache.standings = standings.data || [];
}

async function renderDashboard() {
    await refreshCache();

    const live = cache.matches.filter(x => x.status === "live").length;

    document.getElementById("adminContent").innerHTML = `
        <div class="stat-grid">
            ${stat("TEAMS",cache.teams.length)}
            ${stat("PLAYERS",cache.players.length)}
            ${stat("EVENTS",cache.events.length)}
            ${stat("LIVE MATCHES",live)}
        </div>

        <section class="admin-section">
            <h2>Content Overview</h2>
            <div class="stat-grid">
                ${stat("MATCHES",cache.matches.length)}
                ${stat("STREAMS",cache.streams.length)}
                ${stat("NEWS ARTICLES",cache.news.length)}
                ${stat("STANDINGS",cache.standings.length)}
            </div>
        </section>
    `;
}

function stat(label,value) {
    return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
}

async function renderEntityPage(type) {
    await refreshCache();

    const data = cache[type] || [];
    const content = document.getElementById("adminContent");

    if (!data.length) {
        content.innerHTML =
            `<div class="admin-empty">No ${escapeHTML(type)} have been added yet.</div>`;
        return;
    }

    const columns = tableColumns(type);

    content.innerHTML = `
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr>
                        ${columns.map(x => `<th>${x.label}</th>`).join("")}
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${columns.map(col => `<td>${escapeHTML(displayValue(type,item,col.key))}</td>`).join("")}
                            <td>
                                <div class="table-actions">
                                    <button data-edit="${item.id}">Edit</button>
                                    <button class="delete" data-delete="${item.id}">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    content.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = () =>
            openEditor(type,data.find(x => x.id === button.dataset.edit));
    });

    content.querySelectorAll("[data-delete]").forEach(button => {
        button.onclick = () => deleteEntity(type,button.dataset.delete);
    });
}

function tableColumns(type) {
    const map = {
        teams:[
            {label:"NAME",key:"name"},
            {label:"SHORT",key:"short_name"},
            {label:"REGION",key:"region"}
        ],
        players:[
            {label:"PLAYER",key:"gamer_tag"},
            {label:"TEAM",key:"team_id"},
            {label:"ROLE",key:"role"}
        ],
        events:[
            {label:"EVENT",key:"name"},
            {label:"STATUS",key:"status"},
            {label:"START",key:"start_date"}
        ],
        matches:[
            {label:"TEAM 1",key:"team1_id"},
            {label:"TEAM 2",key:"team2_id"},
            {label:"STATUS",key:"status"},
            {label:"DATE",key:"scheduled_at"}
        ],
        streams:[
            {label:"NAME",key:"name"},
            {label:"PLATFORM",key:"platform"},
            {label:"CHANNEL",key:"channel"},
            {label:"ACTIVE",key:"active"}
        ],
        news:[
            {label:"TITLE",key:"title"},
            {label:"PUBLISHED",key:"published"},
            {label:"FEATURED",key:"featured"}
        ],
        standings:[
            {label:"EVENT",key:"event_id"},
            {label:"TEAM",key:"team_id"},
            {label:"POSITION",key:"position"},
            {label:"WINS",key:"wins"}
        ]
    };

    return map[type] || [];
}

function displayValue(type,item,key) {
    if (key === "team_id" || key === "team1_id" || key === "team2_id")
        return cache.teams.find(x => x.id === item[key])?.name || "—";

    if (key === "event_id")
        return cache.events.find(x => x.id === item[key])?.name || "—";

    if (typeof item[key] === "boolean")
        return item[key] ? "Yes" : "No";

    if (key === "scheduled_at" && item[key])
        return new Date(item[key]).toLocaleString();

    return item[key] ?? "—";
}

async function openEditor(type,item=null) {
    await refreshCache();

    currentEdit = {
        type,
        id:item?.id || null
    };

    document.getElementById("modalTitle").textContent =
        `${item ? "Edit" : "Add"} ${type === "news" ? "Article" : titleCase(type.slice(0,-1))}`;

    document.getElementById("formFields").innerHTML =
        buildForm(type,item || {});

    document.getElementById("modal").classList.remove("hidden");
}

function buildForm(type,item) {
    if (type === "teams") return `
        ${field("name","Name",item.name,true)}
        <div class="form-row">
            ${field("short_name","Short Name",item.short_name)}
            ${field("region","Region",item.region)}
        </div>
        ${field("slug","Slug",item.slug,true)}
        ${field("logo_url","Logo URL",item.logo_url)}
        ${field("country","Country",item.country)}
        ${textarea("description","Description",item.description)}
    `;

    if (type === "players") return `
        ${field("gamer_tag","Gamer Tag",item.gamer_tag,true)}
        ${field("real_name","Real Name",item.real_name)}
        ${field("slug","Slug",item.slug,true)}
        ${select("team_id","Team",cache.teams,item.team_id,"name")}
        ${field("country","Country",item.country)}
        ${field("role","Role",item.role || "Player")}
        ${field("photo_url","Photo URL",item.photo_url)}
        ${checkbox("active","Active",item.active ?? true)}
    `;

    if (type === "events") return `
        ${field("name","Event Name",item.name,true)}
        <div class="form-row">
            ${field("short_name","Short Name",item.short_name)}
            ${field("slug","Slug",item.slug,true)}
        </div>
        ${textarea("description","Description",item.description)}
        ${field("logo_url","Logo URL",item.logo_url)}
        ${field("banner_url","Banner URL",item.banner_url)}
        <div class="form-row">
            ${field("start_date","Start Date",item.start_date,false,"date")}
            ${field("end_date","End Date",item.end_date,false,"date")}
        </div>
        ${field("location","Location",item.location)}
        ${field("prize_pool","Prize Pool",item.prize_pool)}
        ${field("format","Format",item.format)}
        ${enumSelect("status","Status",["upcoming","live","completed"],item.status)}
        ${checkbox("featured","Featured Event",item.featured)}
    `;

    if (type === "matches") return `
        ${select("event_id","Event",cache.events,item.event_id,"name")}
        <div class="form-row">
            ${select("team1_id","Team 1",cache.teams,item.team1_id,"name",true)}
            ${select("team2_id","Team 2",cache.teams,item.team2_id,"name",true)}
        </div>
        <div class="form-row">
            ${field("team1_score","Team 1 Score",item.team1_score ?? 0,false,"number")}
            ${field("team2_score","Team 2 Score",item.team2_score ?? 0,false,"number")}
        </div>
        <div class="form-row">
            ${field("best_of","Best Of",item.best_of || 5,false,"number")}
            ${field("round_name","Round",item.round_name)}
        </div>
        ${field("scheduled_at","Scheduled Time",toLocalInput(item.scheduled_at),false,"datetime-local")}
        ${enumSelect("status","Status",["upcoming","live","completed"],item.status)}
        ${field("stream_url","Stream URL",item.stream_url)}
        ${checkbox("featured","Featured Match",item.featured)}
    `;

    if (type === "streams") return `
        ${field("name","Display Name",item.name,true)}
        ${enumSelect("platform","Platform",["twitch","youtube"],item.platform || "twitch")}
        ${field("channel","Channel / Embed URL",item.channel,true)}
        ${field("description","Description",item.description)}
        <div class="form-row">
            ${field("icon_text","Icon Text",item.icon_text || "RL")}
            ${field("sort_order","Sort Order",item.sort_order || 0,false,"number")}
        </div>
        ${checkbox("active","Active",item.active ?? true)}
    `;

    if (type === "news") return `
        ${field("title","Headline",item.title,true)}
        ${field("slug","Slug",item.slug,true)}
        ${textarea("excerpt","Excerpt",item.excerpt)}
        ${textarea("content","Article Content",item.content)}
        ${field("image_url","Image URL",item.image_url)}
        ${field("author","Author",item.author || "Overtime")}
        ${field("published_at","Publish Date",toLocalInput(item.published_at),false,"datetime-local")}
        ${checkbox("published","Published",item.published)}
        ${checkbox("featured","Featured",item.featured)}
    `;

    if (type === "standings") return `
        ${select("event_id","Event",cache.events,item.event_id,"name",true)}
        ${select("team_id","Team",cache.teams,item.team_id,"name",true)}
        <div class="form-row">
            ${field("position","Position",item.position || 1,false,"number")}
            ${field("points","Points",item.points || 0,false,"number")}
        </div>
        <div class="form-row">
            ${field("wins","Wins",item.wins || 0,false,"number")}
            ${field("losses","Losses",item.losses || 0,false,"number")}
        </div>
        <div class="form-row">
            ${field("games_won","Games Won",item.games_won || 0,false,"number")}
            ${field("games_lost","Games Lost",item.games_lost || 0,false,"number")}
        </div>
    `;

    return "";
}

function field(name,label,value="",required=false,type="text") {
    return `
    <div class="form-group">
        <label>${label}</label>
        <input name="${name}" type="${type}" value="${escapeAttribute(value ?? "")}" ${required ? "required" : ""}>
    </div>`;
}

function textarea(name,label,value="") {
    return `
    <div class="form-group">
        <label>${label}</label>
        <textarea name="${name}">${escapeHTML(value ?? "")}</textarea>
    </div>`;
}

function checkbox(name,label,checked=false) {
    return `
    <label class="form-check">
        <input name="${name}" type="checkbox" ${checked ? "checked" : ""}>
        ${label}
    </label>`;
}

function enumSelect(name,label,values,current="") {
    return `
    <div class="form-group">
        <label>${label}</label>
        <select name="${name}">
            ${values.map(v => `<option value="${v}" ${v === current ? "selected" : ""}>${titleCase(v)}</option>`).join("")}
        </select>
    </div>`;
}

function select(name,label,items,current,key,required=false) {
    return `
    <div class="form-group">
        <label>${label}</label>
        <select name="${name}" ${required ? "required" : ""}>
            <option value="">None / TBD</option>
            ${items.map(item => `
                <option value="${item.id}" ${item.id === current ? "selected" : ""}>
                    ${escapeHTML(item[key])}
                </option>
            `).join("")}
        </select>
    </div>`;
}

async function saveEntity(event) {
    event.preventDefault();

    const form = new FormData(event.target);
    const values = {};

    for (const [key,value] of form.entries()) {
        values[key] = value === "" ? null : value;
    }

    event.target.querySelectorAll('input[type="checkbox"]').forEach(input => {
        values[input.name] = input.checked;
    });

    normalizeValues(currentEdit.type,values);

    let result;

    if (currentEdit.id) {
        result = await OvertimeDB.adminUpdate(
            currentEdit.type,
            currentEdit.id,
            values
        );
    } else {
        result = await OvertimeDB.adminInsert(
            currentEdit.type,
            values
        );
    }

    if (result.error) {
        toast(result.error.message);
        return;
    }

    closeModal();
    toast("Saved successfully.");
    await switchPage(currentPage);
}

function normalizeValues(type,v) {
    const numeric = {
        matches:["team1_score","team2_score","best_of"],
        streams:["sort_order"],
        standings:["position","points","wins","losses","games_won","games_lost"]
    };

    (numeric[type] || []).forEach(key => {
        if (v[key] !== null)
            v[key] = Number(v[key]);
    });

    if (type === "matches" && v.scheduled_at)
        v.scheduled_at = new Date(v.scheduled_at).toISOString();

    if (type === "news" && v.published_at)
        v.published_at = new Date(v.published_at).toISOString();
}

async function deleteEntity(type,id) {
    if (!confirm("Delete this item? This cannot be undone."))
        return;

    const result = await OvertimeDB.adminDelete(type,id);

    if (result.error) {
        toast(result.error.message);
        return;
    }

    toast("Deleted.");
    await switchPage(currentPage);
}

async function renderSettings() {
    const { data, error } =
        await OvertimeDB.client
            .from("site_settings")
            .select("*")
            .eq("id",1)
            .single();

    if (error) {
        document.getElementById("adminContent").innerHTML =
            `<div class="admin-empty">${escapeHTML(error.message)}</div>`;
        return;
    }

    document.getElementById("adminContent").innerHTML = `
        <form id="settingsForm" class="settings-card">
            ${field("site_name","Site Name",data.site_name)}
            ${field("tagline","Tagline",data.tagline)}
            ${field("hero_title","Hero Title",data.hero_title)}
            ${textarea("hero_description","Hero Description",data.hero_description)}
            <div class="modal-actions">
                <button class="save-button" type="submit">Save Settings</button>
            </div>
        </form>
    `;

    document.getElementById("settingsForm").onsubmit = async event => {
        event.preventDefault();

        const values = Object.fromEntries(new FormData(event.target));

        const result = await OvertimeDB.client
            .from("site_settings")
            .update(values)
            .eq("id",1);

        toast(result.error ? result.error.message : "Settings saved.");
    };
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    currentEdit = null;
}

function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.remove("hidden");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        el.classList.add("hidden");
    },3000);
}

function titleCase(value) {
    return String(value)
        .replaceAll("_"," ")
        .replace(/\b\w/g,c => c.toUpperCase());
}

function toLocalInput(value) {
    if (!value) return "";

    const d = new Date(value);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000)
        .toISOString()
        .slice(0,16);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}
