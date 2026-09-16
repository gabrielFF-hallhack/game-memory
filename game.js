/* =========================================================
   MEMÓRIA CÓSMICA
   JAVASCRIPT DO JOGADOR
========================================================= */

const socket = io();

/* =========================================================
   ESTADO LOCAL
========================================================= */

let roomCode = "";
let localPlayerId = "";
let localName = "";
let selectedMode = "easy";
let room = null;

let quizOpen = false;
let quizToken = null;
let answeredCurrentQuiz = false;

/* =========================================================
   PERFIL DO JOGADOR
========================================================= */

let profileId = localStorage.getItem("cosmicMemoryProfileId");

if (!profileId) {
    profileId =
        "profile-" +
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now();

    localStorage.setItem(
        "cosmicMemoryProfileId",
        profileId
    );
}

/* =========================================================
   FUNÇÃO AUXILIAR
========================================================= */

function $(id) {
    return document.getElementById(id);
}

/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   TELAS
========================================================= */

function showScreen(screenId) {
    const screens = [
        "menu",
        "create",
        "join",
        "waiting",
        "game",
        "result"
    ];

    screens.forEach(id => {
        const element = $(id);

        if (!element) {
            return;
        }

        element.classList.toggle(
            "hidden",
            id !== screenId
        );
    });
}

/* =========================================================
   MENU
========================================================= */

function showCreate() {
    showScreen("create");

    const input = $("createName");

    if (input) {
        setTimeout(() => {
            input.focus();
        }, 100);
    }
}

function showJoin() {
    showScreen("join");

    const input = $("joinName");

    if (input) {
        setTimeout(() => {
            input.focus();
        }, 100);
    }
}

function backToMenu() {
    showScreen("menu");
}

/* =========================================================
   SELEÇÃO DE MODO
========================================================= */

function selectMode(mode) {
    selectedMode =
        mode === "impossible"
            ? "impossible"
            : "easy";

    const easy = $("easyMode");
    const impossible = $("impossibleMode");

    if (easy) {
        easy.classList.toggle(
            "selected",
            selectedMode === "easy"
        );
    }

    if (impossible) {
        impossible.classList.toggle(
            "selected",
            selectedMode === "impossible"
        );
    }
}

/* =========================================================
   CRIAR SALA
========================================================= */

function createRoom() {
    const input = $("createName");

    const name = input
        ? input.value.trim()
        : "";

    if (!name) {
        showMessage("Digite seu nome.");

        if (input) {
            input.focus();
        }

        return;
    }

    if (!socket.connected) {
        showMessage(
            "Conectando ao servidor..."
        );

        socket.connect();

        return;
    }

    localName = name;

    console.log(
        "Criando sala:",
        {
            name,
            mode: selectedMode,
            profileId
        }
    );

    socket.emit(
        "createRoom",
        {
            name,
            mode: selectedMode,
            profileId
        }
    );
}

/* =========================================================
   ENTRAR NA SALA
========================================================= */

function joinRoom() {
    const nameInput = $("joinName");
    const codeInput = $("roomCode");

    const name = nameInput
        ? nameInput.value.trim()
        : "";

    const code = codeInput
        ? codeInput.value
            .trim()
            .toUpperCase()
        : "";

    if (!name) {
        showMessage("Digite seu nome.");

        if (nameInput) {
            nameInput.focus();
        }

        return;
    }

    if (!code) {
        showMessage(
            "Digite o código da sala."
        );

        if (codeInput) {
            codeInput.focus();
        }

        return;
    }

    localName = name;
    roomCode = code;

    console.log(
        "Entrando na sala:",
        {
            name,
            code,
            profileId
        }
    );

    socket.emit(
        "joinRoom",
        {
            name,
            code,
            profileId
        }
    );
}

/* =========================================================
   SALA CRIADA
========================================================= */

socket.on(
    "roomCreated",
    data => {
        console.log(
            "ROOM CREATED:",
            data
        );

        if (!data) {
            return;
        }

        if (data.code) {
            roomCode = data.code;
        }

        if (data.playerId) {
            localPlayerId = data.playerId;
        }

        if (data.id) {
            localPlayerId = data.id;
        }

        updateRoomCode();

        showScreen("waiting");

        renderWaiting();
    }
);

