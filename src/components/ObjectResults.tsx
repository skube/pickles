import React from 'react';
import { JsonItem } from '../types';

interface ObjectResultsProps {
    sortedResults: JsonItem[];
    objectSort: 'insertion' | 'key-asc' | 'key-desc' | 'key-smart' | 'value-asc' | 'value-desc';
    setObjectSort: (sort: 'insertion' | 'key-asc' | 'key-desc' | 'key-smart' | 'value-asc' | 'value-desc') => void;
    getSortedObject: (obj: any) => any;
}

export const ObjectResults: React.FC<ObjectResultsProps> = ({
    sortedResults,
    objectSort,
    setObjectSort,
    getSortedObject
}) => {
    const objectItems = sortedResults.filter((item) => typeof item.value === "object");

    return (
        <div className="bg-gray-50/30 dark:bg-gray-800/50 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Objects</h3>
                {sortedResults.some(item => typeof item.value === "object") && (
                    <select
                        value={objectSort}
                        onChange={(e) => setObjectSort(e.target.value as any)}
                        className="p-1 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-xs"
                    >
                        <option value="insertion">Sort: As-Is</option>
                        <option value="key-asc">Sort: Key (A-Z)</option>
                        <option value="key-desc">Sort: Key (Z-A)</option>
                        <option value="key-smart">Sort: Key (Smart)</option>
                        <option value="value-asc">Sort: Value (0-9)</option>
                        <option value="value-desc">Sort: Value (9-0)</option>
                    </select>
                )}
            </div>
            <div className="space-y-2">
                {objectItems.map((item) => (
                    <div key={item.path} className="border-b py-2">
                        <div>
                            <strong>{item.path}</strong>
                            <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 dark:text-gray-300 p-2 rounded mt-1 text-sm overflow-x-auto">
                                {JSON.stringify(getSortedObject(item.value), null, 2)}
                            </pre>
                        </div>
                    </div>
                ))}
                {objectItems.length === 0 && (
                    <div className="text-gray-400 italic text-xs">No object results</div>
                )}
            </div>
        </div>
    );
};
