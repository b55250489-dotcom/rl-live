// =============================================
// OVERTIME — WATCH
// Static Rocket League Broadcast Center
// =============================================

"use strict";


// =============================================
// CONFIG
// =============================================

const TWITCH_PARENT =
    "b55250489-dotcom.github.io";


// =============================================
// AVAILABLE BROADCASTS
// =============================================

const STREAMS = [

    {
        id: "rocketleague",

        name: "Rocket League",

        shortName: "RL",

        platform: "twitch",

        channel: "rocketleague",

        description:
            "Official Rocket League esports broadcast."
    },

    {
        id: "rlesports",

        name: "RL Esports",

        shortName: "RLE",

        platform: "twitch",

        channel: "rlesports",

        description:
            "Rocket League Esports broadcast."
    },

    {
        id: "rocketleague2",

        name: "Rocket League 2",

        shortName: "RL2",

        platform: "twitch",

        channel: "rocketleague2",

        description:
            "Secondary Rocket League esports broadcast."
    }

];


// =============================================
// STATE
// =============================================

let currentStream =
    STREAMS[0];

let activeStreams = [
    "rocketleague",
    "rlesports"
];


// =============================================
// ELEMENTS
// =============================================

const singleViewButton =
    document.getElementById(
        "singleViewButton"
    );

const multiViewButton =
    document.getElementById(
        "multiViewButton"
    );

const singleView =
    document.getElementById(
        "singleView"
    );

const multiView =
    document.getElementById(
        "multiView"
    );

const streamList =
    document.getElementById(
        "streamList"
    );

const singlePlayer =
    document.getElementById(
        "singlePlayer"
    );

const currentStreamName =
    document.getElementById(
        "currentStreamName"
    );

const currentStreamTitle =
    document.getElementById(
        "currentStreamTitle"
    );

const currentStreamDescription =
    document.getElementById(
        "currentStreamDescription"
    );

const openTwitchButton =
    document.getElementById(
        "openTwitchButton"
    );

const multiGrid =
    document.getElementById(
        "multiGrid"
    );

const emptyMulti =
    document.getElementById(
        "emptyMulti"
    );

const addStreamButton =
    document.getElementById(
        "addStreamButton"
    );

const emptyAddButton =
    document.getElementById(
        "emptyAddButton"
    );

const streamModal =
    document.getElementById(
        "streamModal"
    );

const modalBackdrop =
    document.getElementById(
        "modalBackdrop"
    );

const closeModalButton =
    document.getElementById(
        "closeModal"
    );

const modalStreamList =
    document.getElementById(
        "modalStreamList"
    );


// =============================================
// TWITCH
// =============================================

function twitchEmbed(channel) {

    const params =
        new URLSearchParams({
            channel,
            parent: TWITCH_PARENT,
            autoplay: "true",
            muted: "false"
        });

    return (
        "https://player.twitch.tv/?" +
        params.toString()
    );

}


function twitchPage(channel) {

    return (
        "https://www.twitch.tv/" +
        encodeURIComponent(channel)
    );

}


// =============================================
// SINGLE VIEW
// =============================================

function renderStreamList() {

    streamList.innerHTML =
        STREAMS.map(stream => {

            const active =
                stream.id === currentStream.id;

            return `
                <button
                    class="stream-option ${active ? "active" : ""}"
                    data-stream="${escapeHTML(stream.id)}"
                    type="button"
                >

                    <div class="stream-icon">
                        ${escapeHTML(stream.shortName)}
                    </div>

                    <div class="stream-details">

                        <strong>
                            ${escapeHTML(stream.name)}
                        </strong>

                        <span>
                            TWITCH
                        </span>

                    </div>

                </button>
            `;

        }).join("");


    streamList
        .querySelectorAll(
            "[data-stream]"
        )
        .forEach(button => {

            button.onclick = () => {

                const stream =
                    STREAMS.find(
                        item =>
                            item.id ===
                            button.dataset.stream
                    );

                if (stream) {
                    selectStream(stream);
                }

            };

        });

}


function selectStream(stream) {

    currentStream =
        stream;

    renderStreamList();

    renderSinglePlayer();

}


function renderSinglePlayer() {

    currentStreamName.textContent =
        currentStream.name;

    currentStreamTitle.textContent =
        currentStream.name;

    currentStreamDescription.textContent =
        currentStream.description;

    openTwitchButton.href =
        twitchPage(
            currentStream.channel
        );


    singlePlayer.innerHTML = `
        <iframe
            src="${twitchEmbed(currentStream.channel)}"
            allowfullscreen
            scrolling="no"
            allow="autoplay; fullscreen"
            title="${escapeHTML(currentStream.name)}"
        ></iframe>
    `;

}


// =============================================
// VIEW SWITCHING
// =============================================

function showSingleView() {

    singleView.classList.remove(
        "hidden"
    );

    multiView.classList.add(
        "hidden"
    );

    singleViewButton.classList.add(
        "active"
    );

    multiViewButton.classList.remove(
        "active"
    );

}


