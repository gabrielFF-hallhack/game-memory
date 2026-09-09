const socket = io();

let roomCode = null;
let selectedMode = "easy";
let localPlayerId = null;
let currentRoom = null;

const screens = [
    "menu",
    "create",
    "join",
    "waiting",
    "game",
    "result"
];

function showScreen(id) {

    screens.forEach(screen => {

        document
            .getElementById(screen)
            .classList.add("hidden");

    });

    document
        .getElementById(id)
        .classList.remove("hidden");
}

function showCreate() {
    showScreen("create");
}

function showJoin() {
    showScreen("join");
}

function backToMenu() {
    showScreen("menu");
}

function selectMode(mode) {

    selectedMode = mode;

    document
        .getElementById("easyMode")
        .classList.remove("selected");

    document
        .getElementById("impossibleMode")
        .classList.remove("selected");

    if (mode === "easy") {

        document
            .getElementById("easyMode")
            .classList.add("selected");

    } else {

        document
            .getElementById("impossibleMode")
            .classList.add("selected");
    }
}

function createRoom() {

    const name =
        document
            .getElementById("createName")
            .value
            .trim();

    if (!name) {

        showMessage(
            "Digite seu nome."
        );

        return;
    }

    socket.emit(
        "createRoom",
        {
            name,
            mode: selectedMode
        }
    );
}

function joinRoom() {

    const name =
        document
            .getElementById("joinName")
            .value
            .trim();

    const code =
        document
            .getElementById("roomCode")
            .value
            .trim()
            .toUpperCase();

    if (!name) {

        showMessage(
            "Digite seu nome."
        );

        return;
    }

    if (code.length !== 5) {

        showMessage(
            "Digite um código válido."
        );

        return;
    }

    socket.emit(
        "joinRoom",
        {
            code,
            name
        }
    );
}

socket.on(
    "roomCreated",
    data => {

        roomCode = data.code;

        localPlayerId =
            data.playerId;

        document
            .getElementById("displayCode")
            .textContent =
            roomCode;

        showScreen("waiting");
    }
);

socket.on(
    "roomUpdate",
    room => {

        currentRoom = room;

        roomCode = room.code;

        if (!room.gameStarted) {

            document
                .getElementById("displayCode")
                .textContent =
                room.code;

            updateWaitingRoom(room);

            showScreen("waiting");

            return;
        }

        updateGame(room);

        if (room.gameFinished) {

            showResult(room);

        } else {

            showScreen("game");
        }
    }
);

function updateWaitingRoom(room) {

    const playersElement =
        document.getElementById(
            "players"
        );

    playersElement.innerHTML = "";

    room.players.forEach(
        (player, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent =
                `${index + 1}. ${player.name} ${
                    player.ready
                        ? "✅"
                        : "⏳"
                }`;

            playersElement.appendChild(div);
        }
    );

    if (room.players.length < 2) {

        document
            .getElementById(
                "waitingMessage"
            )
            .textContent =
            "Aguardando o segundo jogador...";

    } else {

        document
            .getElementById(
                "waitingMessage"
            )
            .textContent =
            "Os dois jogadores precisam clicar em COMEÇAR.";
    }
}

function toggleReady() {

    socket.emit("setReady");
}

function updateGame(room) {

    const localIndex =
        room.players.findIndex(
            player =>
                player.id === socket.id
        );

    const opponentIndex =
        localIndex === 0 ? 1 : 0;

    const local =
        room.players[localIndex];

    const opponent =
        room.players[opponentIndex];

    if (local) {

        document
            .getElementById(
                "localName"
            )
            .textContent =
            local.name;

        document
            .getElementById(
                "localScore"
            )
            .textContent =
            local.score;
    }

    if (opponent) {

        document
            .getElementById(
                "opponentName"
            )
            .textContent =
            opponent.name;

        document
            .getElementById(
                "opponentScore"
            )
            .textContent =
            opponent.score;
    }

    const total =
        room.cards.length;

    const remaining =
        room.cards.filter(
            card =>
                !card.matched
        ).length;

    document
        .getElementById(
            "cardCounter"
        )
        .textContent =
        `CARTAS NA MESA: ${remaining}/${total}`;

    if (room.turn === localIndex) {

        document
            .getElementById(
                "turnText"
            )
            .textContent =
            "🎯 SUA VEZ";

    } else {

        document
            .getElementById(
                "turnText"
            )
            .textContent =
            "⏳ VEZ DO OUTRO JOGADOR";
    }

    renderBoard(room);
}

