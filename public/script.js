// Define variables
let socket;
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const questionCounterText = document.getElementById("questionCounter");
const scoreText = document.getElementById("score");
const playerName = document.getElementById("playerName");
const finalScore = document.getElementById("finalScore");

const Correct_bonus = 10;
const Max_questions = 5;
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];
let NAME = "";

// Function to initialize the socket connection
function initializeSocket() {
    // Prompt for the user's name
    const name = prompt("What is your name?");
    if (!name) {
        alert("Please enter your name.");
        return;
    }
    NAME = name;

    // Connect to the server using Socket.io
    socket = io("https://quizwhiz-jmy1.onrender.com");

    // Add event listeners
    socket.on("connect", () => {
        console.log("Connected to the server");
        socket.emit("new-user", roomName, name);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from the server");
    });

    // Handle incoming messages and events
    socket.on("room-created", (room) => {
        console.log("room", room);
        const roomElement = document.createElement("div");
        roomElement.innerText = room;
        const roomLink = document.createElement("a");
        roomLink.href = `/${room}`;
        roomLink.innerText = "join";
        roomContainer.append(roomElement);
        roomContainer.append(roomLink);
    });

    socket.on("chat-message", (data) => {
        appendMessage(`${data.name}: ${data.message}`);
    });

    socket.on("user-connected", (name) => {
        console.log("nameo", name);
        appendMessage(`${name} connected`);
    });

    socket.on("user-disconnected", (name) => {
        appendMessage(`${name} disconnected`);
    });

    socket.on("user-full", (name) => {
        console.log("nameee", name);
        location.href = "/";
    });
}

// Function to append a message to the message container
function appendMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}

// Function to start the game
function startGame() {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    console.log(availableQuestions);
    getNewQuestion10();
}

// Function to get a new question every 10 seconds
function getNewQuestion10() {
    setInterval(getNewQuestion, 10000);
}

// Function to get a new question
function getNewQuestion() {
    console.log("questionCounter, Max_questions", questionCounter, Max_questions);
    if (availableQuestions.length === 0 || questionCounter >= Max_questions) {
        console.log("scoreText.innerText=", NAME, scoreText.innerText);
        const playScore = {
            roomName: roomName,
            name: NAME,
            score: scoreText.innerText,
        };
        console.log("Object", playScore);

        (async () => {
            const rawResponse = await fetch("/game/end", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playScore),
            });
            const content = await rawResponse.json();

            console.log(content);
            if (content == "True") {
                location.href = "/game/board";
            }
        })();
    }
    questionCounter++;
    questionCounterText.innerText = `${questionCounter}  / ${Max_questions}`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    choices.forEach((choice) => {
        const number = choice.dataset["number"];
        choice.innerText = currentQuestion["choice" + number];
    });

    availableQuestions.splice(questionIndex, 1);

    acceptingAnswers = true;
}

// Function to handle user choice selection and scoring
function handleChoiceClick(e) {
    if (!acceptingAnswers) return;

    acceptingAnswers = false;
    const selectChoice = e.target;
    const selectAnswer = selectChoice.dataset["number"];
    const classToApply = selectAnswer == currentQuestion.answer ? "correct" : "incorrect";

    if (classToApply == "correct") {
        incrementScore(Correct_bonus);
    }
    selectChoice.parentElement.classList.add(classToApply);

    setTimeout(() => {
        selectChoice.parentElement.classList.remove(classToApply);
        getNewQuestion();
    }, 1000);
}

// Function to increment the score
function incrementScore(num) {
    score += num;
    scoreText.innerText = score;
}

// Call the function to initialize the socket connection
initializeSocket();

// Add event listeners for choice clicks
choices.forEach((choice) => {
    choice.addEventListener("click", handleChoiceClick);
});

// Start the game when the quiz starts (adjust the event name accordingly)
socket.on("quiz-start", (room) => {
    startGame();
});