/* =========================================================
   SALA ENTRADA
========================================================= */

socket.on(
    "roomJoined",
    data => {
        console.log(
            "ROOM JOINED:",
            data
        );

        if (!data) {
            return;
        }

        if (data.code) {
            roomCode = data.code;
        }

        if (data.playerId) {
            localPlayerId = data.playerId;
        }

        if (data.id) {
            localPlayerId = data.id;
        }

        updateRoomCode();

        room = data;

        if (data.gameStarted === true) {
            showScreen("game");

            renderGameHeader();
            renderBoard();
        } else {
            showScreen("waiting");

            renderWaiting();
        }
    }
);

/* =========================================================
   ATUALIZAÇÃO DA SALA
========================================================= */

socket.on(
    "roomUpdate",
    data => {
        console.log(
            "ROOM UPDATE:",
            data
        );

        if (!data) {
            return;
        }

        room = data;

        if (data.code) {
            roomCode = data.code;
        }

        updateRoomCode();

        const gameStarted =
            data.gameStarted === true;

        if (!gameStarted) {
            showScreen("waiting");

            renderWaiting();

            return;
        }

        showScreen("game");

        renderGameHeader();
        renderBoard();
    }
);

/* =========================================================
   JOGO COMEÇOU
========================================================= */

socket.on(
    "gameStarted",
    data => {
        console.log(
            "GAME STARTED:",
            data
        );

        if (data) {
            room = data;

            if (data.code) {
                roomCode = data.code;
            }
        }

        showScreen("game");

        renderGameHeader();
        renderBoard();
    }
);

/* =========================================================
   CÓDIGO DA SALA
========================================================= */

function updateRoomCode() {
    const element = $("displayCode");

    if (!element) {
        return;
    }

    element.textContent =
        roomCode || "-----";
}

/* =========================================================
   COPIAR CÓDIGO
========================================================= */

async function copyRoomCode() {
    if (!roomCode) {
        showMessage(
            "O código ainda não está disponível."
        );

        return;
    }

    try {
        await navigator.clipboard.writeText(
            roomCode
        );

        showMessage(
            "Código copiado: " +
            roomCode
        );
    } catch (error) {
        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = roomCode;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        showMessage(
            "Código copiado: " +
            roomCode
        );
    }
}

/* =========================================================
   RENDERIZA ESPERA
========================================================= */

function renderWaiting() {
    updateRoomCode();

    const playersElement =
        $("players");

    const messageElement =
        $("waitingMessage");

    const readyButton =
        $("readyButton");

    if (!room) {
        if (messageElement) {
            messageElement.textContent =
                "Aguardando informações da sala...";
        }

        if (readyButton) {
            readyButton.disabled = true;
        }

        return;
    }

    const players =
        Array.isArray(room.players)
            ? room.players
            : [];

    if (playersElement) {
        playersElement.innerHTML = "";

        players.forEach(
            (player, index) => {
                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "player-row";

                const name =
                    document.createElement(
                        "span"
                    );

                name.textContent =
                    player.name ||
                    `Jogador ${index + 1}`;

                const status =
                    document.createElement(
                        "span"
                    );

                status.textContent =
                    player.ready
                        ? "✅ PRONTO"
                        : "⏳ AGUARDANDO";

                row.appendChild(name);
                row.appendChild(status);

                playersElement.appendChild(
                    row
                );
            }
        );
    }

    const hasTwoPlayers =
        players.length >= 2;

    if (messageElement) {
        if (!hasTwoPlayers) {
            messageElement.textContent =
                "Aguardando o segundo jogador...";
        } else {
            const allReady =
                players.every(
                    player =>
                        player.ready === true
                );

            messageElement.textContent =
                allReady
                    ? "Preparando a partida..."
                    : "Os dois jogadores precisam clicar em COMEÇAR.";
        }
    }

    if (readyButton) {
        readyButton.disabled =
            !hasTwoPlayers;

        const me =
            findLocalPlayer();

        if (me) {
            readyButton.textContent =
                me.ready
                    ? "❌ CANCELAR PRONTO"
                    : "🚀 COMEÇAR";
        }
    }
}

/* =========================================================
   ENCONTRAR JOGADOR LOCAL
========================================================= */

