const socket = io();

const messageContainer = document.getElementById("message-containers");
const roomContainer = document.getElementById("room-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

var NAME = "";

if (messageForm != null) {
  const name = prompt("What is your name?");
  NAME = name;
  appendMessage("You joined");
  console.log("Playername", name);
  socket.emit("new-user", roomName, name);

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value;
    appendMessage(`You: ${message}`);
    socket.emit("send-chat-message", roomName, message);
    messageInput.value = "";
  });
}

socket.on("room-created", (room) => {
  console.log("room inside client", room);
  const roomElement = document.createElement("div");
  roomElement.innerText = room;
  const roomLink = document.createElement("a");
  roomLink.href = `/${room}`;
  roomLink.innerText = "join";
  roomContainer.append(roomElement);
  roomContainer.append(roomLink);
  console.log("roomLink",roomLink)
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
  alert("Sorry, the room is full. Please try another room.");

  location.href = "/";
});

function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
}

const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const questionCounterText = document.getElementById("questionCounter");
const scoreText = document.getElementById("score");

let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];

let questions = [
  {
    question: "Who gave the slogan -'Jai Hind?",
    choice1: "Bhagat Singh",
    choice2: "Subhash Chandra Bose",
    choice3: "Mangal Pandey",
    choice4: "Mahatma Gandhi",
    answer: 2,
  },
  {
    question:
      "During Which movement did Gandhi gave the call to boycott the foreign goods?",
    choice1: "Khilafat Movement",
    choice2: "Non-cooperation Movement",
    choice3: "Swadeshi Movement",
    choice4: "Civil Disobedience Movement",
    answer: 3,
  },
  {
    question: "Who is the only Indian Spin bowler to have taken 5 wickets in a World Cup match?",
    choice1: "Yuvraj Singh",
    choice2: "aManinder Singh",
    choice3: "Venkatpathy Raju",
    choice4: "Harbhajan Singh",
    answer: 1,
  },
  {
    question: "Who is the only Indian Batsman to have scored a hundred on ODI debut?",
    choice1: "Suresh Raina",
    choice2: "Kedar Jadhav",
    choice3: "Ajay Jadeja",
    choice4: "KL Rahul",
    answer: 4,
  },
  {
    question:
      "Minimum duration to stay in India before applying for Indian Citizenship",
    choice1: "3 Years",
    choice2: "10 Years",
    choice3: "5 Years",
    choice4: "7 Years",
    answer: 3,
  },
];

const Correct_bonus = 10;
const Max_questions = 5;

startGame = () => {
  questionCounter = 0;
  score = 0;
  availableQuestions = [...questions];
  console.log(availableQuestions);
  getNewQuestion10();
};

getNewQuestion10 = () => {
  setInterval(function () {
    getNewQuestion();
  }, 10000);
};

getNewQuestion = () => {
  console.log("questionCounter,Max_questions", questionCounter, Max_questions);
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
};



choices.forEach((choice) => {
  choice.addEventListener("click", (e) => {
    if (!acceptingAnswers) return;

    acceptingAnswers = false;
    const selectChoice = e.target;
    const selectAnswer = selectChoice.dataset["number"];
    const classToapply =
      selectAnswer == currentQuestion.answer ? "correct" : "incorrect";

    if (classToapply == "correct") {
      incrementScore(Correct_bonus);
    }
    selectChoice.parentElement.classList.add(classToapply);

    setTimeout(() => {
      selectChoice.parentElement.classList.remove(classToapply);
      getNewQuestion();
    }, 1000);
    
  });
});

incrementScore = (num) => {
  score += num;
  scoreText.innerText = score;
};

const playerName = document.getElementById("playerName");

const finalScore = document.getElementById("finalScore");

saveHighScore = (e) => {
  console.log("clicked the save button");
  e.preventDefault();
  console.log("playerName", playerName.innerText);
};
// startGame();

socket.on("quiz-start", (room) => {
  startGame();
});
