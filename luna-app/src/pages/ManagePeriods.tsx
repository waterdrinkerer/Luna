import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import BottomNav from "../components/BottomNav";
import "react-day-picker/dist/style.css";

interface PeriodLog {
  id: string;
  startDate: Date;
  endDate: Date | null;
  duration: number | null;
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
  loggedAt: Date;
  type: 'current' | 'past';
  isOngoing?: boolean;
  currentDay?: number;
}

const ManagePeriods = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndPeriodModal, setShowEndPeriodModal] = useState(false);
  const [editRange, setEditRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [editFlow, setEditFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/welcome");
      return;
    }

    try {
      setLoading(true);
      
      const periodLogsRef = collection(db, "users", user.uid, "periodLogs");
      const q = query(periodLogsRef, orderBy("startDate", "desc"));
      const querySnapshot = await getDocs(q);

      const periodsList: PeriodLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.startDate) {
          const startDate = new Date(data.startDate);
          
          // Handle ongoing periods
          if (data.isOngoing && !data.endDate) {
            const currentDay = data.currentDay || Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            periodsList.push({
              id: doc.id,
              startDate: startDate,
              endDate: null,
              duration: null,
              flow: data.flow || 'medium',
              notes: data.notes || '',
              loggedAt: new Date(data.loggedAt || data.startDate),
              type: 'current',
              isOngoing: true,
              currentDay: currentDay
            });
          }
          // Handle completed periods
          else if (data.endDate) {
            const endDate = new Date(data.endDate);
            periodsList.push({
              id: doc.id,
              startDate: startDate,
              endDate: endDate,
              duration: data.duration || Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
              flow: data.flow || 'medium',
              notes: data.notes || '',
              loggedAt: new Date(data.loggedAt || data.startDate),
              type: 'past',
              isOngoing: false
            });
          }
        }
      });

      setPeriods(periodsList);
      console.log("📊 Loaded periods for management:", periodsList.length);
    } catch (error) {
      console.error("❌ Error fetching periods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (period: PeriodLog) => {
    if (period.isOngoing) {
      alert("Please end this period first before editing it.");
      return;
    }

    console.log("🔧 Opening edit modal for period:", {
      id: period.id,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate?.toISOString(),
      duration: period.duration
    });

    setSelectedPeriod(period);
    
    // ✅ FIXED: Properly set the edit range with valid dates
    const editDateRange: DateRange = {
      from: period.startDate,
      to: period.endDate || period.startDate // Fallback to start date if no end date
    };
    
    setEditRange(editDateRange);
    setEditFlow(period.flow || 'medium');
    setEditNotes(period.notes || '');
    setShowEditModal(true);

    console.log("🔧 Edit range set to:", editDateRange);
  };

  const handleDelete = (period: PeriodLog) => {
    setSelectedPeriod(period);
    setShowDeleteModal(true);
  };

  const handleEndPeriod = (period: PeriodLog) => {
    if (!period.isOngoing) return;
    setSelectedPeriod(period);
    setShowEndPeriodModal(true);
  };

  const confirmEndPeriod = async () => {
    if (!selectedPeriod || !selectedPeriod.isOngoing || !auth.currentUser) return;

    const endDate = new Date();
    const duration = Math.ceil((endDate.getTime() - selectedPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    try {
      setIsUpdating(true);
      const periodRef = doc(db, "users", auth.currentUser.uid, "periodLogs", selectedPeriod.id);
      
      await updateDoc(periodRef, {
        endDate: endDate.toISOString(),
        duration: duration,
        isOngoing: false,
        currentDay: null,
        updatedAt: new Date().toISOString()
      });

      console.log("✅ Period ended successfully");
      setShowEndPeriodModal(false);
      await fetchPeriods();
      alert(`Period ended! Total duration: ${duration} days`);
      
    } catch (error) {
      console.error("❌ Error ending period:", error);
      alert("Failed to end period. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ FIXED: Improved edit confirmation with better validation
  const confirmEdit = async () => {
    if (!selectedPeriod || !editRange.from || !editRange.to || !auth.currentUser) {
      console.log("❌ Edit validation failed:", {
        selectedPeriod: !!selectedPeriod,
        from: !!editRange.from,
        to: !!editRange.to,
        user: !!auth.currentUser
      });
      alert("Please select both start and end dates.");
      return;
    }

    // Validate date range
    if (editRange.from > editRange.to) {
      alert("Start date cannot be after end date.");
      return;
    }

    const duration = Math.ceil((editRange.to.getTime() - editRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (duration > 15) {
      const confirmed = window.confirm(`This period would be ${duration} days long. Are you sure this is correct?`);
      if (!confirmed) return;
    }

    setIsUpdating(true);
    try {
      const periodRef = doc(db, "users", auth.currentUser.uid, "periodLogs", selectedPeriod.id);
      
      const updatedData = {
        startDate: editRange.from.toISOString(),
        endDate: editRange.to.toISOString(),
        duration: duration,
        flow: editFlow,
        notes: editNotes,
        updatedAt: new Date().toISOString(),
        isOngoing: false,
        currentDay: null
      };

      console.log("💾 Updating period with data:", updatedData);
      
      await updateDoc(periodRef, updatedData);
      
      console.log("✅ Period updated successfully");
      setShowEditModal(false);
      
      // Reset form
      setEditRange({ from: undefined, to: undefined });
      setEditFlow('medium');
      setEditNotes('');
      setSelectedPeriod(null);
      
      await fetchPeriods(); // Refresh the list
      alert("Period updated successfully!");
      
    } catch (error) {
      console.error("❌ Error updating period:", error);
      alert("Failed to update period. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPeriod || !auth.currentUser) {
      return;
    }

    setIsUpdating(true);
    try {
      const periodRef = doc(db, "users", auth.currentUser.uid, "periodLogs", selectedPeriod.id);
      await deleteDoc(periodRef);
      
      console.log("✅ Period deleted successfully");
      setShowDeleteModal(false);
      await fetchPeriods();
      
    } catch (error) {
      console.error("❌ Error deleting period:", error);
      alert("Failed to delete period. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ FIXED: Calendar date range handler with proper logging
  const handleDateRangeChange = (selectedRange: DateRange | undefined) => {
    console.log("📅 Date range changed:", selectedRange);
    
    if (selectedRange) {
      setEditRange(selectedRange);
    } else {
      setEditRange({ from: undefined, to: undefined });
    }
  };

  const formatDateRange = (start: Date, end: Date | null, isOngoing?: boolean) => {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (isOngoing || end === null) {
      return `${startStr} - Ongoing`;
    }
    
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const getFlowEmoji = (flow: string) => {
    switch (flow) {
      case 'light': return '🌸';
      case 'medium': return '🩸';
      case 'heavy': return '🌊';
      default: return '🩸';
    }
  };

  const getFlowColor = (flow: string) => {
    switch (flow) {
      case 'light': return '#FEE2E2';
      case 'medium': return '#FECACA';
      case 'heavy': return '#FCA5A5';
      default: return '#FECACA';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your periods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Manage Periods</h1>
          <button
            onClick={() => navigate('/log-period', { state: { returnTo: '/manage-periods' } })}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full shadow-md"
          >
            Add Period
          </button>
        </div>

        {/* Stats Overview */}
        {periods.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Period Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{periods.length}</p>
                <p className="text-xs text-gray-500">Total Periods</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-500">
                  {periods.filter(p => !p.isOngoing && p.duration).length > 0 
                    ? Math.round(
                        periods
                          .filter(p => !p.isOngoing && p.duration)
                          .reduce((sum, p) => sum + (p.duration || 0), 0) / 
                        periods.filter(p => !p.isOngoing && p.duration).length
                      ) 
                    : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {periods.filter(p => p.flow === 'heavy').length}
                </p>
                <p className="text-xs text-gray-500">Heavy Flow</p>
              </div>
            </div>
          </div>
        )}

        {/* Period List */}
        <div className="space-y-4">
          {periods.length > 0 ? (
            periods.map((period) => (
              <div key={period.id} className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getFlowEmoji(period.flow ?? 'medium')}</span>
                      <h3 className="font-semibold text-gray-800">
                        {formatDateRange(period.startDate, period.endDate, period.isOngoing)}
                      </h3>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: getFlowColor(period.flow ?? 'medium'), color: '#991B1B' }}
                      >
                        {period.flow} flow
                      </span>
                      {period.isOngoing && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Duration: {period.isOngoing 
                          ? `Day ${period.currentDay} (ongoing)` 
                          : `${period.duration} days`
                        }
                      </p>
                      <p>Logged: {period.loggedAt.toLocaleDateString()}</p>
                      {period.notes && (
                        <p className="text-gray-500 italic">"{period.notes}"</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    {period.isOngoing ? (
                      <button
                        onClick={() => handleEndPeriod(period)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                      >
                        End Period
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(period)}
                        className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(period)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Periods Logged Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start tracking your periods to see them here</p>
              <button
                onClick={() => navigate('/log-period', { state: { returnTo: '/manage-periods' } })}
                className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium"
              >
                Log Your First Period
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Edit Modal with improved calendar handling */}
      {showEditModal && selectedPeriod && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={(e) => {
            // ✅ Prevent modal close on background click during calendar interaction
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // ✅ Prevent event bubbling
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Period</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  // Reset form when closing
                  setEditRange({ from: undefined, to: undefined });
                  setEditFlow('medium');
                  setEditNotes('');
                  setSelectedPeriod(null);
                }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ✅ Debug Info */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p><strong>Current Selection:</strong></p>
              <p>From: {editRange.from?.toLocaleDateString() || 'Not selected'}</p>
              <p>To: {editRange.to?.toLocaleDateString() || 'Not selected'}</p>
            </div>

            {/* ✅ FIXED: Date Picker with better event handling */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period Dates</label>
              <div 
                className="border border-gray-200 rounded-xl p-2"
                onClick={(e) => e.stopPropagation()} // ✅ Prevent bubbling
              >
                <DayPicker
                  mode="range"
                  selected={editRange}
                  onSelect={handleDateRangeChange}
                  disabled={{ after: new Date() }}
                  className="w-full"
                  // ✅ Additional props to prevent conflicts
                  showOutsideDays={false}
                  fixedWeeks={false}
                />
              </div>
            </div>

            {/* Flow Intensity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'medium', 'heavy'] as const).map((flow) => (
                  <button
                    key={flow}
                    type="button" // ✅ Explicit button type
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditFlow(flow);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      editFlow === flow
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg mb-1">{getFlowEmoji(flow)}</div>
                    <div className="text-xs font-medium capitalize">{flow}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Any notes about this period..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows={3}
                onClick={(e) => e.stopPropagation()} // ✅ Prevent bubbling
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRange({ from: undefined, to: undefined });
                  setEditFlow('medium');
                  setEditNotes('');
                  setSelectedPeriod(null);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEdit}
                disabled={!editRange.from || !editRange.to || isUpdating}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  editRange.from && editRange.to && !isUpdating
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Period Modal */}
      {showEndPeriodModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="text-4xl mb-4">🏁</div>
              <h3 className="text-lg font-bold mb-2">End Period?</h3>
              <p className="text-gray-600 text-sm mb-2">
                Started: {selectedPeriod.startDate.toLocaleDateString()}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                Currently Day {selectedPeriod.currentDay}
              </p>
              <p className="text-gray-500 text-xs mb-6">
                This will mark your period as ended today.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndPeriodModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndPeriod}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium"
                >
                  {isUpdating ? 'Ending...' : 'End Period'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="text-4xl mb-4">🗑️</div>
              <h3 className="text-lg font-bold mb-2">Delete Period?</h3>
              <p className="text-gray-600 text-sm mb-2">
                {formatDateRange(selectedPeriod.startDate, selectedPeriod.endDate, selectedPeriod.isOngoing)}
              </p>
              <p className="text-gray-500 text-xs mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
                >
                  {isUpdating ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ManagePeriods;