function findLocalPlayer() {
    if (
        !room ||
        !Array.isArray(room.players)
    ) {
        return null;
    }

    let player =
        room.players.find(
            p =>
                p.id ===
                localPlayerId
        );

    if (player) {
        return player;
    }

    player =
        room.players.find(
            p =>
                p.name ===
                localName
        );

    return player || null;
}

/* =========================================================
   PRONTO
========================================================= */

function toggleReady() {
    if (!room) {
        showMessage(
            "Sala ainda não carregada."
        );

        return;
    }

    if (
        !Array.isArray(room.players) ||
        room.players.length < 2
    ) {
        showMessage(
            "Aguardando o segundo jogador."
        );

        return;
    }

    const me =
        findLocalPlayer();

    const nextReady =
        !(me && me.ready === true);

    socket.emit(
        "setReady",
        {
            code: roomCode,
            ready: nextReady
        }
    );
}

/* =========================================================
   HEADER DO JOGO
========================================================= */

function renderGameHeader() {
    if (!room) {
        return;
    }

    const players =
        Array.isArray(room.players)
            ? room.players
            : [];

    const me =
        findLocalPlayer();

    const opponent =
        players.find(
            p =>
                p.id !==
                localPlayerId
        ) ||
        players.find(
            p =>
                p.name !==
                localName
        );

    const localNameElement =
        $("localName");

    const localScoreElement =
        $("localScore");

    const opponentNameElement =
        $("opponentName");

    const opponentScoreElement =
        $("opponentScore");

    if (localNameElement) {
        localNameElement.textContent =
            me?.name ||
            localName ||
            "VOCÊ";
    }

    if (localScoreElement) {
        localScoreElement.textContent =
            me?.score || 0;
    }

    if (opponentNameElement) {
        opponentNameElement.textContent =
            opponent?.name ||
            "AGUARDANDO";
    }

    if (opponentScoreElement) {
        opponentScoreElement.textContent =
            opponent?.score || 0;
    }

    updateTurnText();
    updateCardCounter();
}

/* =========================================================
   TURNO
========================================================= */

function updateTurnText() {
    const turnElement =
        $("turnText");

    if (!turnElement) {
        return;
    }

    if (!room) {
        turnElement.textContent =
            "AGUARDANDO";

        return;
    }

    const players =
        Array.isArray(room.players)
            ? room.players
            : [];

    if (
        typeof room.currentPlayerIndex ===
            "number" &&
        players.length > 0
    ) {
        const current =
            players[
                room.currentPlayerIndex
            ];

        if (current) {
            const isMe =
                current.id ===
                localPlayerId;

            turnElement.textContent =
                isMe
                    ? "⭐ SUA VEZ"
                    : `VEZ DE ${current.name || "ADVERSÁRIO"}`;

            return;
        }
    }

    if (room.currentPlayerId) {
        const isMe =
            room.currentPlayerId ===
            localPlayerId;

        turnElement.textContent =
            isMe
                ? "⭐ SUA VEZ"
                : "VEZ DO ADVERSÁRIO";

        return;
    }

    if (
        typeof room.turn ===
            "number" &&
        players.length > 0
    ) {
        const current =
            players[
                room.turn
            ];

        if (current) {
            const isMe =
                current.id ===
                localPlayerId;

            turnElement.textContent =
                isMe
                    ? "⭐ SUA VEZ"
                    : `VEZ DE ${current.name || "ADVERSÁRIO"}`;

            return;
        }
    }

    turnElement.textContent =
        "AGUARDANDO";
}

/* =========================================================
   CONTADOR DE CARTAS
========================================================= */

function updateCardCounter() {
    const counter =
        $("cardCounter");

    if (!counter) {
        return;
    }

    const cards =
        Array.isArray(room?.cards)
            ? room.cards
            : [];

    const total =
        cards.length;

    const remaining =
        cards.filter(
            card =>
                !card.matched
        ).length;

    counter.textContent =
        `CARTAS NA MESA: ${remaining}/${total}`;
}

/* =========================================================
   ÍCONE DA CARTA
========================================================= */

