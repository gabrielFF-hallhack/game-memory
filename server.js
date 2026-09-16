const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL =
    process.env.GROQ_MODEL ||
    "openai/gpt-oss-20b";

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

const rooms = new Map();
const playerProfiles = new Map();

const THEMES = [
    { theme: "☀️ Sol", icon: "☀️" },
    { theme: "🌙 Lua", icon: "🌙" },
    { theme: "🌍 Terra", icon: "🌍" },
    { theme: "🔴 Marte", icon: "🔴" },
    { theme: "🪐 Júpiter", icon: "🪐" },
    { theme: "💍 Saturno", icon: "💍" },
    { theme: "🟦 Urano", icon: "🟦" },
    { theme: "🔵 Netuno", icon: "🔵" },
    { theme: "☄️ Cometas", icon: "☄️" },
    { theme: "🌠 Meteoros", icon: "🌠" },
    { theme: "🛰️ Satélites", icon: "🛰️" },
    { theme: "🚀 Foguetes", icon: "🚀" },
    { theme: "🌌 Galáxias", icon: "🌌" },
    { theme: "⭐ Estrelas", icon: "⭐" },
    { theme: "💫 Supernovas", icon: "💫" },
    { theme: "🕳️ Buracos Negros", icon: "🕳️" },
    { theme: "🌫️ Nebulosas", icon: "🌫️" },
    { theme: "🔭 Telescópios", icon: "🔭" },
    { theme: "👨‍🚀 Astronautas", icon: "👨‍🚀" },
    { theme: "🧑‍🚀 Exploração Espacial", icon: "🧑‍🚀" },
    { theme: "🌌 Universo", icon: "🌌" },
    { theme: "⚛️ Física Espacial", icon: "⚛️" },
    { theme: "🪐 Exoplanetas", icon: "🪐" },
    { theme: "🌞 Sistema Solar", icon: "🌞" },
    { theme: "🌑 Eclipses", icon: "🌑" },
    { theme: "🌗 Fases da Lua", icon: "🌗" },
    { theme: "🌊 Marés", icon: "🌊" },
    { theme: "🧲 Gravidade", icon: "🧲" },
    { theme: "⏱️ Tempo", icon: "⏱️" },
    { theme: "📡 Radioastronomia", icon: "📡" },
    { theme: "🔬 Astronomia", icon: "🔬" },
    { theme: "🧬 Astrobiologia", icon: "🧬" },
    { theme: "🌡️ Clima Espacial", icon: "🌡️" },
    { theme: "☢️ Radiação", icon: "☢️" },
    { theme: "🌎 Exoplanetas Habitáveis", icon: "🌎" },
    { theme: "🪨 Asteroides", icon: "🪨" },
    { theme: "🧊 Cinturão de Kuiper", icon: "🧊" },
    { theme: "☁️ Nuvem de Oort", icon: "☁️" },
    { theme: "🌌 Via Láctea", icon: "🌌" },
    { theme: "🔭 Observação do Céu", icon: "🔭" }
];

