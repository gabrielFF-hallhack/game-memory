const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const rooms = {};

const themes = [
    "☀️ Sol",
    "🌙 Lua",
    "🌍 Terra",
    "☿️ Mercúrio",
    "♀️ Vênus",
    "🔴 Marte",
    "🪐 Júpiter",
    "💍 Saturno",
    "🔵 Urano",
    "🔵 Netuno",
    "⭐ Estrela",
    "🌌 Galáxia",
    "✨ Nebulosa",
    "☄️ Cometa",
    "🪨 Asteroide",
    "🕳️ Buraco Negro"
];

const quizzes = {
    "☀️ Sol": {
        question: "O Sol é o quê?",
        options: [
            "Um planeta",
            "Uma estrela",
            "Um asteroide",
            "Uma galáxia"
        ],
        answer: 1
    },

    "🌙 Lua": {
        question: "O que é a Lua?",
        options: [
            "Um planeta",
            "Uma estrela",
            "Um satélite natural",
            "Uma galáxia"
        ],
        answer: 2
    },

    "🌍 Terra": {
        question: "Em qual planeta vivemos?",
        options: [
            "Marte",
            "Terra",
            "Vênus",
            "Netuno"
        ],
        answer: 1
    },

    "☿️ Mercúrio": {
        question: "Qual é o planeta mais próximo do Sol?",
        options: [
            "Marte",
            "Terra",
            "Mercúrio",
            "Vênus"
        ],
        answer: 2
    },

    "♀️ Vênus": {
        question: "Qual planeta possui uma atmosfera muito densa?",
        options: [
            "Vênus",
            "Marte",
            "Mercúrio",
            "Netuno"
        ],
        answer: 0
    },

    "🔴 Marte": {
        question: "Qual planeta é conhecido como Planeta Vermelho?",
        options: [
            "Júpiter",
            "Marte",
            "Vênus",
            "Saturno"
        ],
        answer: 1
    },

    "🪐 Júpiter": {
        question: "Qual é o maior planeta do Sistema Solar?",
        options: [
            "Terra",
            "Saturno",
            "Júpiter",
            "Netuno"
        ],
        answer: 2
    },

    "💍 Saturno": {
        question: "Qual planeta é famoso por seus anéis?",
        options: [
            "Marte",
            "Saturno",
            "Vênus",
            "Mercúrio"
        ],
        answer: 1
    },

    "🔵 Urano": {
        question: "Qual planeta gira praticamente de lado?",
        options: [
            "Urano",
            "Marte",
            "Terra",
            "Júpiter"
        ],
        answer: 0
    },

    "🔵 Netuno": {
        question: "Qual é o planeta mais distante do Sol?",
        options: [
            "Urano",
            "Saturno",
            "Netuno",
            "Marte"
        ],
        answer: 2
    },

    "⭐ Estrela": {
        question: "O que produz sua própria luz?",
        options: [
            "Uma estrela",
            "A Lua",
            "Um asteroide",
            "Um planeta"
        ],
        answer: 0
    },

    "🌌 Galáxia": {
        question: "O que é uma galáxia?",
        options: [
            "Um único planeta",
            "Um conjunto de estrelas, gás e poeira",
            "Uma lua",
            "Um asteroide"
        ],
        answer: 1
    },

    "✨ Nebulosa": {
        question: "Uma nebulosa é principalmente uma região de quê?",
        options: [
            "Gás e poeira",
            "Água",
            "Metal sólido",
            "Gelo apenas"
        ],
        answer: 0
    },

    "☄️ Cometa": {
        question: "Do que os cometas são principalmente formados?",
        options: [
            "Gelo, poeira e rochas",
            "Somente ferro",
            "Somente gás",
            "Somente água líquida"
        ],
        answer: 0
    },

    "🪨 Asteroide": {
        question: "O que é um asteroide?",
        options: [
            "Um pequeno corpo rochoso ou metálico",
            "Uma estrela",
            "Uma galáxia",
            "Um planeta gasoso"
        ],
        answer: 0
    },

    "🕳️ Buraco Negro": {
        question: "O que caracteriza um buraco negro?",
        options: [
            "Não possui gravidade",
            "Possui uma gravidade extremamente intensa",
            "É uma estrela comum",
            "É um planeta congelado"
        ],
        answer: 1
    }
};