function getCardIcon(card) {
    if (card?.icon) {
        return card.icon;
    }

    if (card?.emoji) {
        return card.emoji;
    }

    if (card?.symbol) {
        return card.symbol;
    }

    const theme =
        String(
            card?.theme || ""
        ).trim();

    if (!theme) {
        return "🌌";
    }

    try {
        if (
            typeof Intl !==
                "undefined" &&
            Intl.Segmenter
        ) {
            const segmenter =
                new Intl.Segmenter(
                    "pt-BR",
                    {
                        granularity:
                            "grapheme"
                    }
                );

            const first =
                segmenter
                    .segment(theme)
                    .containing(0);

            if (first?.segment) {
                const candidate =
                    first.segment;

                if (
                    /\p{Extended_Pictographic}/u.test(
                        candidate
                    )
                ) {
                    return candidate;
                }
            }
        }
    } catch (error) {
        console.warn(
            "Não foi possível identificar o emoji:",
            error
        );
    }

    return "🌌";
}

/* =========================================================
   NOME DA CARTA
========================================================= */

function getCardName(card) {
    const theme =
        String(
            card?.theme || ""
        ).trim();

    if (!theme) {
        return "Universo";
    }

    const icon =
        getCardIcon(card);

    if (
        icon &&
        theme.startsWith(icon)
    ) {
        return theme
            .slice(icon.length)
            .trim();
    }

    return theme;
}

/* =========================================================
   TABULEIRO
========================================================= */

function renderBoard() {
    const board =
        $("board");

    if (!board) {
        return;
    }

    board.innerHTML = "";

    if (
        !room ||
        !Array.isArray(room.cards)
    ) {
        return;
    }

    board.classList.add(
        "cosmic-board"
    );

    room.cards.forEach(
        (card, index) => {

            /* =================================================
               BOTÃO DA CARTA
            ================================================= */

            const cardElement =
                document.createElement(
                    "button"
                );

            cardElement.type =
                "button";

            cardElement.className =
                "card";

            cardElement.style.boxSizing =
                "border-box";

            cardElement.style.minWidth =
                "0";

            /*
             * CORREÇÃO PRINCIPAL:
             *
             * A carta agora é QUADRADA.
             *
             * Antes estava:
             *
             * 1 / 1.18
             *
             * Isso deixava a carta
             * mais alta do que larga.
             */

            cardElement.style.aspectRatio =
                "1 / 1";

            /*
             * Não deixa uma altura antiga
             * do CSS deformar a carta.
             */

            cardElement.style.width =
                "100%";

            /* =================================================
               ESTADO DA CARTA
            ================================================= */

            if (card.revealed) {
                cardElement.classList.add(
                    "revealed"
                );
            }

            if (card.matched) {
                cardElement.classList.add(
                    "matched"
                );

                cardElement.disabled =
                    true;
            }

            /* =================================================
               PARTE INTERNA
            ================================================= */

            const inner =
                document.createElement(
                    "div"
                );

            inner.className =
                "card-inner";

            /* =================================================
               VERSO
            ================================================= */

            const back =
                document.createElement(
                    "div"
                );

            back.className =
                "card-back";

            back.textContent =
                "🌌";

            /* =================================================
               FRENTE
            ================================================= */

            const front =
                document.createElement(
                    "div"
                );

            front.className =
                "card-front";

            /* =================================================
               ÍCONE
            ================================================= */

            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                "card-icon";

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            icon.textContent =
                getCardIcon(card);

            /* =================================================
               NOME
            ================================================= */

            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "card-name";

            name.textContent =
                getCardName(card);

            name.title =
                getCardName(card);

            /* =================================================
               MONTAR FRENTE
            ================================================= */

            front.appendChild(icon);
            front.appendChild(name);

            /* =================================================
               MONTAR CARTA
            ================================================= */

            inner.appendChild(back);
            inner.appendChild(front);

            cardElement.appendChild(
                inner
            );

            /* =================================================
               ACESSIBILIDADE
            ================================================= */

            cardElement.setAttribute(
                "aria-label",
                `Carta ${getCardName(card)}`
            );

            /* =================================================
               CLIQUE
            ================================================= */

            cardElement.addEventListener(
                "click",
                () => {
                    selectCard(index);
                }
            );

            /* =================================================
               ADICIONAR AO TABULEIRO
            ================================================= */

            board.appendChild(
                cardElement
            );
        }
    );

    updateCardCounter();
}

