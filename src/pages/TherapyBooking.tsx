import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Star, Video, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

interface Therapist {
  _id: string;
  name: string;
  specialization: string;
  rating: number;
  bio: string;
  sessionTypes: string[];
  availability: { date: string; slots: string[] }[];
}

const TherapyBooking: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('video');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      // Mock data for demonstration
      const mockTherapists: Therapist[] = [
        {
          _id: '1',
          name: 'Dr. Sarah Wilson',
          specialization: 'Grief Counseling & Palliative Care',
          rating: 4.9,
          bio: 'Specialized in helping patients and families navigate end-of-life challenges with compassion and dignity.',
          sessionTypes: ['video', 'phone', 'in-person'],
          availability: [
            { date: '2024-01-20', slots: ['10:00 AM', '2:00 PM', '4:00 PM'] },
            { date: '2024-01-21', slots: ['9:00 AM', '11:00 AM', '3:00 PM'] }
          ]
        },
        {
          _id: '2',
          name: 'Dr. Michael Chen',
          specialization: 'Family Therapy & Support',
          rating: 4.8,
          bio: 'Expert in helping families communicate and support each other through difficult medical journeys.',
          sessionTypes: ['video', 'phone'],
          availability: [
            { date: '2024-01-20', slots: ['11:00 AM', '1:00 PM', '5:00 PM'] },
            { date: '2024-01-22', slots: ['10:00 AM', '2:00 PM', '4:00 PM'] }
          ]
        },
        {
          _id: '3',
          name: 'Dr. Lisa Rodriguez',
          specialization: 'Emotional Wellness & Coping',
          rating: 4.7,
          bio: 'Focused on emotional wellness strategies and coping mechanisms for chronic illness.',
          sessionTypes: ['video', 'in-person'],
          availability: [
            { date: '2024-01-21', slots: ['10:00 AM', '12:00 PM', '3:00 PM'] },
            { date: '2024-01-23', slots: ['9:00 AM', '1:00 PM', '4:00 PM'] }
          ]
        }
      ];
      setTherapists(mockTherapists);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const handleBookSession = async () => {
    if (!selectedTherapist || !selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        therapistId: selectedTherapist._id,
        date: selectedDate,
        time: selectedTime,
        sessionType
      });
      setBookingSuccess(true);
      // Reset form
      setSelectedTherapist(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error('Error booking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Booked Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your therapy session has been scheduled. You'll receive a confirmation email shortly.
          </p>
          <button
            onClick={() => setBookingSuccess(false)}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200"
          >
            Book Another Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Therapy Booking</h1>
          <p className="text-gray-600 text-lg">
            Connect with qualified therapists who specialize in palliative care support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Therapist Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Your Therapist</h2>
            <div className="space-y-6">
              {therapists.map((therapist) => (
                <div
                  key={therapist._id}
                  className={`bg-white p-6 rounded-xl shadow-md border-2 cursor-pointer transition-all duration-200 ${
                    selectedTherapist?._id === therapist._id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                  onClick={() => setSelectedTherapist(therapist)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-teal-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">{therapist.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">{therapist.rating}</span>
                        </div>
                      </div>
                      <p className="text-teal-600 font-medium mb-2">{therapist.specialization}</p>
                      <p className="text-gray-600 mb-3">{therapist.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {therapist.sessionTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {getSessionIcon(type)}
                            <span className="capitalize">{type.replace('-', ' ')}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Book Your Session</h3>
              
              {!selectedTherapist ? (
                <p className="text-gray-500 text-center py-8">
                  Please select a therapist to continue
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Type
                    </label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {selectedTherapist.sessionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Choose a date</option>
                      {selectedTherapist.availability.map((day) => (
                        <option key={day.date} value={day.date}>
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Time
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedTherapist.availability
                          .find(day => day.date === selectedDate)
                          ?.slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`p-3 text-center rounded-lg border transition-colors duration-200 ${
                                selectedTime === slot
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-teal-300'
                              }`}
                            >
                              <Clock className="h-4 w-4 inline mr-2" />
                              {slot}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBookSession}
                    disabled={!selectedDate || !selectedTime || isLoading}
                    className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      'Book Session'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapyBooking;