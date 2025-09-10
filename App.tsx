/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { generateImage } from './services/geminiService';
import HeadshotCard from './components/PolaroidCard'; // Renamed import, but file is the same
import Footer from './components/Footer';

const HEADSHOT_PROMPTS = [
    'A professional studio headshot of the person in the photo. The background is a blurred, modern office setting. They are wearing a black formal blazer and have a natural, professional posture suitable for a LinkedIn profile. 1:1 aspect ratio, square format. The image should be 8K resolution, with DSLR quality lighting and detail.',
    'A professional headshot of the person in the photo, wearing a dark navy blue suit jacket. The background is an out-of-focus architectural setting. They have a confident, approachable expression. 1:1 aspect ratio, square format. Render in high-resolution, DSLR quality.',
    'A headshot of the person in the photo wearing a charcoal grey blazer, set against a soft, neutral grey studio backdrop. The person is looking directly at the camera with a slight, confident smile. 1:1 aspect ratio, square format. 8K quality.',
    'A professional headshot of the person wearing a crisp white button-down shirt (no jacket). The background is a warm, soft-lit interior with blurred indoor plants. The pose is relaxed yet professional. 1:1 aspect ratio, square format. DSLR quality.',
    'A minimalist, professional headshot of the person in the photo wearing a black turtleneck sweater against a clean, dark background. Their expression is thoughtful and engaging. 1:1 aspect ratio, square format. High-resolution.',
    'A bright, airy headshot of the person in the photo. They are wearing a professional blouse, and the background is a modern office with large, light-filled windows blurred behind them. The expression is a genuine smile. 1:1 aspect ratio, square format.',
    'A high-resolution, DSLR-quality headshot of the person in the photo. Attire: black formal blazer. Background: softly blurred office. Pose: natural and professional for a corporate profile. 1:1 aspect ratio, square format.',
    'A professional headshot. The person is wearing a dark grey suit jacket and is set against a clean, minimalist wall. Their posture is upright and confident. 1:1 aspect ratio, square format. Render with sharp, clear detail.',
    'A friendly headshot of the person in the photo. They are wearing a navy blue blazer over a light blue shirt. The background is a blurred co-working space, giving a modern, collaborative feel. The expression is open and welcoming. 1:1 aspect ratio, square format.',
    'A poised and self-assured headshot of the person wearing a formal business dress. The background is a subtle, abstract design with cool tones. 1:1 aspect ratio, square format. High-resolution, studio quality.',
    'A headshot depicting the person in a black blazer, standing in front of a blurred bookshelf. The image should convey intelligence and capability. 1:1 aspect ratio, square format. DSLR quality.',
    'A professional headshot of the person in the photo, illuminated with soft, flattering butterfly lighting. Attire: black formal blazer. Background: simple, out-of-focus office. 1:1 aspect ratio, square format. 8K resolution.',
    'A corporate headshot where the person is angled slightly away from the camera, looking back towards it with a confident expression. Attire: dark grey suit. Background: blurred office environment. 1:1 aspect ratio, square format.',
    'An engaging headshot where the person is leaning slightly forward. They are wearing a charcoal grey blazer against a bright, clean background. The image feels dynamic and approachable. 1:1 aspect ratio, square format.',
    'A classic, traditional head-and-shoulders corporate headshot. The person is wearing a classic black suit against a neutral studio background. The lighting is balanced and professional. 1:1 aspect ratio, square format.',
    'A professional headshot with a blurred background suggesting a modern building\'s exterior (e.g., glass and steel). The person is wearing a black blazer, and the lighting looks natural and bright. 1:1 aspect ratio, square format.',
    'A professional headshot with warm, golden hour style lighting, giving it a slightly more creative and warm feel. Attire is a navy blue blazer. The background is indistinct and softly blurred. 1:1 aspect ratio, square format.',
    'A headshot of the person wearing a professional blouse. The background is a simple, light-colored wall with a single piece of abstract art completely blurred out, adding a touch of sophistication. 1:1 aspect ratio, square format.',
    'A professional headshot that feels more candid and approachable. The person is captured with a slight, genuine laugh. Attire: black blazer. Background: blurred modern office. 1:1 aspect ratio, square format.',
    'A very clean, high-key studio headshot of the person in the photo. They are wearing a black blazer, and the background is pure white or very light grey, softly and evenly lit. 1:1 aspect ratio, square format. 8K, DSLR quality.',
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-medium text-lg text-center text-black bg-yellow-400 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-yellow-300 shadow-md";
const secondaryButtonClasses = "font-medium text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-white hover:text-black";

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<number, GeneratedImage>>({});
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [progress, setProgress] = useState<number>(0);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        setIsGenerating(true);
        setAppState('generating');
        setProgress(0);
        
        const initialImages: Record<number, GeneratedImage> = {};
        HEADSHOT_PROMPTS.forEach((_, index) => {
            initialImages[index] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 4;
        const promptsQueue = [...HEADSHOT_PROMPTS.map((prompt, index) => ({ prompt, index }))];
        let completedCount = 0;
        const totalPrompts = HEADSHOT_PROMPTS.length;

        const processPrompt = async (prompt: string, index: number) => {
            try {
                const resultUrl = await generateImage(uploadedImage, prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [index]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [index]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for prompt ${index}:`, err);
            } finally {
                completedCount++;
                const newProgress = Math.round((completedCount / totalPrompts) * 100);
                setProgress(newProgress);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (promptsQueue.length > 0) {
                const item = promptsQueue.shift();
                if (item) {
                    await processPrompt(item.prompt, item.index);
                }
            }
        });

        await Promise.all(workers);

        setIsGenerating(false);
        setAppState('results-shown');
    };

    const handleRegenerateImage = async (index: number) => {
        if (!uploadedImage || isGenerating) return;

        if (generatedImages[index]?.status === 'pending') return;
        
        console.log(`Regenerating image for prompt ${index}...`);
        setGeneratedImages(prev => ({
            ...prev,
            [index]: { status: 'pending' },
        }));

        try {
            const prompt = HEADSHOT_PROMPTS[index];
            const resultUrl = await generateImage(uploadedImage, prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [index]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [index]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for prompt ${index}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
        setProgress(0);
    };

    const handleDownloadIndividualImage = (index: number) => {
        const image = generatedImages[index];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `ai-headshot-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleDownloadAll = async () => {
        Object.entries(generatedImages).forEach(([index, image]) => {
            if (image.status === 'done' && image.url) {
                // Use a small delay to prevent browser from blocking multiple downloads
                setTimeout(() => {
                    handleDownloadIndividualImage(parseInt(index, 10));
                }, parseInt(index, 10) * 100);
            }
        });
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center p-4 pb-24 overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            <div className="z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto flex-1">
                <div className="text-center my-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-neutral-100">AI Headshot Pro</h1>
                    <p className="text-neutral-300 mt-3 text-lg">Generate professional headshots in seconds.</p>
                </div>

                {appState === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center p-8 border border-dashed border-neutral-600 rounded-xl bg-neutral-900/50"
                    >
                        <label htmlFor="file-upload" className="cursor-pointer group flex flex-col items-center gap-4 text-neutral-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="text-xl font-medium">Upload Photo</span>
                            <p className="text-sm text-neutral-500">Click here or drag and drop an image</p>
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                    </motion.div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <img src={uploadedImage} alt="Uploaded" className="max-w-xs w-full h-auto rounded-lg shadow-2xl" />
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate Headshots
                            </button>
                         </div>
                    </motion.div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
                           {HEADSHOT_PROMPTS.map((_, index) => (
                                <HeadshotCard
                                    key={index}
                                    imageIndex={index}
                                    status={generatedImages[index]?.status || 'pending'}
                                    imageUrl={generatedImages[index]?.url}
                                    error={generatedImages[index]?.error}
                                    onRegenerate={handleRegenerateImage}
                                    onDownload={handleDownloadIndividualImage}
                                />
                           ))}
                        </div>
                         <div className="h-20 mt-8 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button 
                                        onClick={handleDownloadAll} 
                                        className={primaryButtonClasses}
                                    >
                                        Download All
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                            {appState === 'generating' && (
                                <div className="flex flex-col items-center gap-4 text-lg text-neutral-300 w-full max-w-lg">
                                    <div className="flex items-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Generating your headshots... This may take a moment.</span>
                                    </div>
                                    <div className="w-full bg-neutral-800 rounded-full h-2.5">
                                        <motion.div
                                            className="bg-yellow-400 h-2.5 rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{progress}% Complete</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;