function renderBoard(room) {

    const board =
        document.getElementById(
            "board"
        );

    board.innerHTML = "";

    room.cards.forEach(
        card => {

            const cardElement =
                document.createElement(
                    "div"
                );

            cardElement.className =
                "card";

            if (card.revealed) {

                cardElement.classList.add(
                    "revealed"
                );
            }

            if (card.matched) {

                cardElement.classList.add(
                    "matched"
                );
            }

            cardElement.innerHTML = `
                <div class="card-inner">

                    <div class="card-back">
                        🌌
                    </div>

                    <div class="card-front">
                        ${card.theme}
                    </div>

                </div>
            `;

            cardElement.onclick =
                () => {

                    const localIndex =
                        room.players.findIndex(
                            player =>
                                player.id === socket.id
                        );

                    if (
                        room.turn !==
                        localIndex
                    ) {

                        showMessage(
                            "Não é seu turno."
                        );

                        return;
                    }

                    if (
                        card.revealed ||
                        card.matched
                    ) {
                        return;
                    }

                    socket.emit(
                        "selectCard",
                        card.id
                    );
                };

            board.appendChild(
                cardElement
            );
        }
    );
}

socket.on(
    "quiz",
    data => {

        document
            .getElementById(
                "quizTheme"
            )
            .textContent =
            `🧠 ${data.theme}`;

        document
            .getElementById(
                "quizQuestion"
            )
            .textContent =
            data.quiz.question;

        const options =
            document.getElementById(
                "quizOptions"
            );

        options.innerHTML = "";

        data.quiz.options.forEach(
            (option, index) => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.className =
                    "quiz-option";

                button.textContent =
                    `${String.fromCharCode(
                        65 + index
                    )}) ${option}`;

                button.onclick =
                    () => {

                        socket.emit(
                            "answerQuiz",
                            {
                                correct:
                                    index ===
                                    data.quiz.answer
                            }
                        );

                        document
                            .getElementById(
                                "quiz"
                            )
                            .classList.add(
                                "hidden"
                            );
                    };

                options.appendChild(
                    button
                );
            }
        );

        document
            .getElementById(
                "quiz"
            )
            .classList.remove(
                "hidden"
            );
    }
);

socket.on(
    "quizResult",
    data => {

        if (data.correct) {

            showMessage(
                "✅ Resposta correta! Par conquistado!"
            );

        } else {

            showMessage(
                "❌ Resposta errada!"
            );
        }
    }
);

function showResult(room) {

    const sorted =
        [...room.players]
        .sort(
            (a, b) =>
                b.score - a.score
        );

    const winner =
        sorted[0];

    document
        .getElementById(
            "winnerText"
        )
        .textContent =
        `🏆 Vencedor: ${winner.name}`;

    const scores =
        document.getElementById(
            "finalScores"
        );

    scores.innerHTML =
        room.players
            .map(
                player =>
                    `<p>${player.name}: ${player.score} cartas</p>`
            )
            .join("");

    showScreen("result");
}

function requestRematch() {

    showMessage(
        "Aguardando o outro jogador..."
    );

    socket.emit("rematch");
}

function leaveRoom() {

    socket.emit("leaveRoom");

    showScreen("menu");

    roomCode = null;

    currentRoom = null;
}

socket.on(
    "roomClosed",
    () => {

        showMessage(
            "A sala foi encerrada."
        );

        setTimeout(
            () => showScreen("menu"),
            1500
        );
    }
);

socket.on(
    "playerDisconnected",
    () => {

        showMessage(
            "O outro jogador saiu da partida."
        );

        setTimeout(
            () => showScreen("menu"),
            2000
        );
    }
);

socket.on(
    "errorMessage",
    message => {

        showMessage(message);
    }
);

function showMessage(text) {

    const message =
        document.getElementById(
            "message"
        );

    message.textContent = text;

    message.classList.remove(
        "hidden"
    );

    setTimeout(
        () => {

            message.classList.add(
                "hidden"
            );

        },
        2500
    );
}