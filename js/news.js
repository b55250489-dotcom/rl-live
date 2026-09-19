document.addEventListener("DOMContentLoaded", async () => {
    const { data, error } = await OvertimeDB.getNews(100);
    const grid = document.getElementById("allNews");

    if (error || !data?.length) {
        grid.innerHTML = `<div class="loading-card">No news has been published yet.</div>`;
        return;
    }

    grid.innerHTML = data.map(article => `
        <article class="news-card">
            <div class="news-image">
                ${article.image_url
                    ? `<img src="${h(article.image_url)}" alt="">`
                    : `<div class="news-image-placeholder">OT</div>`}
            </div>
            <div class="news-content">
                <span class="news-date">${date(article.published_at || article.created_at)}</span>
                <h3>${h(article.title)}</h3>
                <p>${h(article.excerpt || "")}</p>
            </div>
        </article>
    `).join("");
});

function date(v) {
    return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(v));
}

function h(v) {
    return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
