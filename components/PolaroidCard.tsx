/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type ImageStatus = 'pending' | 'done' | 'error';

interface HeadshotCardProps {
    imageUrl?: string;
    imageIndex: number;
    status: ImageStatus;
    error?: string;
    onRegenerate?: (index: number) => void;
    onDownload?: (index: number) => void;
}

const ShimmerPlaceholder = () => (
    <div className="w-full h-full shimmer-placeholder" />
);

const ErrorDisplay = ({ onRegenerate, imageIndex }: { onRegenerate?: (index: number) => void, imageIndex: number }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-neutral-400 mb-3">Generation failed.</p>
        {onRegenerate && (
             <button
                onClick={() => onRegenerate(imageIndex)}
                className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded-md transition-colors"
                aria-label={`Regenerate image ${imageIndex + 1}`}
            >
                Try Again
            </button>
        )}
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    </div>
);


const HeadshotCard: React.FC<HeadshotCardProps> = ({ imageUrl, imageIndex, status, error, onRegenerate, onDownload }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        if (status !== 'done' || !imageUrl) {
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    return (
        <motion.div
            className="aspect-square w-full rounded-lg bg-neutral-800/50 shadow-md overflow-hidden relative group"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, delay: imageIndex * 0.05 }}
            layout
        >
            <div className="w-full h-full bg-neutral-900 shadow-inner flex-grow relative overflow-hidden">
                {status === 'pending' && <ShimmerPlaceholder />}
                {status === 'error' && <ErrorDisplay onRegenerate={onRegenerate} imageIndex={imageIndex}/>}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={cn(
                            "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                        )}>
                            {onDownload && (
                                <button
                                    onClick={() => onDownload(imageIndex)}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Download image ${imageIndex + 1}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                            {onRegenerate && (
                                <button
                                    onClick={() => onRegenerate(imageIndex)}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Regenerate image ${imageIndex + 1}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110 2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={`Generated headshot ${imageIndex + 1}`}
                            onLoad={() => setIsImageLoaded(true)}
                            className={cn(
                                'w-full h-full object-cover transition-opacity duration-500',
                                isImageLoaded ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                         {!isImageLoaded && <ShimmerPlaceholder />}
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder />}
            </div>
        </motion.div>
    );
};

export default HeadshotCard;
