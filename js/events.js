document.addEventListener("DOMContentLoaded", async () => {
    const { data, error } = await OvertimeDB.getEvents();
    const grid = document.getElementById("eventGrid");

    if (error || !data?.length) {
        grid.innerHTML = `<div class="loading-card">No events have been added yet.</div>`;
        return;
    }

    grid.innerHTML = data.map(event => `
        <article class="event-card">
            <div class="event-card-art">
                ${event.banner_url || event.logo_url
                    ? `<img src="${safe(event.banner_url || event.logo_url)}" alt="">`
                    : `<span>OT</span>`}
            </div>
            <div class="event-card-body">
                <span class="event-status">${escapeText(event.status).toUpperCase()}</span>
                <h3>${escapeText(event.name)}</h3>
                <p>${escapeText(event.description || "Rocket League esports competition.")}</p>
                <div class="event-card-meta">
                    <span>${date(event.start_date)}</span>
                    <span>${escapeText(event.location || "TBA")}</span>
                </div>
            </div>
        </article>
    `).join("");
});

function date(v) {
    if (!v) return "TBA";
    return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(v));
}

function escapeText(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[c]);
}

function safe(v) { return escapeText(v); }
