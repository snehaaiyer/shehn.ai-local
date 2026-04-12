import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Shirt, UtensilsCrossed } from 'lucide-react';
import { RSVPService } from '../services/rsvp_service';

const PublicRSVP: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!inviteCode) {
        setError('This invite link is invalid or has expired.');
        setLoading(false);
        return;
      }
      try {
        const res = await RSVPService.getPublicEventDetails(inviteCode);
        if (res.success && res.data) {
          setEventDetails(res.data);
        } else {
          setError('This invite link is invalid or has expired.');
        }
      } catch {
        setError('This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || !guestName.trim()) return;
    try {
      const res = await RSVPService.submitRSVP(inviteCode, {
        guest_name: guestName,
        guest_email: guestEmail,
        attending,
        plus_ones: plusOnes,
        dietary_notes: dietaryNotes,
        message,
      });
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-rose-600">Shehnai</h1>
          <p className="text-gray-500 mt-1">You're invited to celebrate with us!</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-rose-500">{error}</div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-sage-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
            <p className="text-gray-600">We look forward to celebrating with you!</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Event Details Card */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{eventDetails.title}</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{eventDetails.event_date ? new Date(eventDetails.event_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{eventDetails.event_time}{eventDetails.end_time ? ` - ${eventDetails.end_time}` : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{eventDetails.venue_name}{eventDetails.venue_address ? `, ${eventDetails.venue_address}` : ''}</span>
                </div>
                {eventDetails.dress_code && (
                  <div className="flex items-center gap-3">
                    <Shirt className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{eventDetails.dress_code}</span>
                  </div>
                )}
                {eventDetails.meal_included && (
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-full">Meal included</span>
                  </div>
                )}
              </div>
            </div>

            {/* RSVP Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Will you attend?</label>
                <div className="flex gap-3">
                  {(['yes', 'no', 'maybe'] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 text-center py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                        attending === opt
                          ? opt === 'yes' ? 'bg-sage-100 border-sage-400 text-sage-700'
                            : opt === 'no' ? 'bg-rose-100 border-rose-400 text-rose-700'
                            : 'bg-gray-100 border-gray-400 text-gray-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="attending"
                        value={opt}
                        checked={attending === opt}
                        onChange={() => setAttending(opt)}
                        className="sr-only"
                      />
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plus ones</label>
                <input
                  type="number"
                  min={0}
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dietary notes</label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                  placeholder="e.g. Vegetarian, no nuts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message for the couple</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors"
              >
                Confirm RSVP
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PublicRSVP;
