import React from 'react';

interface HeaderProps {
    fileLoaded: boolean;
    fileName: string;
    error: string;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    fileLoaded,
    fileName,
    error,
    onFileUpload,
    onClearData,
}) => {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">
                        🥒 pickles
                        <span className="text-sm text-gray-500 dark:text-gray-600 ml-2 italic">by skube</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Potentially the perfect picker for parsing perplexing properties.
                    </p>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex gap-2 mb-2">
                    {!fileLoaded && (
                        <input
                            id="file-upload"
                            type="file"
                            accept=".json"
                            onChange={onFileUpload}
                            className="w-full p-2 border rounded border-gray-300"
                        />
                    )}
                </div>
                {fileName && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                        <span>{fileName}</span>
                        {fileLoaded && (
                            <button
                                onClick={onClearData}
                                className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Remove file"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
                {error && <div className="mt-2 text-red-500">{error}</div>}
            </div>
        </div>
    );
};
