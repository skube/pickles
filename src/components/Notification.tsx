import React from 'react';

interface NotificationProps {
    message: string;
}

export const Notification: React.FC<NotificationProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-50">
            <div className="text-8xl mb-2">🥒</div>
            <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl">
                <div className="font-bold text-xl text-center">Picked!</div>
                <div className=" font-mono opacity-90 mt-1 max-w-[300px] truncate text-center">
                    {message.replace('Picked! ', '')}
                </div>
            </div>
        </div>
    );
};
