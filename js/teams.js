document.addEventListener("DOMContentLoaded", async () => {
    const { data, error } = await OvertimeDB.getTeams();
    const grid = document.getElementById("teamGrid");

    if (error || !data?.length) {
        grid.innerHTML = `<div class="loading-card">No teams have been added yet.</div>`;
        return;
    }

    grid.innerHTML = data.map(team => `
        <article class="entity-card">
            <div class="entity-logo">
                ${team.logo_url
                    ? `<img src="${e(team.logo_url)}" alt="${e(team.name)}">`
                    : e(team.short_name || team.name.substring(0,3).toUpperCase())}
            </div>
            <h3>${e(team.name)}</h3>
            <p>${e(team.description || "Rocket League esports team.")}</p>
            <div class="entity-meta">${e(team.region || team.country || "GLOBAL")}</div>
        </article>
    `).join("");
});

function e(v) {
    return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
