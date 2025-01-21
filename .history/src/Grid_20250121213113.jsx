import React, { useState } from 'react';
import Grid from './Grid';

const HomePage = () => {
    const [gridSize, setGridSize] = useState(5); // Default grid size is 5x5
    const [showGrid, setShowGrid] = useState(false); // Toggle between home and grid

    // Render Grid if `showGrid` is true
    if (showGrid) {
        return <Grid size={gridSize} onBack={() => setShowGrid(false)} />;
    }

    // Render Home Page
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {/* Title */}
            <p className="bg-red-500 text-center text-teal-400 text-2xl font-semibold p-4 rounded-lg shadow-md mb-6">
                Welcome to Word Game
            </p>

            {/* Size Selector */}
            <p className="text-lg font-bold mb-4 text-gray-700">Select Grid Size</p>
            <div className="flex flex-wrap justify-center space-x-4 mb-6">
                <button
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => {
                        setGridSize(5);
                        setShowGrid(true);
                    }}
                >
                    5x5
                </button>
                <button
                    className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => {
                        setGridSize(6);
                        setShowGrid(true);
                    }}
                >
                    6x6
                </button>
                <button
                    className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    onClick={() => {
                        setGridSize(7);
                        setShowGrid(true);
                    }}
                >
                    7x7
                </button>
                <button
                    className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    onClick={() => {
                        setGridSize(8);
                        setShowGrid(true);
                    }}
                >
                    8x8
                </button>
                <button
                    className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onClick={() => {
                        setGridSize(9);
                        setShowGrid(true);
                    }}
                >
                    9x9
                </button>
                <button
                    className="px-4 py-2 bg-teal-500 text-white font-medium rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    onClick={() => {
                        setGridSize(10);
                        setShowGrid(true);
                    }}
                >
                    10x10
                </button>
                <button
                    className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    onClick={() => {
                        setGridSize(11);
                        setShowGrid(true);
                    }}
                >
                    11x11
                </button>
                <button
                    className="px-4 py-2 bg-pink-500 text-white font-medium rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    onClick={() => {
                        setGridSize(12);
                        setShowGrid(true);
                    }}
                >
                    12x12
                </button>
            </div>
        </div>
    );
};

export default HomePage;
