import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
export const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['patient', 'caregiver', 'therapist'])
    .withMessage('Role must be either patient, caregiver, or therapist'),
  
  handleValidationErrors
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Story validation
export const validateStory = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Content must be between 50 and 10,000 characters'),
  
  body('category')
    .optional()
    .isIn(['personal', 'medical', 'emotional', 'caregiver', 'recovery', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      return true;
    }),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  
  handleValidationErrors
];

// Comment validation
export const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1,000 characters')
    .matches(/^[^<>]*$/)
    .withMessage('Comments cannot contain HTML tags'),
  
  handleValidationErrors
];

// Resource validation
export const validateResource = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1,000 characters'),
  
  body('category')
    .isIn(['medical', 'emotional', 'financial', 'legal'])
    .withMessage('Category must be medical, emotional, financial, or legal'),
  
  body('type')
    .isIn(['pdf', 'link', 'video', 'audio', 'image'])
    .withMessage('Type must be pdf, link, video, audio, or image'),
  
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Booking validation
export const validateBooking = [
  body('therapist')
    .isMongoId()
    .withMessage('Invalid therapist ID'),
  
  body('appointmentDate')
    .isISO8601()
    .withMessage('Invalid appointment date')
    .custom((date) => {
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      // Check if date is within next 3 months
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      
      if (appointmentDate > maxDate) {
        throw new Error('Appointments can only be booked up to 3 months in advance');
      }
      
      return true;
    }),
  
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM')
    .custom((time) => {
      const [hours] = time.split(':').map(Number);
      if (hours < 9 || hours >= 18) {
        throw new Error('Appointments can only be scheduled between 9:00 AM and 6:00 PM');
      }
      return true;
    }),
  
  body('sessionType')
    .isIn(['video', 'phone', 'in-person'])
    .withMessage('Session type must be video, phone, or in-person'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  
  handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('profile.specialization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Specialization cannot exceed 200 characters'),
  
  body('profile.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

export default {
  validateRegistration,
  validateLogin,
  validateStory,
  validateComment,
  validateResource,
  validateBooking,
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors
};