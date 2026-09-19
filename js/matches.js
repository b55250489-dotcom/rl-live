let allMatches = [];

document.addEventListener("DOMContentLoaded", async () => {
    const result = await OvertimeDB.getMatches();

    if (result.error) {
        showMatchesMessage("Unable to load matches.");
        return;
    }

    allMatches = result.data || [];
    renderMatches(allMatches);

    document.querySelectorAll(".filter-button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".filter-button")
                .forEach(x => x.classList.remove("active"));

            button.classList.add("active");

            const filter = button.dataset.filter;

            renderMatches(
                filter === "all"
                    ? allMatches
                    : allMatches.filter(match => match.status === filter)
            );
        });
    });
});

function renderMatches(matches) {
    const grid = document.getElementById("matchesGrid");

    if (!matches.length) {
        grid.innerHTML = `<div class="loading-card">No matches found.</div>`;
        return;
    }

    grid.innerHTML = matches.map(matchCard).join("");
}

function matchCard(match) {
    const t1 = match.team1 || {};
    const t2 = match.team2 || {};
    const event = match.event || {};
    const upcoming = match.status === "upcoming";

    return `
    <article class="match-card ${esc(match.status)}">
        <div class="match-top">
            <span>${esc(event.short_name || event.name || "Overtime")}</span>
            <span class="match-status ${esc(match.status)}">
                ${match.status === "completed" ? "FINAL" : esc(match.status)}
            </span>
        </div>

        <div class="match-teams">
            ${teamRow(t1, upcoming ? "–" : match.team1_score)}
            ${teamRow(t2, upcoming ? "–" : match.team2_score)}
        </div>

        <div class="match-bottom">
            <span>${esc(match.round_name || `Best of ${match.best_of || 5}`)}</span>
            <span>${formatTime(match.scheduled_at)}</span>
        </div>
    </article>`;
}

function teamRow(team, score) {
    const name = team.name || "TBD";
    const short = team.short_name || name.substring(0,3).toUpperCase();

    return `
    <div class="match-team">
        <div class="team-logo">
            ${team.logo_url
                ? `<img src="${attr(team.logo_url)}" alt="${attr(name)}">`
                : esc(short)}
        </div>
        <div class="match-team-name">${esc(name)}</div>
        <div class="team-score">${score ?? 0}</div>
    </div>`;
}

function showMatchesMessage(text) {
    document.getElementById("matchesGrid").innerHTML =
        `<div class="loading-card">${esc(text)}</div>`;
}

function formatTime(value) {
    if (!value) return "TBA";

    return new Intl.DateTimeFormat("en-US", {
        month:"short",
        day:"numeric",
        hour:"numeric",
        minute:"2-digit"
    }).format(new Date(value));
}

function esc(value) {
    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function attr(value) {
    return esc(value);
}
