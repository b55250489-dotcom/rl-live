let streams = [];
let currentStream = null;
let activeStreams = [];

document.addEventListener("DOMContentLoaded", initWatch);

async function initWatch() {
    const { data, error } = await OvertimeDB.getStreams();

    if (error || !data?.length) {
        document.getElementById("streamList").innerHTML =
            `<div class="loading-card">No active streams.</div>`;
        return;
    }

    streams = data;
    currentStream = streams[0];

    // Start Multi View with up to the first 3 streams,
    // matching the old RL Live behavior.
    activeStreams = streams.slice(0,3).map(x => x.id);

    renderStreamChoices();
    loadMainStream(currentStream);
    renderMulti();

    document.getElementById("singleButton").onclick = () => setMode("single");
    document.getElementById("multiButton").onclick = () => setMode("multi");
    document.getElementById("addStreamBtn").onclick = togglePicker;
}

function twitchURL(channel, autoplay=false, muted=false) {
    return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(OVERTIME_CONFIG.twitchParent)}&autoplay=${autoplay}&muted=${muted}`;
}

function youtubeURL(channel) {
    return channel;
}

function streamURL(stream, autoplay=false, muted=false) {
    if (stream.platform === "youtube")
        return youtubeURL(stream.channel);

    return twitchURL(stream.channel, autoplay, muted);
}

function loadMainStream(stream) {
    currentStream = stream;

    document.getElementById("currentStreamName").textContent = stream.name;
    document.getElementById("mainPlayer").src = streamURL(stream,false,false);

    document.querySelectorAll(".stream-choice").forEach(x => {
        x.classList.toggle("active", x.dataset.id === stream.id);
    });
}

function renderStreamChoices() {
    document.getElementById("streamList").innerHTML = streams.map(stream => `
        <button class="stream-choice ${currentStream?.id === stream.id ? "active" : ""}" data-id="${stream.id}">
            <div class="stream-icon">${html(stream.icon_text || "RL")}</div>
            <div class="stream-copy">
                <strong>${html(stream.name)}</strong>
                <span>${html(stream.description || stream.platform)}</span>
            </div>
        </button>
    `).join("");

    document.querySelectorAll(".stream-choice").forEach(button => {
        button.onclick = () => {
            const stream = streams.find(x => x.id === button.dataset.id);
            if (stream) {
                loadMainStream(stream);
                renderStreamChoices();
            }
        };
    });
}

function setMode(mode) {
    const single = document.getElementById("singleView");
    const multi = document.getElementById("multiView");

    const singleButton = document.getElementById("singleButton");
    const multiButton = document.getElementById("multiButton");

    if (mode === "multi") {
        single.classList.add("hidden");
        multi.classList.remove("hidden");

        singleButton.classList.remove("active");
        multiButton.classList.add("active");

        document.getElementById("mainPlayer").src = "about:blank";

        renderMulti();
    } else {
        multi.classList.add("hidden");
        single.classList.remove("hidden");

        multiButton.classList.remove("active");
        singleButton.classList.add("active");

        document.getElementById("multiGrid").innerHTML = "";

        if (currentStream)
            document.getElementById("mainPlayer").src =
                streamURL(currentStream,false,false);
    }
}

function renderMulti() {
    const grid = document.getElementById("multiGrid");
    const empty = document.getElementById("multiEmpty");

    document.getElementById("multiCount").textContent =
        `${activeStreams.length} ${activeStreams.length === 1 ? "STREAM" : "STREAMS"}`;

    grid.classList.toggle("one", activeStreams.length === 1);

    if (!activeStreams.length) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
    } else {
        empty.classList.add("hidden");

        grid.innerHTML = activeStreams.map(id => {
            const stream = streams.find(x => x.id === id);
            if (!stream) return "";

            return `
            <article class="multi-card">
                <div class="multi-card-header">
                    <strong>${html(stream.name)}</strong>
                    <button data-remove="${stream.id}" title="Remove">×</button>
                </div>

                <div class="multi-video">
                    <iframe
                        src="${html(streamURL(stream,true,true))}"
                        allow="autoplay; fullscreen"
                        allowfullscreen>
                    </iframe>
                </div>
            </article>`;
        }).join("");

        document.querySelectorAll("[data-remove]").forEach(button => {
            button.onclick = () => removeStream(button.dataset.remove);
        });
    }

    renderPicker();
}

function removeStream(id) {
    activeStreams = activeStreams.filter(x => x !== id);
    renderMulti();
}

function addStream(id) {
    if (!activeStreams.includes(id))
        activeStreams.push(id);

    document.getElementById("streamPicker").classList.add("hidden");
    renderMulti();
}

function togglePicker() {
    renderPicker();
    document.getElementById("streamPicker").classList.toggle("hidden");
}

function renderPicker() {
    const picker = document.getElementById("streamPicker");
    const missing = streams.filter(x => !activeStreams.includes(x.id));

    if (!missing.length) {
        picker.innerHTML = `<div class="picker-option">All broadcasts are already selected.</div>`;
        return;
    }

    picker.innerHTML = missing.map(stream => `
        <button class="picker-option" data-add="${stream.id}">
            <span>${html(stream.name)}</span>
            <span>+</span>
        </button>
    `).join("");

    picker.querySelectorAll("[data-add]").forEach(button => {
        button.onclick = () => addStream(button.dataset.add);
    });
}

function html(v) {
    return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
