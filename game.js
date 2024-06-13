const canvas = document.getElementById('jogo');
const ctx = canvas.getContext('2d');

class CardSnap {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.cards = [];
    }
}

class Card {
    constructor(number, suit) {
        this.number = number;
        this.suit = suit;
        this.flipped = false;
        this.snap = mainSetClosed();
        this.movingX = 0;
        this.movingY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    drawCard(x, y, isMoving = false) {
        if (!isMoving && movingCards.includes(this)) return;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.roundRect(x, y, 100, 150, 10);
        ctx.stroke();
        ctx.fill();

        if (this.flipped) {
            let suitImage = new Image();
            suitImage.onload = () => {
                ctx.drawImage(suitImage, x + 42, y + 10, 16, 20);
            };
            switch (this.suit) {
                case "diamonds":
                    ctx.fillStyle = "red";
                    suitImage.src = "Ouros.png";
                    break;
                case "spades":
                    ctx.fillStyle = "black";
                    suitImage.src = "spade.png";
                    break;
                case "hearts":
                    ctx.fillStyle = "red";
                    suitImage.src = "Heart.png";
                    break;
                case "clubs":
                    ctx.fillStyle = "black";
                    suitImage.src = "Clubs.png";
                    break;
            }
            ctx.font = "24px Arial";
            ctx.fillText(this.number, x + 10, y + 30);
        } else {
            ctx.fillStyle = "blue"; // Cor para a parte de trás da carta
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 5, 90, 140, 10);
            ctx.fill();
        }
    }

    moveSnap(newSnap){
        let oldSnap = this.snap;
        let i = oldSnap.cards.indexOf(this);
        oldSnap.cards.splice(i, 1);
        this.snap = newSnap;
        newSnap.cards.push(this);

        if (oldSnap.type == "tower" && oldSnap.cards.length){
            oldSnap.cards[oldSnap.cards.length - 1].flipped = true;
        }
        if(newSnap.type == "mainSetClosed"){
            this.flipped = false;
        } else {
            this.flipped = true;
        }
    }

    canMoveToSnap(newSnap){
        const snapCurrentCard = newSnap.cards[newSnap.cards.length - 1];

        if (!snapCurrentCard && this.number == "A" && newSnap.type == "mount") {
            return true;
        }

        if (!snapCurrentCard && newSnap.type == "tower") {
            return true;
        }

        if (snapCurrentCard && newSnap.type == "tower" &&
            numbers.indexOf(this.number) == numbers.indexOf(snapCurrentCard.number) -1 &&
            stackableSuit(this.suit, snapCurrentCard.suit)) {
            return true;
        }

        if (snapCurrentCard && numbers.indexOf(this.number) == numbers.indexOf(snapCurrentCard.number) + 1 &&
            this.suit == snapCurrentCard.suit &&
            newSnap.type == "mount") {
            return true;
        }

        return false;
    }
}

let initialCards = [];
let movingCards = [];
let gameOver = false;
const suits = ["diamonds", "spades", "hearts", "clubs"];
const numbers = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const towersN = [1, 2, 3, 4, 5, 6, 7];

const cardSnaps = [
    new CardSnap(40, 30, "mainSetClosed"),
    new CardSnap(160, 30, "mainSetOpened"),
    new CardSnap(400, 30, "mount"),
    new CardSnap(520, 30, "mount"),
    new CardSnap(640, 30, "mount"),
    new CardSnap(760, 30, "mount"),
    new CardSnap(40, 200, "tower"),
    new CardSnap(160, 200, "tower"),
    new CardSnap(280, 200, "tower"),
    new CardSnap(400, 200, "tower"),
    new CardSnap(520, 200, "tower"),
    new CardSnap(640, 200, "tower"),
    new CardSnap(760, 200, "tower"),
];

// Funções lógicas do código 
function generateCardsSet() {
    suits.forEach(s => {
        numbers.forEach(n => {
            initialCards.push(new Card(n, s));
        });
    });
}

function shuffleSet() {
    for (let i = initialCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialCards[i], initialCards[j]] = [initialCards[j], initialCards[i]];
    }
}

function distribuiteInitialSetup() {
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < towersN[i]; j++) {
            let index = Math.floor(Math.random() * initialCards.length);
            let randomCard = initialCards[index];
            const snap = cardSnaps[i + 6];
            randomCard.snap = snap;
            snap.cards.push(randomCard);

            if (j == towersN[i] - 1) {
                randomCard.flipped = true;
            }
            initialCards.splice(index, 1);
        }
    }

    mainSetClosed().cards = initialCards;
}

