import React, { useEffect, useRef } from 'react';
import { JsonItem } from '../types';
import { HEX_REGEX } from '../utils/helpers';

interface SearchProps {
    query: string;
    setQuery: (query: string) => void;
    setActiveSuggestion: (index: number) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    suggestions: JsonItem[];
    activeSuggestion: number;
    selectSuggestion: (item: JsonItem) => void;
}

export const Search: React.FC<SearchProps> = ({
    query,
    setQuery,
    setActiveSuggestion,
    handleKeyDown,
    suggestions,
    activeSuggestion,
    selectSuggestion,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="relative mb-4">
            <input
                ref={inputRef}
                id="search"
                type="text"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Search properties..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveSuggestion(-1);
                }}
                onKeyDown={handleKeyDown}
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded mt-1 max-h-96 overflow-auto">
                    {suggestions.map((item, index) => (
                        <li
                            key={item.path}
                            data-index={index}
                            className={`group p-2 cursor-pointer flex justify-between hover:bg-gray-100 dark:hover:bg-gray-600 ${activeSuggestion === index ? "bg-green-100 dark:bg-green-800" : ""
                                }`}
                            onMouseDown={() => selectSuggestion(item)}
                        >
                            <div className="flex justify-end">
                                {typeof item.value === "string" &&
                                    HEX_REGEX.test(item.value) && (
                                        <span
                                            className="w-4 h-4 rounded-full inline-block mr-1"
                                            style={{ backgroundColor: item.value }}
                                        ></span>
                                    )}
                                {typeof item.value === "string" &&
                                    item.value.length < 20 && (
                                        <span className={`text-xs inline-block mr-2 self-center ${activeSuggestion === index
                                                ? "text-gray-900 dark:text-gray-300"
                                                : "text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300"
                                            }`}>
                                            {item.value}
                                        </span>
                                    )}
                            </div>
                            <span className="text-sm inline-block mr-2 dark:text-gray-200">
                                {item.path}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