/* =========================================================
   CLICAR NA CARTA
========================================================= */

function selectCard(index) {
    console.log(
        "Clique na carta:",
        index
    );

    if (!room) {
        showMessage(
            "A partida ainda não está pronta."
        );

        return;
    }

    if (!room.gameStarted) {
        showMessage(
            "A partida ainda não começou."
        );

        return;
    }

    if (
        !Array.isArray(room.cards) ||
        !room.cards[index]
    ) {
        showMessage(
            "Carta inválida."
        );

        return;
    }

    const card =
        room.cards[index];

    if (card.matched) {
        return;
    }

    if (card.revealed) {
        return;
    }

    if (quizOpen) {
        return;
    }

    if (
        typeof room.currentPlayerIndex ===
            "number" &&
        Array.isArray(room.players)
    ) {
        const current =
            room.players[
                room.currentPlayerIndex
            ];

        if (
            current &&
            current.id &&
            localPlayerId &&
            current.id !==
                localPlayerId
        ) {
            showMessage(
                "Aguarde sua vez."
            );

            return;
        }
    }

    if (
        room.currentPlayerId &&
        localPlayerId &&
        room.currentPlayerId !==
            localPlayerId
    ) {
        showMessage(
            "Aguarde sua vez."
        );

        return;
    }

    if (
        typeof room.currentPlayerIndex !==
            "number" &&
        typeof room.currentPlayerId !==
            "string" &&
        typeof room.turn ===
            "number" &&
        Array.isArray(room.players)
    ) {
        const localIndex =
            room.players.findIndex(
                player =>
                    player.id ===
                    localPlayerId
            );

        if (
            localIndex >= 0 &&
            room.turn !==
                localIndex
        ) {
            showMessage(
                "Aguarde sua vez."
            );

            return;
        }
    }

    console.log(
        "ENVIANDO selectCard:",
        index
    );

    socket.emit(
        "selectCard",
        {
            code: roomCode,
            index
        }
    );
}

/* =========================================================
   QUIZ RECEBIDO
========================================================= */

socket.on(
    "quiz",
    data => {
        console.log(
            "QUIZ RECEBIDO:",
            data
        );

        if (!data) {
            return;
        }

        quizOpen = true;

        answeredCurrentQuiz =
            false;

        quizToken =
            data.token ||
            data.quizToken ||
            null;

        const quiz =
            $("quiz");

        const theme =
            $("quizTheme");

        const question =
            $("quizQuestion");

        const status =
            $("quizStatus");

        const options =
            $("quizOptions");

        if (theme) {
            theme.textContent =
                data.tema ||
                data.theme ||
                data.titulo ||
                "🌌 QUIZ";
        }

        if (question) {
            question.textContent =
                data.pergunta ||
                data.question ||
                "Pergunta não disponível.";
        }

        if (status) {
            status.textContent =
                "Os dois jogadores podem responder.";
        }

        if (options) {
            options.innerHTML = "";

            const answers =
                Array.isArray(
                    data.opcoes
                )
                    ? data.opcoes
                    : Array.isArray(
                        data.options
                    )
                        ? data.options
                        : [];

            answers.forEach(
                (answer, index) => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "quiz-option";

                    button.textContent =
                        `${String.fromCharCode(
                            65 + index
                        )}) ${answer}`;

                    button.addEventListener(
                        "click",
                        () => {
                            answerQuiz(
                                index
                            );
                        }
                    );

                    options.appendChild(
                        button
                    );
                }
            );
        }

        if (quiz) {
            quiz.classList.remove(
                "hidden"
            );
        }
    }
);

/* =========================================================
   RESPONDER QUIZ
========================================================= */

function answerQuiz(answerIndex) {
    if (!quizOpen) {
        return;
    }

    if (answeredCurrentQuiz) {
        return;
    }

    answeredCurrentQuiz =
        true;

    const buttons =
        document.querySelectorAll(
            ".quiz-option"
        );

    buttons.forEach(
        button => {
            button.disabled =
                true;
        }
    );

    console.log(
        "Resposta enviada:",
        answerIndex
    );

    socket.emit(
        "answerQuiz",
        {
            code: roomCode,
            answer: answerIndex,
            token: quizToken
        }
    );
}

/* =========================================================
   RESULTADO DO QUIZ
========================================================= */

