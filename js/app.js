// =============================================
// OVERTIME — HOMEPAGE
// =============================================

document.addEventListener("DOMContentLoaded", initHomepage);

async function initHomepage() {

    await Promise.all([
        loadSiteSettings(),
        loadHeroStats(),
        loadLiveMatches(),
        loadUpcomingMatches(),
        loadResults(),
        loadFeaturedEvent(),
        loadHomepageNews()
    ]);

}


// =============================================
// SETTINGS
// =============================================

async function loadSiteSettings() {

    const { data, error } =
        await OvertimeDB.getSiteSettings();

    if (error || !data) {
        return;
    }

    const description =
        document.getElementById(
            "heroDescription"
        );

    if (
        description &&
        data.hero_description
    ) {
        description.textContent =
            data.hero_description;
    }

}


// =============================================
// HERO STATS
// =============================================

async function loadHeroStats() {

    const [
        liveResult,
        teamsResult,
        eventsResult
    ] = await Promise.all([

        OvertimeDB.getLiveMatches(),
        OvertimeDB.getTeams(),
        OvertimeDB.getEvents()

    ]);

    setText(
        "heroLiveCount",
        liveResult.data
            ? liveResult.data.length
            : 0
    );

    setText(
        "heroTeamCount",
        teamsResult.data
            ? teamsResult.data.length
            : 0
    );

    setText(
        "heroEventCount",
        eventsResult.data
            ? eventsResult.data.length
            : 0
    );

}


// =============================================
// LIVE MATCHES
// =============================================

async function loadLiveMatches() {

    const { data, error } =
        await OvertimeDB.getLiveMatches();

    const section =
        document.getElementById(
            "liveSection"
        );

    const container =
        document.getElementById(
            "liveMatches"
        );

    if (
        error ||
        !data ||
        data.length === 0
    ) {
        section.classList.add(
            "hidden"
        );

        return;
    }

    section.classList.remove(
        "hidden"
    );

    container.innerHTML =
        data
            .map(match =>
                createMatchCard(match)
            )
            .join("");

}


// =============================================
// UPCOMING
// =============================================

async function loadUpcomingMatches() {

    const { data, error } =
        await OvertimeDB
            .getUpcomingMatches(6);

    const container =
        document.getElementById(
            "upcomingMatches"
        );

    if (
        error ||
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            emptyCard(
                "No upcoming matches have been added yet."
            );

        return;
    }

    container.innerHTML =
        data
            .map(match =>
                createMatchCard(match)
            )
            .join("");

}


// =============================================
// RESULTS
// =============================================

async function loadResults() {

    const { data, error } =
        await OvertimeDB
            .getRecentResults(6);

    const container =
        document.getElementById(
            "recentResults"
        );

    if (
        error ||
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            emptyCard(
                "No results have been added yet."
            );

        return;
    }

    container.innerHTML =
        data
            .map(match =>
                createMatchCard(match)
            )
            .join("");

}


// =============================================
// MATCH CARD
// =============================================

function createMatchCard(match) {

    const team1 =
        match.team1 || {};

    const team2 =
        match.team2 || {};

    const event =
        match.event || {};

    const status =
        match.status ||
        "upcoming";

    const date =
        formatMatchDate(
            match.scheduled_at
        );

    return `
        <article class="match-card ${escapeHTML(status)}">

            <div class="match-top">

                <span>
                    ${escapeHTML(
                        event.short_name ||
                        event.name ||
                        "Overtime"
                    )}
                </span>

                <span class="match-status ${escapeHTML(status)}">
                    ${status === "completed"
                        ? "FINAL"
                        : escapeHTML(status)}
                </span>

            </div>

            <div class="match-teams">

                ${createTeamRow(
                    team1,
                    match.team1_score,
                    status
                )}

                ${createTeamRow(
                    team2,
                    match.team2_score,
                    status
                )}

            </div>

            <div class="match-bottom">

                <span>
                    ${escapeHTML(
                        match.round_name ||
                        `Best of ${match.best_of || 5}`
                    )}
                </span>

                <span>
                    ${escapeHTML(date)}
                </span>

            </div>

        </article>
    `;

}


// =============================================
// TEAM ROW
// =============================================

