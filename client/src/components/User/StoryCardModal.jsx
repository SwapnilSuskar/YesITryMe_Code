import { Download, Loader2, RefreshCw, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../../config/api';

// Turns a failed image request into a message for the user.
const errorMessage = async (err) => {
    const status = err?.response?.status;
    if (!err?.response) return 'No internet connection. Check your network and try again.';
    if (status === 429) return 'Too many images created. Please try again in a few minutes.';
    try {
        // Error bodies come back as a Blob because the request asked for an image
        const text = await err.response.data?.text?.();
        const message = text && JSON.parse(text)?.message;
        if (message) return message;
    } catch {
        // not JSON
    }
    return 'Could not create the image. Please try again.';
};

/**
 * Shows the shareable story image for one transaction or payout, with
 * Share (phone share sheet: WhatsApp Status, Instagram Story, ...) and Download.
 *
 * request: { url, fileName, caption } or null (closed)
 */
const StoryCardModal = ({ request, onClose }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [sharing, setSharing] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!request) return undefined;
        let objectUrl = '';
        let cancelled = false;
        setLoading(true);
        setError('');
        setNotice('');
        setImageUrl('');
        setFile(null);

        api.get(request.url, { responseType: 'blob', timeout: 30000 })
            .then((response) => {
                if (cancelled) return;
                const blob = response.data;
                if (!blob || !String(blob.type).startsWith('image/')) {
                    setError('Could not create the image. Please try again.');
                    return;
                }
                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
                setFile(new File([blob], request.fileName, { type: 'image/jpeg' }));
            })
            .catch(async (err) => {
                const message = await errorMessage(err);
                if (!cancelled) setError(message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [request, attempt]);

    // Close on Escape, and stop the page behind from scrolling while open
    useEffect(() => {
        if (!request) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [request, onClose]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    if (!request) return null;

    let canShareFile = false;
    try {
        canShareFile = !!file && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
    } catch {
        canShareFile = false;
    }

    const handleShare = async () => {
        if (!canShareFile || sharing) return;
        setSharing(true);
        setNotice('');
        try {
            await navigator.share({ files: [file], text: request.caption });
        } catch (err) {
            if (err?.name !== 'AbortError') {
                setNotice('Sharing did not work here. Tap Download, then post the image from your gallery.');
            }
        } finally {
            setSharing(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = request.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setNotice('Saved. Open WhatsApp or Instagram and add it to your Status / Story.');
    };

    const helpText = notice
        || (file && !canShareFile
            ? 'On a computer? Download the image, send it to your phone, then post it to your Status.'
            : 'Tap Share and choose WhatsApp → My Status, or Instagram → Your Story.');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Share your success"
        >
            <div
                className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl max-h-[95vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Share your success</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mx-auto w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="animate-spin" size={28} />
                            Creating your image…
                        </div>
                    )}
                    {!loading && error && (
                        <div className="flex flex-col items-center gap-3 px-4 text-center">
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                type="button"
                                onClick={retry}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <RefreshCw size={14} /> Try again
                            </button>
                        </div>
                    )}
                    {!loading && !error && imageUrl && (
                        <img src={imageUrl} alt="Your earning story card" className="w-full h-full object-cover" />
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={handleShare}
                        disabled={!canShareFile || sharing}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        title={canShareFile ? 'Share to WhatsApp, Instagram and more' : 'Sharing images works on phones. Use Download here.'}
                    >
                        {sharing ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />} Share
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!imageUrl}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#FF4E00] py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Download size={18} /> Download
                    </button>
                </div>

                <p className="mt-3 text-center text-xs text-gray-500">{helpText}</p>
            </div>
        </div>
    );
};

export default StoryCardModal;
