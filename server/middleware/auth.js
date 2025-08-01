import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('isActive role');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token, access denied' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token, access denied' });
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Therapist or Admin middleware
export const therapistOrAdmin = (req, res, next) => {
  if (!req.user || !['therapist', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Therapist or admin privileges required.' 
    });
  }
  next();
};

// Resource owner or Admin middleware
export const ownerOrAdmin = (Model) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const resource = await Model.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check different ownership fields based on model
      const ownerField = resource.author || resource.uploadedBy || resource.patient || resource.user;
      
      if (!ownerField || ownerField.toString() !== req.user.userId) {
        return res.status(403).json({ 
          message: 'Access denied. You can only access your own resources.' 
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

export default {
  authenticate,
  authorize,
  adminOnly,
  therapistOrAdmin,
  ownerOrAdmin
};