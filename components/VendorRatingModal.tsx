'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VendorRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
  vendorId: string | number;
  vendorName: string;
}

export function VendorRatingModal({ isOpen, onClose, projectId, vendorId, vendorName }: VendorRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      // Assuming generic backend endpoint matching the schema
      /*
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, vendor_id: vendorId, rating, feedback })
      });
      */
      // Mock network latency
      await new Promise(r => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRating(0);
        setFeedback('');
      }, 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-navy mb-2 font-heading">Rating Submitted!</h3>
              <p className="text-slate-500 text-sm">Thank you for providing feedback on {vendorName}.</p>
            </div>
          ) : (
            <>
              <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              
              <div className="mb-6 mt-2 text-center">
                <h3 className="text-2xl font-bold text-navy font-heading mb-2">Rate {vendorName}</h3>
                <p className="text-slate-500 text-sm">Your feedback helps maintain quality across all projects.</p>
              </div>

              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-4xl transition-transform hover:scale-110 cursor-pointer"
                  >
                    <span className={star <= (hoveredRating || rating) ? 'text-amber-400 drop-shadow-md' : 'text-slate-200 grayscale'}>
                      ⭐
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Additional Feedback (Optional)</label>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={`How was your experience working with ${vendorName}?`}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none bg-slate-50 text-sm"
                    rows={4}
                  />
                </div>
                
                <button 
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-navy disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-dark transition-colors shadow-lg shadow-navy/20 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
