import { useEffect, useState } from "react";
import './App.css'
import { nanoid } from "nanoid";
import SingleCard from "./components/SingleCard";
import Celebration from "./components/Celebration";
import toggleTheme from "./components/toggleTheme";
import ShowConfetti from "./components/Confetti";
import GameOver from "./components/GameOver";

let cardImages = [];
const max_images = 10;
const numbers = Array.from({ length: max_images }, (_, index) => {
    const number = index + 1;
    return (number < 10) ? `0${number}` : `${number}`;
});

function secureShuffleArray(array) {
    const crypto = window.crypto || window.msCrypto;
    for (let i = array.length - 1; i > 0; i--) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const j = randomArray[0] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}
cardImages = [
    { "src": "/img/Image01.png", matched: false },
    { "src": "/img/Image02.png", matched: false },
    { "src": "/img/Image03.png", matched: false },
    { "src": "/img/Image04.png", matched: false },
    { "src": "/img/Image05.png", matched: false },
    { "src": "/img/Image06.png", matched: false },
    { "src": "/img/Image07.png", matched: false },
    { "src": "/img/Image08.png", matched: false },
    { "src": "/img/Image09.png", matched: false },
    { "src": "/img/Image10.png", matched: false }
];


function pickRandomImages(cardImages, count) {
    if (count > cardImages.length) {
        console.error("Die Anzahl der ausgewählten Bilder darf nicht größer sein als die Anzahl der verfügbaren Bilder.");
        return [];
    }
    const crypto = window.crypto || window.msCrypto;
    const shuffledImages = [...cardImages].sort(() => {
        const randomArrayA = new Uint32Array(1);
        const randomArrayB = new Uint32Array(1);
        crypto.getRandomValues(randomArrayA);
        crypto.getRandomValues(randomArrayB);
        return randomArrayA[0] - randomArrayB[0];
    });
    const selectedImages = shuffledImages.slice(0, count);

    return selectedImages;
}

function App() {
    const [cards, setCards] = useState([])
    const [turns, setTurns] = useState(0)
    const [choiceOne, setChoiceOne] = useState(null)
    const [choiceTwo, setChoiceTwo] = useState(null)
    const [disabled, setDisabled] = useState(false)
    const [highScore, setHighScore] = useState(0)
    const [matched, setMatched] = useState(0)
    const [celebrationStatus, setCelebrationStatus] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(undefined)
    const [intervalId, setIntervalId] = useState(undefined)
    const [animateCollapse, setAnimateCollapse] = useState(false);
    const [gameOverMessage, setGameOverMessage] = useState(false);

    const shuffledCards = () => {
        const selectedImages = pickRandomImages(cardImages, 6);

        const shuffledCards = [...selectedImages, ...selectedImages]
            .sort(() => {
                const randomA = nanoid(16); // Erhöhe die Zeichenfolgenlänge auf 16
                const randomB = nanoid(16); // Erhöhe die Zeichenfolgenlänge auf 16
                return randomA.localeCompare(randomB);
            })
            .map((card) => {
                const crypto = window.crypto || window.msCrypto;
                const randomArray = new Uint32Array(1);
                crypto.getRandomValues(randomArray);
                return { ...card, id: randomArray[0] };
            });

        secureShuffleArray(numbers);

        setChoiceOne(null);
        setChoiceTwo(null);
        setCards(shuffledCards);
        setTurns(0);
        setMatched(0);
        setCelebrationStatus(false);
        setElapsedTime(undefined);
        clearInterval(intervalId);
        setAnimateCollapse(true);

        setTimeout(() => {
            setAnimateCollapse(false);
        }, 1200);
    };

    const handleNewGame = () => {
        const audioElement = new Audio("audio/start.mp3");
        audioElement.play();
        setGameOverMessage(false); // Reset the game over message
        setIntervalId(undefined);
        shuffledCards();
    };


    const handleChoice = (card) => {
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card)
        if (elapsedTime === undefined) handleTime(true)
    }
    const handleTime = (start) => {
        if (start) {
            if (intervalId === undefined) {
                const newIntervalId = setInterval(() => {
                    setElapsedTime((elapsedTime) => (elapsedTime || 0) + 1);
                }, 1000);
                setIntervalId(newIntervalId);
            }
        } else if (!start && intervalId !== undefined) {
            clearInterval(intervalId);
            setIntervalId(undefined);
        }
    };

    useEffect(() => {

        if (choiceOne && choiceTwo) {
            setDisabled(true)
            if (choiceOne.src === choiceTwo.src) {
                soundEffect.src = "audio/match.wav"
                soundEffect.play()
                setCards(prevCards => {
                    return prevCards.map(card => {
                        if (card.src === choiceOne.src) {
                            return {
                                ...card, matched: true
                            }
                        } else {
                            return card
                        }
                    })
                })
                resetTurn()
                setMatched(prevMatched => prevMatched + 2)
            } else {
                soundEffect.src = "audio/fail.wav"
                soundEffect.play()
                setTimeout(() => resetTurn(), 1000)
            }
        } else if (choiceOne) {
            soundEffect.src = "audio/swap.wav"
            soundEffect.play()
        }
    }, [choiceOne, choiceTwo])

    const resetTurn = () => {
        setChoiceOne(null)
        setChoiceTwo(null)
        setTurns(prevTurns => prevTurns + 1)
        setDisabled(false)
    }
    const soundEffect = new Audio();
    soundEffect.autoplay = true;


    useEffect(() => {
        if (matched === cards.length && turns) {
            // Game over
            const m_highscore = window.localStorage.getItem("highscore");
            const runtime = window.localStorage.getItem("runtime");
            handleTime(false);
            
            if (
                m_highscore === null ||
                turns < Number(m_highscore) ||
                (turns === Number(m_highscore) && elapsedTime < runtime)
            ) {
                // New highscore
                window.localStorage.setItem("highscore", turns);
                window.localStorage.setItem("runtime", elapsedTime);
                soundEffect.src = "audio/celebration.mp3";
                soundEffect.play();
                setCelebrationStatus(true);
                setHighScore(turns);
                setGameOverMessage(false); // Reset game over message
            } else {
                // No new high score
                setGameOverMessage(true); // Set game over message to true
            }
        }
    }, [matched]);

    useEffect(() => {
        shuffledCards()
        // Load highscore value from localstorage
        const m_highscore = window.localStorage.getItem("highscore") || 0
        setHighScore(m_highscore)
    }, [])

    return (
        <div className="App">
            {celebrationStatus && (
                <Celebration highScore={highScore} elapsedTime={elapsedTime} />
            )}
            {celebrationStatus && <ShowConfetti />}
            <img
              src="/img/paul-merget-logo.png"
                alt="card back"
                width="300"
                height="150"
            />
            <br></br>
            <button onClick={handleNewGame}>New Game</button>
            <button id="theme-toggle" onClick={toggleTheme}>
                dark
            </button>
            <div className={`card-grid ${animateCollapse ? 'collapse-animation' : ''}`}>
                {cards.map((card) => (
                    <SingleCard
                        key={card.id}
                        card={card}
                        handleChoice={handleChoice}
                        flipped={card === choiceOne || card === choiceTwo || card.matched}
                        disabled={disabled}
                    />
                ))}
            </div>
            <p>Turns: {turns}</p>
            <div className="results-container">
                <p>HighScore: {highScore}</p>
                <p>Runtime: {window.localStorage.getItem("runtime") || 0}</p>
            </div>
            <p>Time Elapsed: {elapsedTime || "Not started"}</p>
            {gameOverMessage && <GameOver score={turns} elapsedTime={elapsedTime} />}

        </div>
    );
}
export default App
