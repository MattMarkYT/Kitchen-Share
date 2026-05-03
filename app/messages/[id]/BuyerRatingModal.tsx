'use client';

import { useEffect } from 'react';

type BuyerRatingModalProps = {
    isOpen: boolean;
    selectedRating: number;
    submittingRating: boolean;
    ratingError?: string;
    onSelectRating: (rating: number) => void;
    onSubmit: () => void | Promise<void>;
    onClose: () => void;
    sellerName?: string;
};

export default function BuyerRatingModal({
    isOpen,
    selectedRating,
    submittingRating,
    ratingError,
    onSelectRating,
    onSubmit,
    onClose,
    sellerName,
}: BuyerRatingModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !submittingRating) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, onClose, submittingRating]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-rating-modal-title"
            onMouseDown={() => {
                if (!submittingRating) onClose();
            }}
        >
            <div
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                            Sale confirmed
                        </p>
                        <h2 id="buyer-rating-modal-title" className="mt-1 text-xl font-bold text-gray-900">
                            Rate this seller
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            {sellerName
                                ? `How was your experience buying from ${sellerName}?`
                                : 'How was your experience with this seller?'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submittingRating}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Close rating modal"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-6 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onSelectRating(star)}
                            disabled={submittingRating}
                            className={`text-5xl transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                                star <= selectedRating ? 'text-orange-400' : 'text-gray-300'
                            }`}
                            aria-label={`${star} star${star === 1 ? '' : 's'}`}
                            aria-pressed={star <= selectedRating}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {ratingError && (
                    <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {ratingError}
                    </p>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submittingRating}
                        className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Not now
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submittingRating || selectedRating === 0}
                        className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {submittingRating ? 'Submitting…' : 'Submit Rating'}
                    </button>
                </div>
            </div>
        </div>
    );
}