const LOCAL_QUESTIONS = [
    {
        tema: "☀️ Sol",
        pergunta: "Qual é a estrela localizada no centro do Sistema Solar?",
        opcoes: [
            "Sol",
            "Sirius",
            "Betelgeuse",
            "Vega"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🌙 Lua",
        pergunta: "Qual é o satélite natural da Terra?",
        opcoes: [
            "Lua",
            "Marte",
            "Vênus",
            "Europa"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🌍 Terra",
        pergunta: "Qual planeta é conhecido como planeta azul?",
        opcoes: [
            "Terra",
            "Marte",
            "Júpiter",
            "Mercúrio"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🔴 Marte",
        pergunta: "Qual planeta é conhecido como planeta vermelho?",
        opcoes: [
            "Marte",
            "Vênus",
            "Netuno",
            "Saturno"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🪐 Júpiter",
        pergunta: "Qual é o maior planeta do Sistema Solar?",
        opcoes: [
            "Júpiter",
            "Saturno",
            "Terra",
            "Netuno"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "💍 Saturno",
        pergunta: "Qual planeta é famoso por seus grandes anéis?",
        opcoes: [
            "Saturno",
            "Marte",
            "Urano",
            "Mercúrio"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🔵 Netuno",
        pergunta: "Qual é o planeta mais distante do Sol entre os oito planetas?",
        opcoes: [
            "Netuno",
            "Urano",
            "Saturno",
            "Júpiter"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🌌 Via Láctea",
        pergunta: "A Via Láctea é o quê?",
        opcoes: [
            "Uma galáxia",
            "Um planeta",
            "Uma estrela",
            "Uma nebulosa"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🕳️ Buracos Negros",
        pergunta: "O que caracteriza um buraco negro?",
        opcoes: [
            "Uma região com gravidade extremamente intensa",
            "Uma estrela feita de gelo",
            "Um planeta sem atmosfera",
            "Uma galáxia pequena"
        ],
        resposta: 0,
        dificuldade: 3,
        peso: 3
    },

    {
        tema: "☄️ Cometas",
        pergunta: "Do que são compostos principalmente os cometas?",
        opcoes: [
            "Gelo, poeira e rochas",
            "Apenas ferro",
            "Apenas gases quentes",
            "Plasma puro"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "⭐ Estrelas",
        pergunta: "O que é uma estrela?",
        opcoes: [
            "Uma enorme esfera de gás/plasma que produz energia",
            "Um planeta muito grande",
            "Uma lua iluminada",
            "Um asteroide"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "🌠 Meteoros",
        pergunta: "O que é um meteoro?",
        opcoes: [
            "O brilho produzido quando um meteoroide entra na atmosfera",
            "Uma estrela cadente real",
            "Um planeta pequeno",
            "Uma galáxia"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "🌑 Eclipses",
        pergunta: "O que acontece em um eclipse solar?",
        opcoes: [
            "A Lua passa entre a Terra e o Sol",
            "A Terra passa entre Marte e o Sol",
            "O Sol passa atrás de Júpiter",
            "A Lua desaparece do Sistema Solar"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 5
    },

    {
        tema: "🌗 Fases da Lua",
        pergunta: "Por que vemos diferentes fases da Lua?",
        opcoes: [
            "Por causa da posição relativa entre Sol, Terra e Lua",
            "Porque a Lua muda de tamanho",
            "Porque a Lua apaga e acende",
            "Porque as estrelas cobrem parte dela"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 5
    },

    {
        tema: "🧲 Gravidade",
        pergunta: "O que a gravidade faz?",
        opcoes: [
            "Atrai objetos que possuem massa",
            "Impede a existência de estrelas",
            "Produz luz automaticamente",
            "Resfria planetas"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 5
    },

    {
        tema: "🔭 Telescópios",
        pergunta: "Para que serve um telescópio astronômico?",
        opcoes: [
            "Observar objetos distantes no espaço",
            "Criar estrelas",
            "Mudar a órbita dos planetas",
            "Produzir gravidade"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🚀 Foguetes",
        pergunta: "Por que um foguete consegue subir no espaço?",
        opcoes: [
            "Porque seus motores produzem empuxo",
            "Porque não possui massa",
            "Porque a gravidade deixa de existir",
            "Porque o ar o empurra para cima"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "👨‍🚀 Astronautas",
        pergunta: "O que um astronauta utiliza para sobreviver no espaço?",
        opcoes: [
            "Sistemas que fornecem oxigênio e controle ambiental",
            "Somente roupas comuns",
            "Somente água",
            "Nenhum equipamento"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "🪐 Exoplanetas",
        pergunta: "O que é um exoplaneta?",
        opcoes: [
            "Um planeta que orbita uma estrela fora do Sistema Solar",
            "Uma lua da Terra",
            "Um asteroide",
            "Uma estrela pequena"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 5
    },

    {
        tema: "🌞 Sistema Solar",
        pergunta: "Quantos planetas existem no Sistema Solar?",
        opcoes: [
            "8",
            "7",
            "9",
            "10"
        ],
        resposta: 0,
        dificuldade: 1,
        peso: 5
    },

    {
        tema: "🌊 Marés",
        pergunta: "Qual corpo celeste exerce grande influência nas marés da Terra?",
        opcoes: [
            "Lua",
            "Marte",
            "Júpiter",
            "Vênus"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "🌫️ Nebulosas",
        pergunta: "O que é uma nebulosa?",
        opcoes: [
            "Uma grande nuvem de gás e poeira no espaço",
            "Um planeta congelado",
            "Uma lua",
            "Um buraco negro"
        ],
        resposta: 0,
        dificuldade: 2,
        peso: 4
    },

    {
        tema: "💫 Supernovas",
        pergunta: "O que é uma supernova?",
        opcoes: [
            "Uma explosão estelar extremamente energética",
            "Um planeta recém-formado",
            "Uma lua gigante",
            "Um cometa"
        ],
        resposta: 0,
        dificuldade: 3,
        peso: 3
    }
];

function shuffle(array) {
    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}

function weightedRandom(items) {
    if (!items.length) {
        return null;
    }

    const total = items.reduce(
        (sum, item) =>
            sum + Math.max(0, Number(item.peso) || 0),
        0
    );

    if (total <= 0) {
        return items[
            Math.floor(
                Math.random() * items.length
            )
        ];
    }

    let random = Math.random() * total;

    for (const item of items) {
        random -= Math.max(
            0,
            Number(item.peso) || 0
        );

        if (random <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    do {
        code = "";

        for (let i = 0; i < 5; i++) {
            code += chars[
                Math.floor(
                    Math.random() * chars.length
                )
            ];
        }
    } while (rooms.has(code));

    return code;
}

function getProfile(profileId) {
    const key =
        profileId ||
        "temporary-profile";

    if (!playerProfiles.has(key)) {
        playerProfiles.set(
            key,
            {
                totalCorrect: 0,
                totalWrong: 0,
                streak: 0,
                bestStreak: 0,
                themes: {}
            }
        );
    }

    return playerProfiles.get(key);
}

function getThemeStats(profileId, theme) {
    const profile = getProfile(profileId);

    if (!profile.themes[theme]) {
        profile.themes[theme] = {
            acertos: 0,
            erros: 0
        };
    }

    return profile.themes[theme];
}

function registerCorrect(profileId, theme) {
    const profile = getProfile(profileId);
    const stats = getThemeStats(profileId, theme);

    profile.totalCorrect++;
    profile.streak++;

    if (profile.streak > profile.bestStreak) {
        profile.bestStreak =
            profile.streak;
    }

    stats.acertos++;
}

function registerWrong(profileId, theme) {
    const profile = getProfile(profileId);
    const stats = getThemeStats(profileId, theme);

    profile.totalWrong++;
    profile.streak = 0;

    stats.erros++;
}

function getDifficulty(profileId, theme) {
    const profile = getProfile(profileId);
    const stats = getThemeStats(profileId, theme);

    const correct =
        stats.acertos;

    const wrong =
        stats.erros;

    if (
        correct === 0 &&
        wrong === 0
    ) {
        return 2;
    }

    if (
        wrong > correct
    ) {
        return 1;
    }

    if (
        correct >= wrong + 3
    ) {
        return 4;
    }

    if (
        correct >= 6
    ) {
        return 5;
    }

    return 3;
}

function createFallbackQuestion(theme) {
    const filtered =
        LOCAL_QUESTIONS.filter(
            question =>
                question.tema === theme
        );

    const pool =
        filtered.length
            ? filtered
            : LOCAL_QUESTIONS;

    const question =
        weightedRandom(pool);

    if (!question) {
        return {
            tema: theme,
            pergunta:
                "Qual é o planeta em que vivemos?",
            opcoes: [
                "Terra",
                "Marte",
                "Júpiter",
                "Saturno"
            ],
            resposta: 0,
            dificuldade: 1,
            peso: 1
        };
    }

    return {
        tema: question.tema,
        pergunta: question.pergunta,
        opcoes: [...question.opcoes],
        resposta: question.resposta,
        dificuldade:
            question.dificuldade || 1,
        peso:
            question.peso || 1
    };
}
/*
=========================================================
GERAÇÃO DE PERGUNTA COM GROQ
=========================================================
*/

async function generateAIQuestion(
    theme,
    difficulty,
    profileId
) {
    if (!GROQ_API_KEY) {
        return null;
    }

    const profile = getProfile(profileId);

    const themeHistory =
        profile.themes[theme] || {
            acertos: 0,
            erros: 0
        };

    const prompt = `
Crie uma questão de múltipla escolha sobre astronomia.

Tema:
${theme}

Dificuldade desejada:
${difficulty} de 5.

Histórico aproximado do jogador nesse tema:
Acertos: ${themeHistory.acertos}
Erros: ${themeHistory.erros}

A questão deve:
- estar correta cientificamente;
- estar em português do Brasil;
- ter exatamente 4 alternativas;
- ter exatamente uma alternativa correta;
- não depender de notícias atuais;
- não usar pegadinhas;
- variar em relação a perguntas muito comuns;
- respeitar a dificuldade solicitada.

Responda SOMENTE com JSON válido neste formato:

{
  "pergunta": "texto",
  "opcoes": [
    "alternativa 1",
    "alternativa 2",
    "alternativa 3",
    "alternativa 4"
  ],
  "resposta": 0,
  "dificuldade": 3
}

O campo "resposta" deve ser um número de 0 a 3.
`;

    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${GROQ_API_KEY}`
                },

                body: JSON.stringify({
                    model: GROQ_MODEL,

                    messages: [
                        {
                            role: "system",

                            content:
                                "Você é um gerador de questões de astronomia. Responda somente JSON válido."
                        },

                        {
                            role: "user",

                            content: prompt
                        }
                    ],

                    temperature: 0.8,

                    max_completion_tokens: 500
                })
            }
        );

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                "Erro Groq:",
                response.status,
                errorText
            );

            return null;
        }

        const data =
            await response.json();

        let content =
            data
                ?.choices?.[0]
                ?.message
                ?.content;

        if (
            typeof content !==
            "string"
        ) {
            return null;
        }

        content =
            content
                .replace(
                    /```json/gi,
                    ""
                )
                .replace(
                    /```/g,
                    ""
                )
                .trim();

        const question =
            JSON.parse(content);

        if (
            !question.pergunta ||
            !Array.isArray(
                question.opcoes
            ) ||
            question.opcoes.length !== 4 ||
            typeof question.resposta !==
                "number"
        ) {
            return null;
        }

        if (
            question.resposta < 0 ||
            question.resposta > 3
        ) {
            return null;
        }

        return {
            tema: theme,

            pergunta:
                question.pergunta,

            opcoes:
                question.opcoes,

            resposta:
                question.resposta,

            dificuldade:
                Number(
                    question.dificuldade
                ) || difficulty,

            origem: "IA"
        };

    } catch (error) {
        console.error(
            "Falha ao gerar pergunta com Groq:",
            error.message
        );

        return null;
    }
}


/*
=========================================================
ESCOLHA DA PERGUNTA
=========================================================
*/

async function createQuestion(
    theme,
    profileId
) {
    const difficulty =
        getDifficulty(
            profileId,
            theme
        );

    /*
     * A IA tem 80% de chance
     * de ser utilizada.
     */

    const useAI =
        GROQ_API_KEY &&
        Math.random() < 0.8;

    if (useAI) {
        const aiQuestion =
            await generateAIQuestion(
                theme,
                difficulty,
                profileId
            );

        if (aiQuestion) {
            return aiQuestion;
        }
    }

    /*
     * Procura perguntas locais
     * do mesmo tema.
     */

    const localQuestions =
        LOCAL_QUESTIONS.filter(
            question =>
                question.tema === theme
        );

    if (
        localQuestions.length > 0
    ) {
        /*
         * Dá preferência à dificuldade
         * mais próxima do jogador.
         */

        const sorted =
            [...localQuestions].sort(
                (a, b) =>
                    Math.abs(
                        a.dificuldade -
                        difficulty
                    ) -
                    Math.abs(
                        b.dificuldade -
                        difficulty
                    )
            );

        /*
         * Mantém alguma aleatoriedade
         * entre as perguntas próximas.
         */

        const candidates =
            sorted.slice(
                0,
                Math.min(
                    3,
                    sorted.length
                )
            );

        return weightedRandom(
            candidates
        );
    }

    /*
     * Caso não exista pergunta local
     * para aquele tema.
     */

    return createFallbackQuestion(
        theme
    );
}


/*
=========================================================
CARTAS
=========================================================
*/

function createCards(mode) {
    const pairCount =
        mode === "impossible"
            ? 41
            : 16;

    const selectedThemes =
        shuffle(
            THEMES
        ).slice(
            0,
            pairCount
        );

    const cards = [];

    selectedThemes.forEach(
        (themeData, index) => {

            const pairId =
                `pair-${index + 1}`;

            cards.push({
                id:
                    `${pairId}-a`,

                pairId,

                theme:
                    themeData.theme,

                icon:
                    themeData.icon,

                matched:
                    false,

                revealed:
                    false
            });

            cards.push({
                id:
                    `${pairId}-b`,

                pairId,

                theme:
                    themeData.theme,

                icon:
                    themeData.icon,

                matched:
                    false,

                revealed:
                    false
            });
        }
    );

    return shuffle(
        cards
    );
}


/*
=========================================================
EMBARALHAR APENAS AS CARTAS NÃO ENCONTRADAS
=========================================================
*/

function reshuffleUnmatched(
    room
) {
    const unmatched =
        room.cards.filter(
            card =>
                !card.matched
        );

    const matched =
        room.cards.filter(
            card =>
                card.matched
        );

    const shuffled =
        shuffle(
            unmatched
        );

    room.cards = [
        ...matched,
        ...shuffled
    ];
}


/*
=========================================================
ESTADO PÚBLICO DA SALA
=========================================================
*/

function publicRoom(
    room
) {
    return {
        code:
            room.code,

        mode:
            room.mode,

        gameStarted:
            room.gameStarted,

        gameFinished:
            room.gameFinished,

        turn:
            room.turn,

        currentPlayerIndex:
            room.turn,

        currentPlayerId:
            room.players[
                room.turn
            ]?.id || null,

        players:
            room.players.map(
                player => ({
                    id:
                        player.id,

                    name:
                        player.name,

                    score:
                        player.score,

                    ready:
                        player.ready
                })
            ),

        cards:
            room.cards.map(
                card => ({
                    id:
                        card.id,

                    pairId:
                        card.pairId,

                    theme:
                        card.theme,

                    icon:
                        card.icon,

                    revealed:
                        card.revealed,

                    matched:
                        card.matched
                })
            )
    };
}


/*
=========================================================
ENVIAR ESTADO DA SALA
=========================================================
*/

function broadcastRoom(
    room
) {
    io.to(room.code).emit(
        "roomUpdate",
        publicRoom(room)
    );
}


/*
=========================================================
CRIAR UMA NOVA SALA
=========================================================
*/

function createRoomData(
    code,
    mode
) {
    return {
        code,

        mode:
            mode === "impossible"
                ? "impossible"
                : "easy",

        players: [],

        cards: [],

        gameStarted:
            false,

        gameFinished:
            false,

        turn: 0,

        pendingQuiz:
            null,

        rematchVotes:
            new Set(),

        createdAt:
            Date.now()
    };
}


/*
=========================================================
INICIAR PARTIDA
=========================================================
*/

function startGame(
    room
) {
    room.gameStarted =
        true;

    room.gameFinished =
        false;

    room.turn =
        0;

    room.cards =
        createCards(
            room.mode
        );

    room.pendingQuiz =
        null;

    room.rematchVotes =
        new Set();

    room.players.forEach(
        player => {
            player.score = 0;
            player.ready = false;
        }
    );

    io.to(room.code).emit(
        "gameStarted",
        publicRoom(room)
    );

    broadcastRoom(
        room
    );
}


/*
=========================================================
VERIFICAR SE TODOS ESTÃO PRONTOS
=========================================================
*/

function checkReady(
    room
) {
    if (
        room.players.length !== 2
    ) {
        return;
    }

    const allReady =
        room.players.every(
            player =>
                player.ready === true
        );

    if (
        allReady &&
        !room.gameStarted
    ) {
        startGame(room);
    }
}


/*
=========================================================
ENCONTRAR SALA PELO SOCKET
=========================================================
*/

function findRoomBySocket(
    socketId
) {
    for (
        const room of rooms.values()
    ) {
        const player =
            room.players.find(
                player =>
                    player.socketId ===
                    socketId
            );

        if (player) {
            return {
                room,
                player
            };
        }
    }

    return null;
}


/*
=========================================================
FINALIZAR PARTIDA
=========================================================
*/

function checkGameFinished(
    room
) {
    const allMatched =
        room.cards.length > 0 &&
        room.cards.every(
            card =>
                card.matched
        );

    if (!allMatched) {
        return false;
    }

    room.gameFinished =
        true;

    room.gameStarted =
        false;

    room.pendingQuiz =
        null;

    const ranking =
        [...room.players]
            .sort(
                (a, b) =>
                    b.score - a.score
            )
            .map(
                (player, index) => ({
                    id:
                        player.id,

                    name:
                        player.name,

                    score:
                        player.score,

                    position:
                        index + 1
                })
            );

    io.to(room.code).emit(
        "gameFinished",
        {
            ranking,

            players:
                room.players.map(
                    player => ({
                        id:
                            player.id,

                        name:
                            player.name,

                        score:
                            player.score
                    })
                )
        }
    );

    broadcastRoom(
        room
    );

    return true;
}


/*
=========================================================
REMOVER JOGADOR / FECHAR SALA
=========================================================
*/

function removePlayer(
    socket
) {
    const found =
        findRoomBySocket(
            socket.id
        );

    if (!found) {
        return;
    }

    const {
        room,
        player
    } = found;

    const playerIndex =
        room.players.findIndex(
            p =>
                p.id === player.id
        );

    if (
        playerIndex >= 0
    ) {
        room.players.splice(
            playerIndex,
            1
        );
    }

    socket.leave(
        room.code
    );

    if (
        room.players.length === 0
    ) {
        rooms.delete(
            room.code
        );

        return;
    }

    io.to(room.code).emit(
        "playerLeft",
        {
            name:
                player.name
        }
    );

    broadcastRoom(
        room
    );
}
/*
=========================================================
SOCKET.IO
=========================================================
*/

io.on("connection", socket => {

    console.log(
        "Jogador conectado:",
        socket.id
    );


    /*
    =====================================================
    CRIAR SALA
    =====================================================
    */

    socket.on(
        "createRoom",
        data => {

            const name =
                String(
                    data?.name || ""
                ).trim();

            const mode =
                data?.mode ===
                "impossible"
                    ? "impossible"
                    : "easy";

            const profileId =
                String(
                    data?.profileId || ""
                ).trim();

            if (!name) {
                socket.emit(
                    "errorMessage",
                    "Digite seu nome."
                );

                return;
            }

            const code =
                generateRoomCode();

            const room =
                createRoomData(
                    code,
                    mode
                );

            room.players.push({
                id:
                    socket.id,

                socketId:
                    socket.id,

                name,

                profileId:
                    profileId ||
                    `socket-${socket.id}`,

                score: 0,

                ready: false
            });

            rooms.set(
                code,
                room
            );

            socket.join(
                code
            );

            socket.emit(
                "roomCreated",
                {
                    code,

                    mode,

                    playerId:
                        socket.id
                }
            );

            broadcastRoom(
                room
            );

            console.log(
                `Sala ${code} criada por ${name}`
            );
        }
    );


    /*
    =====================================================
    ENTRAR EM SALA
    =====================================================
    */

    socket.on(
        "joinRoom",
        data => {

            const name =
                String(
                    data?.name || ""
                ).trim();

            const code =
                String(
                    data?.code || ""
                )
                .trim()
                .toUpperCase();

            const profileId =
                String(
                    data?.profileId || ""
                ).trim();

            if (!name) {
                socket.emit(
                    "errorMessage",
                    "Digite seu nome."
                );

                return;
            }

            if (!code) {
                socket.emit(
                    "errorMessage",
                    "Digite o código da partida."
                );

                return;
            }

            const room =
                rooms.get(
                    code
                );

            if (!room) {
                socket.emit(
                    "errorMessage",
                    "Partida não encontrada."
                );

                return;
            }

            if (
                room.players.length >= 2
            ) {
                socket.emit(
                    "errorMessage",
                    "Essa partida já possui 2 jogadores."
                );

                return;
            }

            if (
                room.gameStarted
            ) {
                socket.emit(
                    "errorMessage",
                    "Essa partida já começou."
                );

                return;
            }

            room.players.push({
                id:
                    socket.id,

                socketId:
                    socket.id,

                name,

                profileId:
                    profileId ||
                    `socket-${socket.id}`,

                score: 0,

                ready: false
            });

            socket.join(
                code
            );

            socket.emit(
                "roomJoined",
                {
                    code,

                    mode:
                        room.mode,

                    playerId:
                        socket.id
                }
            );

            broadcastRoom(
                room
            );

            console.log(
                `${name} entrou na sala ${code}`
            );
        }
    );


    /*
    =====================================================
    MARCAR COMO PRONTO
    =====================================================
    */

    socket.on(
        "setReady",
        () => {

            const found =
                findRoomBySocket(
                    socket.id
                );

            if (!found) {
                socket.emit(
                    "errorMessage",
                    "Você não está em uma partida."
                );

                return;
            }

            const {
                room,
                player
            } = found;

            if (
                room.players.length !== 2
            ) {
                socket.emit(
                    "errorMessage",
                    "É necessário ter 2 jogadores para iniciar."
                );

                return;
            }

            if (
                room.gameStarted
            ) {
                return;
            }

            player.ready =
                !player.ready;

            broadcastRoom(
                room
            );

            checkReady(
                room
            );
        }
    );


    /*
    =====================================================
    SELECIONAR CARTA
    =====================================================
    */

    socket.on(
        "selectCard",
        async data => {

            const found =
                findRoomBySocket(
                    socket.id
                );

            if (!found) {
                return;
            }

            const {
                room,
                player
            } = found;

            if (
                !room.gameStarted
            ) {
                return;
            }

            if (
                room.gameFinished
            ) {
                return;
            }

            /*
             * Não permite clicar durante
             * um quiz ativo.
             */

            if (
                room.pendingQuiz
            ) {
                return;
            }

            /*
             * Descobre o índice/código da carta.
             *
             * O game.js atual envia:
             *
             * {
             *   code: roomCode,
             *   index: index
             * }
             *
             * Também aceitamos cardId diretamente.
             */

            let cardId = null;

            if (
                typeof data ===
                "string"
            ) {
                cardId =
                    data;
            } else if (
                data?.cardId
            ) {
                cardId =
                    data.cardId;
            } else if (
                Number.isInteger(
                    data?.index
                )
            ) {
                cardId =
                    room
                        .cards[
                            data.index
                        ]?.id;
            }

            if (!cardId) {
                return;
            }

            const card =
                room.cards.find(
                    item =>
                        item.id ===
                        cardId
                );

            if (!card) {
                return;
            }

            /*
             * Só pode jogar quem está na vez.
             */

            const playerIndex =
                room.players.findIndex(
                    item =>
                        item.id ===
                        player.id
                );

            if (
                playerIndex !==
                room.turn
            ) {
                socket.emit(
                    "errorMessage",
                    "Aguarde sua vez."
                );

                return;
            }

            /*
             * Carta já encontrada.
             */

            if (
                card.matched
            ) {
                return;
            }

            /*
             * Carta já virada.
             */

            if (
                card.revealed
            ) {
                return;
            }

            /*
             * Descobre se existe outra carta
             * revelada aguardando comparação.
             */

            const firstCard =
                room.cards.find(
                    item =>
                        item.revealed &&
                        !item.matched
                );

            /*
             * Evita problemas caso uma carta
             * seja clicada novamente.
             */

            if (
                firstCard &&
                firstCard.id ===
                    card.id
            ) {
                return;
            }

            /*
             * Revela a carta.
             */

            card.revealed =
                true;

            broadcastRoom(
                room
            );


            /*
            =============================================
            PRIMEIRA CARTA
            =============================================
            */

            if (!firstCard) {
                return;
            }


            /*
            =============================================
            SEGUNDA CARTA
            =============================================
            */

            /*
             * Verifica se as duas cartas
             * realmente pertencem ao mesmo par.
             */

            const isPair =
                firstCard.pairId ===
                card.pairId;


            /*
            =============================================
            NÃO É PAR
            =============================================
            */

            if (!isPair) {

                /*
                 * Dá um pequeno tempo para
                 * os jogadores visualizarem
                 * as duas cartas.
                 */

                setTimeout(
                    () => {

                        if (
                            !rooms.has(
                                room.code
                            )
                        ) {
                            return;
                        }

                        firstCard.revealed =
                            false;

                        card.revealed =
                            false;

                        /*
                         * No modo impossível,
                         * as cartas restantes
                         * são embaralhadas.
                         */

                        if (
                            room.mode ===
                            "impossible"
                        ) {
                            reshuffleUnmatched(
                                room
                            );
                        }

                        /*
                         * Passa a vez.
                         */

                        room.turn =
                            room.turn === 0
                                ? 1
                                : 0;

                        io.to(
                            room.code
                        ).emit(
                            "pairMismatch",
                            {
                                playerId:
                                    player.id
                            }
                        );

                        broadcastRoom(
                            room
                        );

                    },
                    700
                );

                return;
            }


            /*
            =============================================
            É PAR — ABRIR QUIZ
            =============================================
            */

            const question =
                await createQuestion(
                    card.theme,
                    player.profileId
                );

            /*
             * A sala pode ter sido fechada
             * enquanto a IA gerava a pergunta.
             */

            if (
                !rooms.has(
                    room.code
                )
            ) {
                return;
            }

            /*
             * Token exclusivo desse quiz.
             *
             * Isso impede respostas antigas
             * de serem reutilizadas.
             */

            const token =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;

            room.pendingQuiz = {
                token,

                selectedCards: [
                    firstCard.id,
                    card.id
                ],

                quiz:
                    question,

                finderId:
                    player.id,

                answered:
                    new Set(),

                wrongPlayers:
                    new Set()
            };

            /*
             * IMPORTANTE:
             *
             * Não enviamos "resposta"
             * para o navegador.
             *
             * A resposta correta permanece
             * somente no servidor.
             */

            io.to(
                room.code
            ).emit(
                "quiz",
                {
                    tema:
                        question.tema,

                    pergunta:
                        question.pergunta,

                    opcoes:
                        question.opcoes,

                    token,

                    finderId:
                        player.id
                }
            );
        }
    );


    /*
    =====================================================
    RESPONDER QUIZ
    =====================================================
    */

    socket.on(
        "answerQuiz",
        data => {

            const found =
                findRoomBySocket(
                    socket.id
                );

            if (!found) {
                return;
            }

            const {
                room,
                player
            } = found;

            const pending =
                room.pendingQuiz;

            if (!pending) {
                return;
            }

            /*
             * Confere o token.
             */

            if (
                data?.token !==
                pending.token
            ) {
                socket.emit(
                    "errorMessage",
                    "Esse quiz não é mais válido."
                );

                return;
            }

            /*
             * Impede o mesmo jogador
             * de responder duas vezes.
             */

            if (
                pending.answered.has(
                    player.id
                )
            ) {
                return;
            }

            pending.answered.add(
                player.id
            );

            const answer =
                Number(
                    data?.answer
                );

            /*
             * A resposta correta está
             * somente no servidor.
             */

            const isCorrect =
                Number.isInteger(
                    answer
                ) &&
                answer ===
                    pending.quiz.resposta;


            /*
            =============================================
            RESPOSTA CORRETA
            =============================================
            */

            if (isCorrect) {

                registerCorrect(
                    player.profileId,
                    pending.quiz.tema
                );

                /*
                 * As duas cartas ficam
                 * permanentemente encontradas.
                 */

                for (
                    const cardId
                    of pending.selectedCards
                ) {

                    const selectedCard =
                        room.cards.find(
                            card =>
                                card.id ===
                                cardId
                        );

                    if (
                        selectedCard
                    ) {
                        selectedCard.matched =
                            true;

                        selectedCard.revealed =
                            true;
                    }
                }

                /*
                 * Cada par vale 2 cartas.
                 */

                player.score +=
                    pending.selectedCards.length;

                /*
                 * Quem respondeu corretamente
                 * ganha o par.
                 *
                 * Também fica sendo o jogador
                 * da vez.
                 */

                const winnerIndex =
                    room.players.findIndex(
                        item =>
                            item.id ===
                            player.id
                    );

                if (
                    winnerIndex >= 0
                ) {
                    room.turn =
                        winnerIndex;
                }

                const winnerName =
                    player.name;

                room.pendingQuiz =
                    null;

                /*
                 * No modo impossível,
                 * somente as cartas ainda não
                 * encontradas são embaralhadas.
                 */

                if (
                    room.mode ===
                    "impossible"
                ) {
                    reshuffleUnmatched(
                        room
                    );
                }

                io.to(
                    room.code
                ).emit(
                    "quizResult",
                    {
                        correct:
                            true,

                        playerId:
                            player.id,

                        playerName:
                            winnerName,

                        score:
                            player.score
                    }
                );

                /*
                 * Verifica se acabou.
                 */

                if (
                    checkGameFinished(
                        room
                    )
                ) {
                    return;
                }

                broadcastRoom(
                    room
                );

                return;
            }


            /*
            =============================================
            RESPOSTA ERRADA
            =============================================
            */

            registerWrong(
                player.profileId,
                pending.quiz.tema
            );

            pending.wrongPlayers.add(
                player.id
            );

            /*
             * Informa que aquele jogador
             * errou, mas mantém o quiz aberto
             * para o outro jogador.
             */

            socket.emit(
                "quizResult",
                {
                    correct:
                        false,

                    playerId:
                        player.id,

                    waiting:
                        true
                }
            );

            /*
             * Só encerra a tentativa quando
             * os dois jogadores tiverem errado.
             */

            if (
                pending.answered.size <
                room.players.length
            ) {
                return;
            }


            /*
            =============================================
            OS DOIS ERRARAM
            =============================================
            */

            const selectedIds =
                pending.selectedCards;

            selectedIds.forEach(
                cardId => {

                    const selectedCard =
                        room.cards.find(
                            card =>
                                card.id ===
                                cardId
                        );

                    if (
                        selectedCard
                    ) {
                        selectedCard.revealed =
                            false;
                    }
                }
            );

            room.pendingQuiz =
                null;

            /*
             * Passa a vez.
             */

            room.turn =
                room.turn === 0
                    ? 1
                    : 0;

            /*
             * No modo impossível,
             * embaralha as cartas restantes.
             */

            if (
                room.mode ===
                "impossible"
            ) {
                reshuffleUnmatched(
                    room
                );
            }

            io.to(
                room.code
            ).emit(
                "quizResult",
                {
                    correct:
                        false,

                    finished:
                        true
                }
            );

            io.to(
                room.code
            ).emit(
                "cardsHidden"
            );

            broadcastRoom(
                room
            );
        }
    );


    /*
    =====================================================
    REVANCHE
    =====================================================
    */

    const handleRematch =
        data => {

            const found =
                findRoomBySocket(
                    socket.id
                );

            if (!found) {
                return;
            }

            const {
                room,
                player
            } = found;

            if (
                !room.gameFinished
            ) {
                return;
            }

            /*
             * Registra o voto desse jogador.
             */

            room.rematchVotes.add(
                player.id
            );

            /*
             * Ainda falta o outro jogador.
             */

            if (
                room.rematchVotes.size <
                room.players.length
            ) {

                io.to(
                    room.code
                ).emit(
                    "rematchWaiting",
                    {
                        name:
                            player.name
                    }
                );

                return;
            }

            /*
             * Os dois aceitaram.
             */

            startGame(
                room
            );

            io.to(
                room.code
            ).emit(
                "rematchStarted"
            );
        };


    /*
     * Aceitamos os dois nomes de evento
     * para compatibilidade.
     */

    socket.on(
        "rematch",
        handleRematch
    );

    socket.on(
        "requestRematch",
        handleRematch
    );


    /*
    =====================================================
    DESCONECTAR
    =====================================================
    */

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Jogador desconectado:",
                socket.id
            );

            removePlayer(
                socket
            );
        }
    );
});


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get(
    "/health",
    (req, res) => {

        res.json({
            ok: true,

            ai:
                Boolean(
                    GROQ_API_KEY
                ),

            model:
                GROQ_MODEL,

            rooms:
                rooms.size
        });
    }
);


/*
=========================================================
INICIAR SERVIDOR
=========================================================
*/

server.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

        console.log(
            `Modelo: ${GROQ_MODEL}`
        );

        console.log(
            `Groq configurado: ${
                GROQ_API_KEY
                    ? "SIM"
                    : "NÃO"
            }`
        );
    }
);