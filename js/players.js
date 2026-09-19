document.addEventListener("DOMContentLoaded", async () => {
    const { data, error } = await OvertimeDB.getPlayers();
    const grid = document.getElementById("playerGrid");

    if (error || !data?.length) {
        grid.innerHTML = `<div class="loading-card">No players have been added yet.</div>`;
        return;
    }

    grid.innerHTML = data.map(player => `
        <article class="entity-card">
            <div class="entity-logo">
                ${player.photo_url
                    ? `<img src="${x(player.photo_url)}" alt="${x(player.gamer_tag)}">`
                    : x(player.gamer_tag.substring(0,2).toUpperCase())}
            </div>
            <h3>${x(player.gamer_tag)}</h3>
            <p>${x(player.real_name || player.role || "Player")}</p>
            <div class="entity-meta">${x(player.team?.name || "FREE AGENT")}</div>
        </article>
    `).join("");
});

function x(v) {
    return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
