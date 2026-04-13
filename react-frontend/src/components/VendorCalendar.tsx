import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Sparkles, Check, Clock, Ban, Users, MapPin, Loader2 } from 'lucide-react';
import { VendorCalendarService, VendorBooking, DateSuggestion } from '../services/vendor_calendar_service';

interface VendorCalendarProps {
  vendorId: number;
  vendorName?: string;
  isVendorView?: boolean; // true = vendor managing own calendar, false = couple checking availability
  coupleCity?: string;
  coupleBudgetTier?: string;
}

const BOOKING_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  booked:   { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  blocked:  { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', dot: 'bg-gray-500' },
  tentative:{ bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const VendorCalendar: React.FC<VendorCalendarProps> = ({ vendorId, vendorName, isVendorView = false, coupleCity, coupleBudgetTier }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 11, 1)); // Dec 2026
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Add booking form state
  const [newBooking, setNewBooking] = useState({
    event_title: '', booking_type: 'blocked' as 'booked' | 'blocked' | 'tentative',
    couple_name: '', location: '', notes: '', end_date: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    loadCalendar();
  }, [vendorId, monthStr]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await VendorCalendarService.getVendorCalendar(vendorId, monthStr);
      if (res.success && res.data) {
        setBookings(res.data.bookings);
      }
    } catch (e) { console.error('Failed to load calendar', e); }
    setLoading(false);
  };

  const handleAddBooking = async () => {
    if (!selectedDate) return;
    const data = {
      vendor_id: vendorId,
      event_date: selectedDate,
      event_title: newBooking.event_title,
      booking_type: newBooking.booking_type,
      couple_name: newBooking.couple_name,
      location: newBooking.location,
      notes: newBooking.notes,
      end_date: newBooking.end_date || selectedDate,
    };
    const res = await VendorCalendarService.addBooking(data);
    if (res.success) {
      setShowAddForm(false);
      setNewBooking({ event_title: '', booking_type: 'blocked', couple_name: '', location: '', notes: '', end_date: '' });
      loadCalendar();
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    const res = await VendorCalendarService.deleteBooking(bookingId);
    if (res.success) loadCalendar();
  };

  const handleSuggestDates = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await VendorCalendarService.suggestDates({
        vendor_ids: [vendorId],
        preferred_month: monthStr,
        city: coupleCity || 'Bangalore',
        budget_tier: coupleBudgetTier || 'mid-range',
        flexibility_days: 30
      });
      if (res.success && res.data) {
        setDateSuggestions(res.data.suggestions);
        setAiSummary(res.data.ai_summary);
      }
    } catch (e) { console.error('Failed to get date suggestions', e); }
    setLoadingSuggestions(false);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const getBookingsForDate = (day: number): VendorBooking[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => b.event_date <= dateStr && (b.end_date || b.event_date) >= dateStr);
  };

  const getSuggestionForDate = (day: number): DateSuggestion | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateSuggestions.find(s => s.date === dateStr);
  };

  const selectedDateBookings = selectedDate
    ? bookings.filter(b => b.event_date <= selectedDate && (b.end_date || b.event_date) >= selectedDate)
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="font-semibold text-gray-800">
                {isVendorView ? 'My Calendar' : `${vendorName || 'Vendor'} Availability`}
              </h3>
              <p className="text-xs text-gray-400">
                {isVendorView ? 'Manage your bookings & blocked dates' : 'Check available dates for your wedding'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isVendorView && (
              <button onClick={handleSuggestDates} disabled={loadingSuggestions}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-50">
                {loadingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI Suggest Dates
              </button>
            )}
          </div>
        </div>

        {/* Month navigation */}
        <div className="px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-2 flex items-center gap-4 text-[11px] text-gray-500 border-b border-gray-50">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Tentative</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500" /> Blocked</span>
          {dateSuggestions.length > 0 && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-200" /> AI Recommended</span>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayBookings = getBookingsForDate(day);
                  const suggestion = getSuggestionForDate(day);
                  const isSelected = selectedDate === dateStr;
                  const isPast = dateStr < today;
                  const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      disabled={isPast}
                      className={`aspect-square rounded-lg text-sm font-medium relative flex flex-col items-center justify-center transition-all
                        ${isPast ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer'}
                        ${isSelected ? 'ring-2 ring-rose-400 bg-rose-50' : ''}
                        ${isWeekend && !isPast ? 'text-gray-700' : 'text-gray-600'}
                        ${suggestion && suggestion.score >= 70 ? 'bg-green-50 ring-1 ring-green-200' : ''}
                      `}
                    >
                      <span className={`text-xs ${isSelected ? 'text-rose-600 font-bold' : ''}`}>{day}</span>
                      {/* Booking dots */}
                      {dayBookings.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayBookings.slice(0, 3).map((b, bi) => (
                            <span key={bi} className={`w-1.5 h-1.5 rounded-full ${BOOKING_COLORS[b.booking_type]?.dot || 'bg-gray-400'}`} />
                          ))}
                        </div>
                      )}
                      {/* AI recommendation badge */}
                      {suggestion && suggestion.score >= 70 && dayBookings.length === 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected Date Detail */}
        {selectedDate && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              {isVendorView && (
                <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all">
                  <Plus className="w-3 h-3" /> Block / Book
                </button>
              )}
            </div>

            {selectedDateBookings.length === 0 ? (
              <div className="text-center py-3">
                <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-sm text-green-600 font-medium">Available!</p>
                <p className="text-xs text-gray-400">No bookings on this date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateBookings.map(b => {
                  const colors = BOOKING_COLORS[b.booking_type] || BOOKING_COLORS.booked;
                  return (
                    <div key={b.id} className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-2`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase ${colors.text}`}>{b.booking_type}</span>
                            <span className="text-sm font-medium text-gray-800">{b.event_title}</span>
                          </div>
                          {b.couple_name && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {b.couple_name}
                            </p>
                          )}
                          {b.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {b.location}
                            </p>
                          )}
                          {b.end_date !== b.event_date && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Until {new Date(b.end_date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                        {isVendorView && (
                          <button onClick={() => handleDeleteBooking(b.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline add form */}
            {showAddForm && isVendorView && (
              <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">Type</label>
                    <select value={newBooking.booking_type}
                      onChange={e => setNewBooking({ ...newBooking, booking_type: e.target.value as any })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-rose-400 outline-none">
                      <option value="blocked">Block Date</option>
                      <option value="booked">Confirmed Booking</option>
                      <option value="tentative">Tentative</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500">End Date</label>
                    <input type="date" value={newBooking.end_date || selectedDate || ''}
                      onChange={e => setNewBooking({ ...newBooking, end_date: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-rose-400 outline-none" />
                  </div>
                </div>
                <input placeholder="Event title" value={newBooking.event_title}
                  onChange={e => setNewBooking({ ...newBooking, event_title: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-rose-400 outline-none" />
                {newBooking.booking_type === 'booked' && (
                  <input placeholder="Couple name" value={newBooking.couple_name}
                    onChange={e => setNewBooking({ ...newBooking, couple_name: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-rose-400 outline-none" />
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddForm(false)} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleAddBooking}
                    className="text-xs px-3 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all">Save</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Date Suggestions Panel */}
      {dateSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h4 className="font-semibold text-gray-800 text-sm">AI Date Recommendations</h4>
            <button onClick={() => { setDateSuggestions([]); setAiSummary(''); }}
              className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          {aiSummary && (
            <div className="px-5 py-3 bg-rose-50/50 border-b border-rose-100">
              <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
            </div>
          )}
          <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
            {dateSuggestions.slice(0, 8).map((s, i) => (
              <button key={s.date} onClick={() => { setSelectedDate(s.date); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${
                  i === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-gray-200'
                } ${selectedDate === s.date ? 'ring-2 ring-rose-300' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Best Match</span>}
                      <span className="text-sm font-semibold text-gray-800">{s.day_of_week}, {new Date(s.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                        s.season === 'peak' ? 'bg-rose-100 text-rose-600' : s.season === 'off-peak' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                      }`}>{s.season} season</span>
                      <span className="text-[11px] text-gray-500">{s.vendor_availability} vendors free</span>
                      <span className={`text-[11px] ${s.price_impact === 'lower' ? 'text-green-600' : s.price_impact === 'higher' ? 'text-rose-600' : 'text-gray-500'}`}>
                        {s.price_impact === 'lower' ? '💰 Budget-friendly' : s.price_impact === 'higher' ? '💸 Premium pricing' : '💵 Moderate'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${s.score >= 70 ? 'text-green-600' : s.score >= 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {s.score}
                    </div>
                    <div className="text-[10px] text-gray-400">score</div>
                  </div>
                </div>
                {s.reasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.reasons.slice(0, 2).map((r, ri) => (
                      <span key={ri} className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCalendar;
