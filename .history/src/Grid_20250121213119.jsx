import React, { useState } from 'react';

const Grid = ({ size, onBack }) => {
    const [gridData, setGridData] = useState(
        Array.from({ length: size * size }, () => "")
    );
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionDirection, setSelectionDirection] = useState(null);
    const [selectedWord, setSelectedWord] = useState("");
    const [error, setError] = useState(null);
    const [playerScores, setPlayerScores] = useState({ player1: 0, player2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [player1HasPlayed, setPlayer1HasPlayed] = useState(false);
    const [player2HasPlayed, setPlayer2HasPlayed] = useState(false);

    const handleInputChange = (index, value) => {
        const updatedGrid = [...gridData];
        updatedGrid[index] = value.toUpperCase().charAt(0);
        setGridData(updatedGrid);

        // Mark that a player has inserted a character
        if (currentPlayer === 1) {
            setPlayer1HasPlayed(true);
        } else {
            setPlayer2HasPlayed(true);
        }
    };

    const handleMouseDown = (index) => {
        setSelectedIndices([index]);
        setIsSelecting(true);
        setSelectionDirection(null);
        setError(null);
    };

    const handleMouseEnter = (index) => {
        if (isSelecting) {
            const startIndex = selectedIndices[0];
            const rowStart = Math.floor(startIndex / size);
            const colStart = startIndex % size;
            const rowCurrent = Math.floor(index / size);
            const colCurrent = index % size;

            if (!selectionDirection) {
                if (rowStart === rowCurrent) {
                    setSelectionDirection('horizontal');
                } else if (colStart === colCurrent) {
                    setSelectionDirection('vertical');
                }
            }

            if (selectionDirection === 'horizontal' && rowStart === rowCurrent) {
                const minCol = Math.min(colStart, colCurrent);
                const maxCol = Math.max(colStart, colCurrent);
                const newSelected = Array.from(
                    { length: maxCol - minCol + 1 },
                    (_, i) => rowStart * size + minCol + i
                );
                setSelectedIndices(newSelected);
            } else if (selectionDirection === 'vertical' && colStart === colCurrent) {
                const minRow = Math.min(rowStart, rowCurrent);
                const maxRow = Math.max(rowStart, rowCurrent);
                const newSelected = Array.from(
                    { length: maxRow - minRow + 1 },
                    (_, i) => (minRow + i) * size + colStart
                );
                setSelectedIndices(newSelected);
            }
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        setSelectionDirection(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            const selectedChars = selectedIndices.map((index) => gridData[index]);
            if (selectedChars.includes("")) {
                setError("Invalid word: One or more selected cells are empty");
                setSelectedWord("");
            } else {
                const word = selectedChars.join('');
                setSelectedWord(word);
                setError(null);

                const wordLength = word.length;

                // Add score only if word is selected and no error
                if (!error && wordLength > 0) {
                    setPlayerScores((prevScores) => ({
                        ...prevScores,
                        [`player${currentPlayer}`]: prevScores[`player${currentPlayer}`] + wordLength,
                    }));
                }

                // Reset selected cells
                setSelectedIndices([]);
                setSelectedWord("");
            }
        }
    };

    // Switch player turn manually
    const handleSwitchTurn = () => {
        if ((currentPlayer === 1 && player1HasPlayed) || (currentPlayer === 2 && player2HasPlayed)) {
            setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
            setPlayer1HasPlayed(false);  // Reset the player 1 status
            setPlayer2HasPlayed(false);  // Reset the player 2 status
        } else {
            setError("Player must insert a character before switching turn");
        }
    };

    return (
        <div
            className="flex flex-col items-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            tabIndex={0}
            onKeyDown={handleKeyPress}
        >
            <div className="flex justify-between w-full px-8 my-4 max-w-5xl">
                {/* Player 1 Scorecard */}
                <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
                    <h2 className="text-xl font-semibold text-indigo-600">LAV</h2>
                    <p className="text-lg font-medium">Score: {playerScores.player1}</p>
                </div>

                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-red-500 text-white font-medium rounded-full shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all ease-in-out duration-300 transform hover:scale-105"
                >
                    Back to Home
                </button>

                {/* Player 2 Scorecard */}
                <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-xl">
                    <h2 className="text-xl font-semibold text-green-600">MOHIT</h2>
                    <p className="text-lg font-medium">Score: {playerScores.player2}</p>
                </div>
            </div>

            {/* Current Player Indicator */}
            <div className="mb-4 p-4 bg-yellow-200 text-yellow-800 font-medium rounded-xl shadow-md w-3/4 text-center">
                <h3 className="text-lg">Current Turn: Player {currentPlayer}</h3>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 font-medium rounded-xl shadow-md w-3/4 text-center">
                    {error}
                </div>
            )}

            {/* Selected Word Display */}
            {selectedWord && !error && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 font-medium rounded-xl shadow-md w-3/4 text-center">
                    Selected Word: {selectedWord}
                </div>
            )}

            {/* Grid */}
            <div
                className={`grid gap-3`}
                style={{
                    gridTemplateColumns: `repeat(${size}, 1fr)`,
                    width: `${size * 50}px`,
                }}
            >
                {gridData.map((cell, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={cell}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onMouseDown={() => handleMouseDown(index)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseUp={handleMouseUp}
                        className={`flex items-center justify-center border border-gray-300 bg-white h-12 text-gray-800 font-bold text-center uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedIndices.includes(index)
                            ? 'bg-indigo-200'
                            : ''
                            } transition-all ease-in-out duration-300 transform hover:scale-105 hover:bg-indigo-50`}
                    />
                ))}
            </div>

            {/* Button to switch turn */}
            <button
                onClick={handleSwitchTurn}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ease-in-out duration-300 transform hover:scale-105"
            >
                Switch Turn
            </button>
        </div>
    );
};

export default Grid;