function createTeamRow(
    team,
    score,
    status
) {

    const name =
        team.name ||
        "TBD";

    const short =
        team.short_name ||
        name.substring(0,3)
            .toUpperCase();

    let logo;

    if (team.logo_url) {

        logo = `
            <img
                src="${escapeAttribute(team.logo_url)}"
                alt="${escapeAttribute(name)}"
            >
        `;

    }

    else {

        logo =
            escapeHTML(short);

    }

    const scoreText =
        status === "upcoming"
            ? "–"
            : Number(score || 0);

    return `
        <div class="match-team">

            <div class="team-logo">
                ${logo}
            </div>

            <div class="match-team-name">
                ${escapeHTML(name)}
            </div>

            <div class="team-score">
                ${scoreText}
            </div>

        </div>
    `;

}


// =============================================
// FEATURED EVENT
// =============================================

async function loadFeaturedEvent() {

    const { data, error } =
        await OvertimeDB
            .getFeaturedEvent();

    const container =
        document.getElementById(
            "featuredEvent"
        );

    if (
        error ||
        !data
    ) {

        container.innerHTML =
            emptyCard(
                "Choose a featured event from the Overtime admin panel.",
                true
            );

        return;
    }

    const start =
        formatDate(data.start_date);

    const end =
        formatDate(data.end_date);

    let art;

    if (
        data.banner_url ||
        data.logo_url
    ) {

        art = `
            <img
                src="${escapeAttribute(
                    data.banner_url ||
                    data.logo_url
                )}"
                alt="${escapeAttribute(data.name)}"
            >
        `;

    }

    else {

        art = `
            <div class="event-placeholder">
                OT
            </div>
        `;

    }

    container.innerHTML = `

        <article class="featured-event">

            <div class="featured-event-content">

                <span class="event-status">
                    ${escapeHTML(
                        data.status.toUpperCase()
                    )}
                </span>

                <h3>
                    ${escapeHTML(data.name)}
                </h3>

                <p>
                    ${escapeHTML(
                        data.description ||
                        "Follow the latest matches, results and standings from this event."
                    )}
                </p>

                <div class="event-meta">

                    <div>
                        <span>DATES</span>

                        <strong>
                            ${escapeHTML(
                                start +
                                (
                                    end
                                        ? " — " + end
                                        : ""
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>LOCATION</span>

                        <strong>
                            ${escapeHTML(
                                data.location ||
                                "TBA"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>PRIZE POOL</span>

                        <strong>
                            ${escapeHTML(
                                data.prize_pool ||
                                "TBA"
                            )}
                        </strong>
                    </div>

                </div>

            </div>

            <div class="featured-event-art">
                ${art}
            </div>

        </article>
    `;

}


// =============================================
// NEWS
// =============================================

async function loadHomepageNews() {

    let { data, error } =
        await OvertimeDB
            .getFeaturedNews(3);

    if (
        !error &&
        (!data || data.length === 0)
    ) {

        const result =
            await OvertimeDB.getNews(3);

        data =
            result.data;

        error =
            result.error;

    }

    const container =
        document.getElementById(
            "newsGrid"
        );

    if (
        error ||
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            emptyCard(
                "No Overtime news has been published yet."
            );

        return;
    }

    container.innerHTML =
        data
            .map(article =>
                createNewsCard(article)
            )
            .join("");

}


// =============================================
// NEWS CARD
// =============================================

function createNewsCard(article) {

    let image;

    if (article.image_url) {

        image = `
            <img
                src="${escapeAttribute(article.image_url)}"
                alt="${escapeAttribute(article.title)}"
            >
        `;

    }

    else {

        image = `
            <div class="news-image-placeholder">
                OT
            </div>
        `;

    }

    return `
        <article class="news-card">

            <div class="news-image">
                ${image}
            </div>

            <div class="news-content">

                <span class="news-date">
                    ${escapeHTML(
                        formatDate(
                            article.published_at ||
                            article.created_at
                        )
                    )}
                </span>

                <h3>
                    ${escapeHTML(
                        article.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        article.excerpt ||
                        ""
                    )}
                </p>

            </div>

        </article>
    `;

}


// =============================================
// HELPERS
// =============================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }

}


function emptyCard(
    text,
    large = false
) {

    return `
        <div class="loading-card ${large ? "large" : ""}">
            ${escapeHTML(text)}
        </div>
    `;

}


function formatMatchDate(value) {

    if (!value) {
        return "TBA";
    }

    const date =
        new Date(value);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);

}


function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(date);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {
    return escapeHTML(value);
}