function generateRoomCode() {

    let code;

    do {

        code = Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();

    } while (rooms[code]);

    return code;
}


function createCards() {

    const cards = [];

    themes.forEach((theme, index) => {

        cards.push({
            id: `${index}-a`,
            pairId: index,
            theme: theme,
            revealed: false,
            matched: false
        });

        cards.push({
            id: `${index}-b`,
            pairId: index,
            theme: theme,
            revealed: false,
            matched: false
        });

    });

    return cards.sort(
        () => Math.random() - 0.5
    );
}


function publicRoom(room) {

    return {

        code: room.code,

        mode: room.mode,

        players: room.players.map(player => ({
            id: player.id,
            name: player.name,
            score: player.score,
            ready: player.ready,
            rematch: player.rematch
        })),

        cards: room.cards.map(card => ({
            id: card.id,
            pairId: card.pairId,
            theme: card.theme,
            revealed: card.revealed,
            matched: card.matched
        })),

        turn: room.turn,

        gameStarted: room.gameStarted,

        gameFinished: room.gameFinished,

        selected: room.selected
    };
}


io.on("connection", socket => {


    socket.on("createRoom", ({ name, mode }) => {

        const code = generateRoomCode();

        rooms[code] = {

            code: code,

            mode: mode || "easy",

            players: [
                {
                    id: socket.id,
                    name: name,
                    score: 0,
                    ready: false,
                    rematch: false
                }
            ],

            cards: createCards(),

            turn: 0,

            selected: [],

            gameStarted: false,

            gameFinished: false

        };

        socket.join(code);

        socket.roomCode = code;

        socket.emit("roomCreated", {
            code: code,
            playerId: socket.id
        });

        io.to(code).emit(
            "roomUpdate",
            publicRoom(rooms[code])
        );

    });


    socket.on("joinRoom", ({ code, name }) => {

        code = code.toUpperCase();

        const room = rooms[code];

        if (!room) {

            socket.emit(
                "errorMessage",
                "Essa sala não existe."
            );

            return;
        }

        if (room.players.length >= 2) {

            socket.emit(
                "errorMessage",
                "Essa sala já está cheia."
            );

            return;
        }

        if (room.gameStarted) {

            socket.emit(
                "errorMessage",
                "Essa partida já começou."
            );

            return;
        }

        room.players.push({

            id: socket.id,

            name: name,

            score: 0,

            ready: false,

            rematch: false

        });

        socket.join(code);

        socket.roomCode = code;

        io.to(code).emit(
            "roomUpdate",
            publicRoom(room)
        );

    });


    socket.on("setReady", () => {

        const room =
            rooms[socket.roomCode];

        if (!room) return;

        const player =
            room.players.find(
                player =>
                    player.id === socket.id
            );

        if (!player) return;

        player.ready = !player.ready;

        if (
            room.players.length === 2 &&
            room.players.every(
                player => player.ready
            )
        ) {

            room.gameStarted = true;

            room.gameFinished = false;

            room.turn = 0;

        }

        io.to(room.code).emit(
            "roomUpdate",
            publicRoom(room)
        );

    });


    socket.on("selectCard", cardId => {

        const room =
            rooms[socket.roomCode];

        if (
            !room ||
            !room.gameStarted ||
            room.gameFinished
        ) {
            return;
        }

        const playerIndex =
            room.players.findIndex(
                player =>
                    player.id === socket.id
            );

        if (
            playerIndex !== room.turn
        ) {
            return;
        }

        if (
            room.selected.length >= 2
        ) {
            return;
        }

        const card =
            room.cards.find(
                card =>
                    card.id === cardId
            );

        if (
            !card ||
            card.matched ||
            card.revealed
        ) {
            return;
        }

        card.revealed = true;

        room.selected.push(cardId);

        io.to(room.code).emit(
            "roomUpdate",
            publicRoom(room)
        );


        if (
            room.selected.length === 2
        ) {

            const first =
                room.cards.find(
                    card =>
                        card.id ===
                        room.selected[0]
                );

            const second =
                room.cards.find(
                    card =>
                        card.id ===
                        room.selected[1]
                );


            if (
                first.pairId ===
                second.pairId
            ) {

                setTimeout(() => {

                    first.matched = true;

                    second.matched = true;

                    room.selected = [];

                    const quiz =
                        quizzes[first.theme];

                    io.to(room.code).emit(
                        "quiz",
                        {
                            theme: first.theme,
                            quiz: quiz
                        }
                    );

                    io.to(room.code).emit(
                        "roomUpdate",
                        publicRoom(room)
                    );

                }, 800);


            } else {

                setTimeout(() => {

                    first.revealed = false;

                    second.revealed = false;

                    room.selected = [];

                    room.turn =
                        room.turn === 0
                            ? 1
                            : 0;

                    io.to(room.code).emit(
                        "roomUpdate",
                        publicRoom(room)
                    );

                }, 1200);

            }

        }

    });


    socket.on(
        "answerQuiz",
        ({ correct }) => {

            const room =
                rooms[socket.roomCode];

            if (!room) return;

            const playerIndex =
                room.players.findIndex(
                    player =>
                        player.id === socket.id
                );

            if (
                playerIndex !== room.turn
            ) {
                return;
            }

            if (correct) {

                room.players[
                    playerIndex
                ].score += 2;

            } else {

                room.turn =
                    room.turn === 0
                        ? 1
                        : 0;

            }


            const allMatched =
                room.cards.every(
                    card =>
                        card.matched
                );

            if (allMatched) {

                room.gameFinished = true;

                room.gameStarted = false;

            }


            io.to(room.code).emit(
                "quizResult",
                {
                    correct: correct
                }
            );

            io.to(room.code).emit(
                "roomUpdate",
                publicRoom(room)
            );

        }
    );


    // ================================
    // REVANCHE
    // ================================

    socket.on("rematch", () => {

        const room =
            rooms[socket.roomCode];

        if (!room) return;

        if (!room.gameFinished) return;

        const player =
            room.players.find(
                player =>
                    player.id === socket.id
            );

        if (!player) return;

        player.rematch = true;

        io.to(room.code).emit(
            "roomUpdate",
            publicRoom(room)
        );


        // Só reinicia quando OS DOIS
        // jogadores aceitarem.

        if (
            room.players.length === 2 &&
            room.players.every(
                player =>
                    player.rematch === true
            )
        ) {

            room.players.forEach(
                player => {

                    player.score = 0;

                    player.ready = false;

                    player.rematch = false;

                }
            );

            room.cards = createCards();

            room.turn = 0;

            room.selected = [];

            room.gameStarted = false;

            room.gameFinished = false;


            io.to(room.code).emit(
                "roomUpdate",
                publicRoom(room)
            );

        }

    });


    // ================================
    // SAIR DA SALA
    // ================================

    socket.on("leaveRoom", () => {

        const room =
            rooms[socket.roomCode];

        if (!room) return;

        io.to(room.code).emit(
            "roomClosed"
        );

        delete rooms[room.code];

    });


    socket.on("disconnect", () => {

        const room =
            rooms[socket.roomCode];

        if (!room) return;

        io.to(room.code).emit(
            "playerDisconnected"
        );

        delete rooms[room.code];

    });

});


server.listen(PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

});