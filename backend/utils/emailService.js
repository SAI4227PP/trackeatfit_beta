const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Changed to true for 465 port
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  debug: true // Enable debug logs
});

const sendOTPEmail = async (email, otp) => {
  try {
    // Verify configuration first
    console.log('Email Config:', {
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_APP_PASSWORD
    });

    // Test SMTP connection
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP Verification Error:', error);
          reject(error);
        } else {
          console.log('SMTP Server is ready');
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: `"noreply@TrackEatFit" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Change Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #15803d; padding: 20px; text-align: center;">
            <img src="https://cdn.trackeatfit.xyz/assets/premium_icon.png" alt="TrackEatFit" style="max-height: 50px;"/>
          </div>
          <div style="padding: 40px 20px; border: 1px solid #e5e7eb;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 20px; text-align: center;">Password Change Request</h1>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin-bottom: 15px;">Your verification code is:</p>
              <p style="font-size: 32px; color: #166534; text-align: center; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">${otp}</p>
              <p style="color: #4b5563; font-size: 14px;">This code will expire in 5 minutes</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">If you didn't request this change, please ignore this email or contact our support team.</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} TrackEatFit. All rights reserved.</p>
            <div style="margin-top: 10px;">
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Facebook</a>
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Twitter</a>
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Instagram</a>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Detailed email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

const sendPasswordChangeNotification = async (email) => {
  try {
    const mailOptions = {
      from: `"TrackEatFit Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Change Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #15803d; padding: 20px; text-align: center;">
            <img src="https://cdn.trackeatfit.xyz/assets/premium_icon.png" alt="TrackEatFit" style="max-height: 50px;"/>
          </div>
          <div style="padding: 40px 20px; border: 1px solid #e5e7eb;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 20px; text-align: center;">Password Changed Successfully</h1>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin-bottom: 15px;">The password for your TrackEatFit account has been successfully changed.</p>
              <p style="color: #dc2626; font-weight: bold;">If you did not initiate this change, please contact our support team immediately.</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">This is an automated message, please do not reply to this email.</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} TrackEatFit. All rights reserved.</p>
            <div style="margin-top: 10px;">
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Facebook</a>
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Twitter</a>
              <a href="#" style="color: #15803d; text-decoration: none; margin: 0 10px;">Instagram</a>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password change notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password change notification:', error);
    // Don't throw error here as this is a notification only
    return false;
  }
};

const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: `"TrackEatFit Welcome" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to TrackEatFit!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #15803d; padding: 20px; text-align: center;">
            <img src="https://cdn.trackeatfit.xyz/assets/premium_icon.png" alt="TrackEatFit" style="max-height: 50px;"/>
          </div>
          <div style="padding: 40px 20px; border: 1px solid #e5e7eb;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 20px; text-align: center;">Welcome to TrackEatFit!</h1>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin-bottom: 15px;">Hello ${username},</p>
              <p style="margin-bottom: 15px;">Welcome to TrackEatFit! We're excited to have you join our community of health enthusiasts.</p>
              <p style="margin-bottom: 15px;">Start your journey to a healthier lifestyle today!</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">Get ready to track your meals, monitor your progress, and achieve your fitness goals!</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} TrackEatFit. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};

const sendLoginNotification = async (email, deviceInfo = {}) => {
  try {
    const mailOptions = {
      from: `"TrackEatFit Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'New Login Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #15803d; padding: 20px; text-align: center;">
            <img src="https://cdn.trackeatfit.xyz/assets/premium_icon.png" alt="TrackEatFit" style="max-height: 50px;"/>
          </div>
          <div style="padding: 40px 20px; border: 1px solid #e5e7eb;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 20px; text-align: center;">New Login Alert</h1>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin-bottom: 15px;">We detected a new login to your TrackEatFit account.</p>
              <p style="margin-bottom: 15px;">Time: ${new Date().toLocaleString()}</p>
              <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="color: #15803d; margin-bottom: 10px;">Device Details:</h3>
                <p style="margin: 5px 0;">Device Type: ${deviceInfo.deviceType || 'Unknown'}</p>
                <p style="margin: 5px 0;">Browser: ${deviceInfo.browser || 'Unknown'}</p>
                <p style="margin: 5px 0;">Platform: ${deviceInfo.platform || 'Unknown'}</p>
                <p style="margin: 5px 0;">Operating System: ${deviceInfo.os || 'Unknown'}</p>
                <p style="margin: 5px 0;">IP Address: ${deviceInfo.ip || 'Unknown'}</p>
              </div>
              <p style="color: #dc2626; font-weight: bold;">If this wasn't you, please secure your account immediately.</p>
            </div>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} TrackEatFit. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Login notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send login notification:', error);
    return false;
  }
};

