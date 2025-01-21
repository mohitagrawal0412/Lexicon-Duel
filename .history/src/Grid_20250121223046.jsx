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
            if (selectedIndices.length === 0) {
                // No grid selected, directly change the turn
                if ((currentPlayer === 1 && player1HasPlayed) || (currentPlayer === 2 && player2HasPlayed)) {
                    setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
                    setPlayer1HasPlayed(false); // Reset player status
                    setPlayer2HasPlayed(false); // Reset player status
                    setError(null);
                } else {
                    setError("Player must insert a character before switching turn");
                }
            } else {
                // Grid is selected, process the word and then change the turn
                const selectedChars = selectedIndices.map((index) => gridData[index]);
                if (selectedChars.includes("")) {
                    setError("Invalid word: One or more selected cells are empty");
                    setSelectedWord("");
                } else {
                    const word = selectedChars.join('');
                    setSelectedWord(word);
                    setError(null);

                    const wordLength = word.length;

                    // Add score only if word is valid
                    if (wordLength > 0) {
                        setPlayerScores((prevScores) => ({
                            ...prevScores,
                            [`player${currentPlayer}`]: prevScores[`player${currentPlayer}`] + wordLength,
                        }));
                    }

                    // Reset selected cells
                    setSelectedIndices([]);
                    setSelectedWord("");

                    // Change the turn
                    setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
                    setPlayer1HasPlayed(false); // Reset player status
                    setPlayer2HasPlayed(false); // Reset player status
                }
            }
        }
    };

    return (
        <div
            className="flex flex-col items-center min-h-screen bg-gray-100"
            tabIndex={0}
            onKeyDown={handleKeyPress}
        >
            {/* ...rest of the component */}
        </div>
    );
};

export default Grid;