socket.on(
    "quizResult",
    data => {
        console.log(
            "QUIZ RESULT:",
            data
        );

        const status =
            $("quizStatus");

        if (status && data) {

            if (data.correct) {

                status.textContent =
                    data.winnerName
                        ? `✅ ${data.winnerName} acertou!`
                        : "✅ Resposta correta!";

            } else if (
                data.waiting === true
            ) {

                status.textContent =
                    "❌ Você errou. Aguardando o outro jogador...";

            } else {

                status.textContent =
                    "❌ Resposta incorreta.";
            }
        }

        if (
            data &&
            (
                data.finished === true ||
                data.noWinner === true
            )
        ) {
            setTimeout(
                () => {
                    closeQuiz();

                    if (room) {
                        renderGameHeader();
                        renderBoard();
                    }
                },
                900
            );
        }

        if (
            data &&
            data.correct === true
        ) {
            setTimeout(
                () => {
                    closeQuiz();

                    if (room) {
                        renderGameHeader();
                        renderBoard();
                    }
                },
                1000
            );
        }
    }
);

/* =========================================================
   FECHAR QUIZ
========================================================= */

function closeQuiz() {
    quizOpen = false;

    answeredCurrentQuiz =
        false;

    quizToken = null;

    const quiz =
        $("quiz");

    if (quiz) {
        quiz.classList.add(
            "hidden"
        );
    }

    const options =
        $("quizOptions");

    if (options) {
        options.innerHTML = "";
    }

    const status =
        $("quizStatus");

    if (status) {
        status.textContent = "";
    }
}

/* =========================================================
   CARTAS ESCONDIDAS
========================================================= */

socket.on(
    "cardsHidden",
    data => {
        console.log(
            "CARDS HIDDEN:",
            data
        );

        if (
            data &&
            Array.isArray(
                data.cards
            )
        ) {
            if (room) {
                room.cards =
                    data.cards;
            }
        }

        closeQuiz();

        renderGameHeader();
        renderBoard();
    }
);

/* =========================================================
   PAR INCORRETO
========================================================= */

socket.on(
    "pairMismatch",
    data => {
        console.log(
            "PAIR MISMATCH:",
            data
        );

        showMessage(
            "❌ Não foi um par."
        );

        setTimeout(
            () => {
                closeQuiz();

                if (
                    data &&
                    Array.isArray(
                        data.cards
                    ) &&
                    room
                ) {
                    room.cards =
                        data.cards;
                }

                renderGameHeader();
                renderBoard();
            },
            900
        );
    }
);

/* =========================================================
   FINAL DA PARTIDA
========================================================= */

socket.on(
    "gameFinished",
    data => {
        console.log(
            "GAME FINISHED:",
            data
        );

        closeQuiz();

        if (
            data &&
            Array.isArray(
                data.players
            ) &&
            room
        ) {
            room.players =
                data.players;
        }

        renderResult(data);

        showScreen("result");
    }
);

/* =========================================================
   RESULTADO
========================================================= */

function renderResult(data) {
    const winnerText =
        $("winnerText");

    const finalScores =
        $("finalScores");

    const players =
        Array.isArray(
            data?.players
        )
            ? data.players
            : Array.isArray(
                room?.players
            )
                ? room.players
                : [];

    if (winnerText) {

        if (
            players.length >= 2
        ) {
            const sorted =
                [...players].sort(
                    (a, b) =>
                        (b.score || 0) -
                        (a.score || 0)
                );

            if (
                (sorted[0].score || 0) ===
                (sorted[1].score || 0)
            ) {
                winnerText.textContent =
                    "🤝 EMPATE!";
            } else {
                winnerText.textContent =
                    `🏆 ${sorted[0].name} venceu!`;
            }

        } else {

            winnerText.textContent =
                "🏆 FIM DA PARTIDA";
        }
    }

    if (finalScores) {
        finalScores.innerHTML = "";

        players.forEach(
            player => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "final-player";

                const strong =
                    document.createElement(
                        "strong"
                    );

                strong.textContent =
                    player.name ||
                    "Jogador";

                const br =
                    document.createElement(
                        "br"
                    );

                const text =
                    document.createTextNode(
                        `Cartas: ${player.score || 0}`
                    );

                div.appendChild(
                    strong
                );

                div.appendChild(
                    br
                );

                div.appendChild(
                    text
                );

                finalScores.appendChild(
                    div
                );
            }
        );
    }
}