function showMultiView() {

    singleView.classList.add(
        "hidden"
    );

    multiView.classList.remove(
        "hidden"
    );

    singleViewButton.classList.remove(
        "active"
    );

    multiViewButton.classList.add(
        "active"
    );

    renderMultiView();

}


// =============================================
// MULTI VIEW
// =============================================

function renderMultiView() {

    const selectedStreams =
        activeStreams
            .map(id =>
                STREAMS.find(
                    stream =>
                        stream.id === id
                )
            )
            .filter(Boolean);


    if (
        selectedStreams.length === 0
    ) {

        multiGrid.innerHTML = "";

        multiGrid.classList.add(
            "hidden"
        );

        emptyMulti.classList.remove(
            "hidden"
        );

        return;
    }


    multiGrid.classList.remove(
        "hidden"
    );

    emptyMulti.classList.add(
        "hidden"
    );


    multiGrid.innerHTML =
        selectedStreams
            .map(stream => `
                <article class="multi-card">

                    <div class="multi-card-header">

                        <div class="multi-card-name">

                            <span class="live-indicator">
                                LIVE
                            </span>

                            <strong>
                                ${escapeHTML(stream.name)}
                            </strong>

                        </div>


                        <div class="multi-actions">

                            <button
                                class="multi-action"
                                data-focus="${escapeHTML(stream.id)}"
                                type="button"
                            >
                                FOCUS
                            </button>

                            <button
                                class="multi-action remove"
                                data-remove="${escapeHTML(stream.id)}"
                                type="button"
                            >
                                REMOVE
                            </button>

                        </div>

                    </div>


                    <div class="multi-video">

                        <iframe
                            src="${twitchEmbed(stream.channel)}"
                            allowfullscreen
                            scrolling="no"
                            allow="autoplay; fullscreen"
                            title="${escapeHTML(stream.name)}"
                        ></iframe>

                    </div>

                </article>
            `)
            .join("");


    multiGrid
        .querySelectorAll(
            "[data-remove]"
        )
        .forEach(button => {

            button.onclick = () => {

                removeStream(
                    button.dataset.remove
                );

            };

        });


    multiGrid
        .querySelectorAll(
            "[data-focus]"
        )
        .forEach(button => {

            button.onclick = () => {

                focusStream(
                    button.dataset.focus
                );

            };

        });

}


// =============================================
// ADD / REMOVE
// =============================================

function removeStream(id) {

    activeStreams =
        activeStreams.filter(
            streamId =>
                streamId !== id
        );

    renderMultiView();

}


function addStream(id) {

    if (
        !activeStreams.includes(id)
    ) {

        activeStreams.push(id);

    }

    closeStreamModal();

    renderMultiView();

}


function focusStream(id) {

    const stream =
        STREAMS.find(
            item =>
                item.id === id
        );

    if (!stream) {
        return;
    }

    currentStream =
        stream;

    renderStreamList();

    renderSinglePlayer();

    showSingleView();

}


// =============================================
// STREAM PICKER
// =============================================

function openStreamModal() {

    renderModalStreams();

    streamModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeStreamModal() {

    streamModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


function renderModalStreams() {

    modalStreamList.innerHTML =
        STREAMS.map(stream => {

            const added =
                activeStreams.includes(
                    stream.id
                );

            return `
                <button
                    class="modal-stream ${added ? "disabled" : ""}"
                    data-add="${escapeHTML(stream.id)}"
                    type="button"
                    ${added ? "disabled" : ""}
                >

                    <div class="stream-icon">
                        ${escapeHTML(stream.shortName)}
                    </div>


                    <div class="modal-stream-info">

                        <strong>
                            ${escapeHTML(stream.name)}
                        </strong>

                        <span>
                            twitch.tv/${escapeHTML(stream.channel)}
                        </span>

                    </div>


                    <span class="add-label">
                        ${added ? "ADDED" : "+ ADD"}
                    </span>

                </button>
            `;

        }).join("");


    modalStreamList
        .querySelectorAll(
            "[data-add]:not([disabled])"
        )
        .forEach(button => {

            button.onclick = () => {

                addStream(
                    button.dataset.add
                );

            };

        });

}


// =============================================
// ESCAPE
// =============================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =============================================
// EVENTS
// =============================================

singleViewButton.onclick =
    showSingleView;

multiViewButton.onclick =
    showMultiView;

addStreamButton.onclick =
    openStreamModal;

emptyAddButton.onclick =
    openStreamModal;

closeModalButton.onclick =
    closeStreamModal;

modalBackdrop.onclick =
    closeStreamModal;


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !streamModal.classList.contains(
                "hidden"
            )
        ) {

            closeStreamModal();

        }

    }
);


// =============================================
// START
// =============================================

renderStreamList();

renderSinglePlayer();

console.log(
    "[OVERTIME] Watch center ready."
);
