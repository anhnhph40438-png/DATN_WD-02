const { Resend } = require('resend');
const { RESEND_API_KEY, EMAIL_FROM, CLIENT_URL } = require('../config/env');

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.log('Email service not configured. Skipping email send.');
    console.log(`Would have sent email to: ${to}`);
    console.log(`Subject: ${subject}`);
    return { success: true, message: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to Haircut!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hi ${user.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Thank you for joining Haircut! We're excited to have you on board.
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    With Haircut, you can:
                  </p>
                  <ul style="margin: 0 0 20px; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                    <li>Browse and discover barbershops near you</li>
                    <li>Book appointments easily</li>
                    <li>View service menus and prices</li>
                    <li>Leave reviews and ratings</li>
                  </ul>
                  <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Ready to book your first appointment?
                  </p>
                  <table role="presentation" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #1a1a2e;">
                        <a href="${CLIENT_URL}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Start Exploring
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Best regards,<br>The Haircut Team
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Haircut! Your account is ready',
    html
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Password Reset Request</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hi ${user.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #e74c3c;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    This link will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.5;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                  <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #1a1a2e;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Best regards,<br>The Haircut Team
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - Haircut',
    html
  });
};

const sendAppointmentConfirmation = async (appointment) => {
  const { user, shop, service, barber, date, startTime, endTime, totalPrice } = appointment;

  const appointmentDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #27ae60; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Booking Confirmed!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hi ${user.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Your appointment has been confirmed! Here are the details:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f8f8; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Shop:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${shop.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Service:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${service.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Barber:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${barber.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Date:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointmentDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Time:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${startTime} - ${endTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #666666; font-size: 14px;">Total:</td>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #27ae60; font-size: 18px; font-weight: bold; text-align: right;">${totalPrice.toLocaleString('vi-VN')} VND</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Please arrive 5-10 minutes before your scheduled time.
                  </p>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #1a1a2e;">
                        <a href="${CLIENT_URL}/appointments" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          View My Appointments
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Best regards,<br>The Haircut Team
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Appointment Confirmed - ${shop.name}`,
    html
  });
};

const sendAppointmentReminder = async (appointment) => {
  const { user, shop, service, barber, date, startTime, endTime } = appointment;

  const appointmentDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #f39c12; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Appointment Reminder</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Hi ${user.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    This is a friendly reminder about your upcoming appointment:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff8e1; border-radius: 8px; border: 1px solid #f39c12;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Shop:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${shop.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Service:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${service.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Barber:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${barber.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Date:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointmentDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Time:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${startTime} - ${endTime}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                    <strong>Location:</strong> ${shop.address}
                  </p>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Please arrive 5-10 minutes before your scheduled time. If you need to cancel or reschedule, please do so at least 2 hours in advance.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    See you soon!<br>The Haircut Team
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Reminder: Your appointment at ${shop.name} is coming up!`,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder
};