/* =========================================================
   REVANCHE
========================================================= */

function requestRematch() {
    console.log(
        "Solicitando revanche."
    );

    socket.emit(
        "requestRematch",
        {
            code: roomCode
        }
    );
}

/* =========================================================
   REVANCHE ESPERANDO
========================================================= */

socket.on(
    "rematchWaiting",
    data => {
        console.log(
            "REMATCH WAITING:",
            data
        );

        showMessage(
            "Aguardando o outro jogador aceitar a revanche..."
        );
    }
);

/* =========================================================
   NOVA PARTIDA
========================================================= */

socket.on(
    "rematchStarted",
    data => {
        console.log(
            "REMATCH STARTED:",
            data
        );

        if (data) {
            room = data;

            if (data.code) {
                roomCode = data.code;
            }
        }

        closeQuiz();

        showScreen("game");

        renderGameHeader();
        renderBoard();
    }
);

/* =========================================================
   ERRO DO SERVIDOR
========================================================= */

socket.on(
    "errorMessage",
    message => {
        console.error(
            "ERRO DO SERVIDOR:",
            message
        );

        if (
            typeof message ===
            "object"
        ) {
            showMessage(
                message.message ||
                message.error ||
                "Ocorreu um erro."
            );
        } else {
            showMessage(
                message ||
                "Ocorreu um erro."
            );
        }
    }
);

/* =========================================================
   SALA FECHADA
========================================================= */

socket.on(
    "roomClosed",
    data => {
        console.log(
            "ROOM CLOSED:",
            data
        );

        room = null;
        roomCode = "";
        localPlayerId = "";

        closeQuiz();

        showScreen("menu");

        showMessage(
            "A sala foi encerrada."
        );
    }
);

/* =========================================================
   JOGADOR SAIU
========================================================= */

socket.on(
    "playerLeft",
    data => {
        console.log(
            "PLAYER LEFT:",
            data
        );

        showMessage(
            "O outro jogador saiu da partida."
        );

        if (
            room &&
            room.gameStarted
        ) {
            renderGameHeader();
            renderBoard();
        } else {
            renderWaiting();
        }
    }
);

/* =========================================================
   PLAYER DISCONNECTED
========================================================= */

socket.on(
    "playerDisconnected",
    data => {
        console.log(
            "PLAYER DISCONNECTED:",
            data
        );

        showMessage(
            "O outro jogador desconectou."
        );

        if (
            room &&
            room.gameStarted
        ) {
            renderGameHeader();
            renderBoard();
        } else {
            renderWaiting();
        }
    }
);

/* =========================================================
   CONEXÃO
========================================================= */

socket.on(
    "connect",
    () => {
        console.log(
            "Socket conectado:",
            socket.id
        );

        if (!localPlayerId) {
            localPlayerId =
                socket.id;
        }
    }
);

/* =========================================================
   DESCONEXÃO
========================================================= */

socket.on(
    "disconnect",
    reason => {
        console.warn(
            "Socket desconectado:",
            reason
        );

        if (
            room &&
            room.gameStarted
        ) {
            showMessage(
                "Conexão perdida com o servidor."
            );
        }
    }
);

/* =========================================================
   MENSAGEM
========================================================= */

let messageTimer = null;

function showMessage(text) {
    const element =
        $("message");

    if (!element) {
        return;
    }

    element.textContent =
        text;

    element.classList.remove(
        "hidden"
    );

    clearTimeout(
        messageTimer
    );

    messageTimer =
        setTimeout(
            () => {
                element.classList.add(
                    "hidden"
                );
            },
            2500
        );
}

/* =========================================================
   TECLADO
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            document.activeElement?.id ===
                "createName"
        ) {
            createRoom();
            return;
        }

        if (
            event.key === "Enter" &&
            document.activeElement?.id ===
                "roomCode"
        ) {
            joinRoom();
        }
    }
);

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showScreen("menu");

        updateRoomCode();

        selectMode(
            selectedMode
        );

        console.log(
            "Memória Cósmica carregada."
        );
    }
);