const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const { sendOTPEmail, sendPasswordChangeNotification } = require('../utils/emailService');

// Generate and send OTP
router.post('/send-otp', async (req, res) => {
  try {
    // Accept { auth: { email }, purpose }
    const { auth, purpose } = req.body;
    const email = auth?.email;
    
    console.log('Received OTP request for:', email);
    
    // Find user (await needed)
    const user = await User.findOne({ 'auth.email': email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete any existing OTP for this email and purpose (await needed)
    await OTP.deleteMany({ email, purpose });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Respond immediately (do not wait for email or DB)
    res.json({ success: true, message: 'OTP sent successfully' });

    // Send email and save OTP asynchronously
    sendOTPEmail(email, otp)
      .then(() => {
        OTP.create({ email, otp, purpose })
          .catch(err => {
            console.error('Error saving OTP:', err);
          });
      })
      .catch(emailError => {
        console.error('Email sending error details:', emailError);
        // Optionally: log or alert admin, but do not notify client
      });

  } catch (error) {
    console.error('General error in send-otp route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and change password
router.post('/change-password', async (req, res) => {
  try {
    // Accept { auth: { email }, currentPassword, newPassword, otp }
    const { auth, currentPassword, newPassword, otp } = req.body;
    const email = auth?.email;

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email,
      purpose: 'password_change',
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find user and verify current password
    const user = await User.findOne({ 'auth.email': email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.auth.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.auth.password = hashedPassword;
    await user.save();

    // Respond immediately after password update
    res.json({ success: true, message: 'Password updated successfully' });

    // Delete used OTP and send notification email asynchronously
    OTP.deleteOne({ _id: otpRecord._id }).catch(() => {});
    sendPasswordChangeNotification(email).catch(error => {
      console.error('Error sending password change notification:', error);
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this new route after existing routes
router.post('/reset-password', async (req, res) => {
  try {
    // Accept { auth: { email }, newPassword, otp }
    const { auth, newPassword, otp } = req.body;
    const email = auth?.email;

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email,
      purpose: 'password_reset', // Note the different purpose
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find user
    const user = await User.findOne({ 'auth.email': email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.auth.password = hashedPassword;
    await user.save();

    // Respond immediately after password reset
    res.json({ success: true, message: 'Password reset successfully' });

    // Delete used OTP and send notification email asynchronously
    OTP.deleteOne({ _id: otpRecord._id }).catch(() => {});
    sendPasswordChangeNotification(email).catch(error => {
      console.error('Error sending password change notification:', error);
    });

  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