function detectClickedCard(x, y) {
    // Para as cartas abertas 
    allCards().filter(c => c.flipped).forEach(c => {
        let factor = 1;
        if (c.snap.type == "tower") {
            const i = c.snap.cards.length - 1;
            const j = c.snap.cards.indexOf(c);
            factor = i == j ? (i * 20) : (i * 20) - 130;
        }
        if (x >= c.snap.x && x <= c.snap.x + 100 && y >= c.snap.y + factor && y < c.snap.y + 150 + factor) {
            switch (c.snap.type) {
                case "tower":
                    let flippedCards = c.snap.cards.filter(c => c.flipped);
                    const unflippedCards = c.snap.cards.filter(c => !c.flipped);
                    const CardClickedIndex = Math.min(Math.floor((y - c.snap.y) / 20), c.snap.cards.length - 1);
                    const flippedMovingIndex = CardClickedIndex - unflippedCards.length;
                    movingCards = flippedCards.slice(flippedMovingIndex);

                    movingCards.forEach((f, j) => {
                        f.mouseX = x - c.snap.x;
                        f.mouseY = y - (flippedMovingIndex * 20);
                    });
                    break;
                case "mainSetOpened":
                    if (c == c.snap.cards[c.snap.cards.length - 1]) {
                        let currentCard = c;
                        currentCard.movingX = c.snap.x;
                        currentCard.movingY = c.snap.y + factor;
                        movingCards.push(c);
                    }
                    break;
            }
        }
    });

    // Monte fechado
    if (x >= mainSetClosed().x && x <= mainSetClosed().x + 100 && y >= mainSetClosed().y && y <= mainSetClosed().y + 150) {
        let cards = mainSetClosed().cards;

        if (!cards.length) {
            let openedCards = [...mainSetOpened().cards];
            
            openedCards.forEach(c => {
                c.moveSnap(mainSetClosed());
            });
            return; 
        }
        let card = cards[0];
        card.moveSnap(mainSetOpened());
    }
}

function detectSnappedArea(card, x, y){
    cardSnaps.forEach(s => {
        let factor = 1;
        if (s.type == "tower"){
            const i = s.cards.length - 1;
            factor = (i * 20);
        }
        if(x >= s.x && x <= s.x + 100 && y >= s.y && y <= s.y + 150 + factor){
            if (card.canMoveToSnap(s)){
                movingCards.forEach(c => {
                    c.moveSnap(s);
                });
                checkGameOver();
            }
        }
    });
}

function start() {
    generateCardsSet();
    shuffleSet();
    distribuiteInitialSetup();
}

// Funções utilitárias 
function mainSetOpened() {
    return cardSnaps.find(s => s.type === "mainSetOpened");
}

function mainSetClosed() {
    return cardSnaps.find(s => s.type === "mainSetClosed");
}

function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return [x, y];
}

function allCards() {
    return cardSnaps.map(s => s.cards).flat();
}

function stackableSuit (suitA, suitB){
    switch (suitA){
        case "diamonds":
        case "hearts":
            return ["clubs", "spades"].includes(suitB);
        case "clubs":
        case "spades":
            return ["diamonds", "hearts"].includes(suitB);
    }
}

function checkGameOver() {
    let allMountCards = cardSnaps.filter(s => s.type === "mount").map(s => s.cards).flat();
    if (allMountCards.length === 52) {
        gameOver = true;
    }
}

// DESENHO DAS CARTAS
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameOver) {
        drawGameOver();
    } else {
        drawSnaps();
        drawMovingCards();
        requestAnimationFrame(draw);
    }
}

function drawSnaps() {
    cardSnaps.forEach(s => {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.roundRect(s.x, s.y, 100, 150, 4);
        ctx.stroke();

        switch (s.type) {
            case "mount":
            case "mainSetClosed":
            case "mainSetOpened":
                s.cards.forEach(C => {
                    C.drawCard(s.x, s.y);
                });
                break;
            case "tower":
                s.cards.forEach((c, i) => {
                    c.drawCard(s.x, s.y + (i * 20));
                });
                break;
        }
    });
}

function drawMovingCards() {
    if (movingCards.length) {
        movingCards.forEach(c => c.drawCard(c.movingX, c.movingY, true));
    }
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
}

document.addEventListener("mousedown", e => {
    const [x, y] = getXY(e);
    detectClickedCard(x, y);

    movingCards.forEach(c => {
        c.mouseX = x - c.snap.x;
        c.mouseY = y - c.movingY;
    });
});

document.addEventListener("mouseup", e => {
    const [x,y] = getXY(e);
    if (movingCards.length > 0) {
        detectSnappedArea(movingCards[0], x, y);
        movingCards = [];
    }
});

document.addEventListener("mousemove", e => {
    const [x, y] = getXY(e);
    movingCards.forEach((c, k) => {
        c.movingX = x - c.mouseX;
        c.movingY = y - c.mouseY + (k * 20);
    });
});

start();
draw();



//let card = new Card("A", "spades");
//card.drawCard(10, 10);