/**
 * Send payment status email (success/failure)
 * @param {string} email
 * @param {object} details { status, amount, plan, transactionId, paymentMethod, subscriptionStart, subscriptionEnd }
 */
const sendPaymentStatusEmail = async (email, details) => {
  if (!email) return false;

  const {
    status,
    amount,
    plan,
    transactionId,
    paymentMethod,
    subscriptionStart,
    subscriptionEnd
  } = details;

  const isSuccess = status === 'success';

  const subject = isSuccess
    ? '✅ Payment Successful — TrackEatFit Subscription'
    : '❌ Payment Failed — TrackEatFit Subscription';

  const paymentMethodLabel = {
    UPI: 'UPI',
    CARD: 'Card',
    NETBANKING: 'Net Banking',
    WALLET: 'Wallet',
    UNKNOWN: 'Unknown'
  }[(paymentMethod || '').toUpperCase()] || paymentMethod || 'Unknown';

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'N/A';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #16a34a; padding: 20px; text-align: center;">
        <img src="https://cdn.trackeatfit.xyz/assets/premium_icon.png" alt="TrackEatFit" style="max-height: 60px;" />
        <h2 style="color: #fff; margin-top: 10px;">TrackEatFit</h2>
      </div>
      <div style="padding: 30px 20px;">
        <h1 style="font-size: 22px; color: ${isSuccess ? '#15803d' : '#dc2626'}; margin-bottom: 10px;">
          ${isSuccess ? 'Your payment was successful!' : 'Oops! Your payment failed'}
        </h1>
        <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
          ${isSuccess
            ? `We’ve received your payment of <b>₹${amount}</b> for the <b>${plan}</b> subscription.`
            : `We were unable to process your payment of <b>₹${amount}</b> for the <b>${plan}</b> subscription.`}
        </p>
        <table style="width: 100%; font-size: 14px; color: #1f2937; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0;">Transaction ID:</td><td><b>${transactionId || 'N/A'}</b></td></tr>
          <tr><td style="padding: 6px 0;">Plan:</td><td><b>${plan || 'N/A'}</b></td></tr>
          <tr><td style="padding: 6px 0;">Payment Method:</td><td><b>${paymentMethodLabel}</b></td></tr>
          <tr><td style="padding: 6px 0;">Plan Start Date:</td><td><b>${formatDate(subscriptionStart)}</b></td></tr>
          <tr><td style="padding: 6px 0;">Plan End Date:</td><td><b>${formatDate(subscriptionEnd)}</b></td></tr>
        </table>

        ${
          isSuccess
            ? `<p style="color: #15803d;">🎉 Thank you for subscribing! Enjoy your premium benefits.</p>`
            : `<p style="color: #dc2626;">⚠️ If this was unintentional, please try again or contact support.</p>`
        }
      </div>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>Need help? <a href="mailto:support@trackeatfit.xyz" style="color: #15803d;">Contact support</a></p>
        <p>© ${new Date().getFullYear()} TrackEatFit. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = isSuccess
    ? `Your payment of ₹${amount} for the ${plan} subscription was successful.\nTransaction ID: ${transactionId}\nPlan Start: ${formatDate(subscriptionStart)}\nPlan End: ${formatDate(subscriptionEnd)}\n\nThank you for choosing TrackEatFit!`
    : `Your payment of ₹${amount} for the ${plan} subscription failed.\nTransaction ID: ${transactionId}\nPlease try again or contact support.\n\n- TrackEatFit Team`;

  try {
    const mailOptions = {
      from: `"TrackEatFit" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment status email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send payment status email:', error);
    return false;
  }
};


module.exports = { 
  sendOTPEmail, 
  sendPasswordChangeNotification,
  sendWelcomeEmail,
  sendLoginNotification,
  sendPaymentStatusEmail // <-- export the new function
};
