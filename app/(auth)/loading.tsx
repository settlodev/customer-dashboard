import React from 'react';

const Loading = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className={`relative w-10 h-10`}>
                <div className="absolute w-full h-full border-4 border-green-200 rounded-full" />
                <div className="absolute w-full h-full border-4 border-green-500 rounded-full animate-spin border-t-transparent" />
            </div>
        </div>
    );
};

export default Loading;
