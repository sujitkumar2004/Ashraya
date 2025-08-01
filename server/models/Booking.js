import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 60, // minutes
    min: [15, 'Session duration must be at least 15 minutes'],
    max: [180, 'Session duration cannot exceed 180 minutes']
  },
  sessionType: {
    type: String,
    enum: ['video', 'phone', 'in-person'],
    required: [true, 'Session type is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    patient: {
      type: String,
      maxlength: [500, 'Patient notes cannot exceed 500 characters']
    },
    therapist: {
      type: String,
      maxlength: [1000, 'Therapist notes cannot exceed 1000 characters']
    }
  },
  sessionDetails: {
    meetingLink: String,
    meetingId: String,
    phoneNumber: String,
    location: {
      address: String,
      room: String,
      instructions: String
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    }
  }],
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    }
  },
  feedback: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientFeedback: {
      type: String,
      maxlength: [1000, 'Patient feedback cannot exceed 1000 characters']
    },
    therapistNotes: {
      type: String,
      maxlength: [2000, 'Therapist notes cannot exceed 2000 characters']
    },
    followUpRecommended: {
      type: Boolean,
      default: false
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookingSchema.index({ patient: 1, appointmentDate: 1 });
bookingSchema.index({ therapist: 1, appointmentDate: 1 });
bookingSchema.index({ status: 1, appointmentDate: 1 });
bookingSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Virtual for full appointment datetime
bookingSchema.virtual('appointmentDateTime').get(function() {
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  const dateTime = new Date(this.appointmentDate);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
});

// Virtual to check if appointment is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.appointmentDateTime > new Date() && this.status === 'confirmed';
});

// Virtual to check if appointment is today
bookingSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return appointmentDate.toDateString() === today.toDateString();
});

// Pre-save middleware to validate appointment time
bookingSchema.pre('save', function(next) {
  // Check if appointment is in the future
  if (this.appointmentDateTime <= new Date()) {
    return next(new Error('Appointment must be scheduled for a future date and time'));
  }
  
  // Check business hours (9 AM to 6 PM)
  const [hours] = this.appointmentTime.split(':').map(Number);
  if (hours < 9 || hours >= 18) {
    return next(new Error('Appointments can only be scheduled between 9:00 AM and 6:00 PM'));
  }
  
  next();
});

// Instance method to confirm booking
bookingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

// Instance method to cancel booking
bookingSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy: cancelledBy,
    cancelledAt: new Date(),
    reason: reason
  };
  return this.save();
};

// Instance method to complete booking
bookingSchema.methods.complete = function(therapistNotes, followUpRecommended = false) {
  this.status = 'completed';
  this.feedback = {
    ...this.feedback,
    therapistNotes: therapistNotes,
    followUpRecommended: followUpRecommended
  };
  return this.save();
};

// Instance method to add patient feedback
bookingSchema.methods.addPatientFeedback = function(rating, feedback) {
  this.feedback = {
    ...this.feedback,
    patientRating: rating,
    patientFeedback: feedback
  };
  return this.save();
};

// Static method to check therapist availability
bookingSchema.statics.checkAvailability = function(therapistId, date, time) {
  return this.findOne({
    therapist: therapistId,
    appointmentDate: date,
    appointmentTime: time,
    status: { $in: ['scheduled', 'confirmed'] }
  });
};

// Static method to get upcoming appointments
bookingSchema.statics.getUpcoming = function(userId, isTherapist = false) {
  const userField = isTherapist ? 'therapist' : 'patient';
  return this.find({
    [userField]: userId,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('patient', 'name email')
    .populate('therapist', 'name email profile.specialization')
    .sort({ appointmentDate: 1, appointmentTime: 1 });
};

// Static method to get booking history
bookingSchema.statics.getHistory = function(userId, isTherapist = false) {
  const userField = isTherapist ? 'therapist' : 'patient';
  return this.find({
    [userField]: userId
  })
    .populate('patient', 'name email')
    .populate('therapist', 'name email profile.specialization')
    .sort({ appointmentDate: -1, appointmentTime: -1 });
};

export default mongoose.model('Booking', bookingSchema);