import React from 'react';
import { JsonItem } from '../types';
import { HEX_REGEX } from '../utils/helpers';

interface PrimitiveResultsProps {
    sortedResults: JsonItem[];
    resultsSort: { column: 'path' | 'value'; direction: 'asc' | 'desc' } | null;
    handleSort: (column: 'path' | 'value') => void;
    selectSuggestion: (item: JsonItem) => void;
    copyLastPropertyOnly: boolean;
    setCopyLastPropertyOnly: (value: boolean) => void;
}

export const PrimitiveResults: React.FC<PrimitiveResultsProps> = ({
    sortedResults,
    resultsSort,
    handleSort,
    selectSuggestion,
    copyLastPropertyOnly,
    setCopyLastPropertyOnly
}) => {
    const primitiveItems = sortedResults.filter((item) => typeof item.value !== "object");

    return (
        <div className="bg-gray-50/30 dark:bg-gray-800/50 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Primitives</h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    <input
                        type="checkbox"
                        checked={copyLastPropertyOnly}
                        onChange={(e) => setCopyLastPropertyOnly(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                    />
                    <span>Copy last property only</span>
                </label>
            </div>
            <div className="border dark:border-gray-600 rounded overflow-hidden">
                <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-1/2"
                                    onClick={() => handleSort('value')}
                                >
                                    <div className="flex items-center gap-1">
                                        Value
                                        {resultsSort?.column === 'value' && (
                                            <span>{resultsSort.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-1/2 text-right"
                                    onClick={() => handleSort('path')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Path
                                        {resultsSort?.column === 'path' && (
                                            <span>{resultsSort.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {primitiveItems.map((item) => (
                                <tr
                                    key={item.path}
                                    className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                    onClick={() => selectSuggestion(item)}
                                >
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {typeof item.value === "string" && HEX_REGEX.test(item.value) && (
                                                <div
                                                    className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
                                                    style={{ backgroundColor: item.value }}
                                                ></div>
                                            )}
                                            <span className="text-gray-600 dark:text-gray-300 truncate block max-w-[200px]" title={String(item.value)}>
                                                {String(item.value)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]" title={item.path}>
                                        {copyLastPropertyOnly && item.path.includes('.') ? (
                                            <>
                                                <span className="opacity-30 transition-opacity duration-150">
                                                    {item.path.substring(0, item.path.lastIndexOf('.') + 1)}
                                                </span>
                                                <span className="transition-opacity duration-150">
                                                    {item.path.substring(item.path.lastIndexOf('.') + 1)}
                                                </span>
                                            </>
                                        ) : (
                                            item.path
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {primitiveItems.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-gray-400 italic text-xs">
                                        No primitive results
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
