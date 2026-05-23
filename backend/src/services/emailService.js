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

const sendRescheduleRequestEmail = async ({ customer, barber, appointment, newDate, newStartTime, newEndTime, reason, acceptUrl, rejectUrl }) => {
  const oldDate = new Date(appointment.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedNewDate = new Date(newDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Yeu cau doi lich hen</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Xin chao ${customer.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Tho cat toc <strong>${barber.name}</strong> da gui yeu cau doi lich hen cua ban.
                  </p>
                  ${reason ? `<p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;"><strong>Ly do:</strong> ${reason}</p>` : ''}
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #fff0f0; border-radius: 8px; border: 1px solid #ffcccc;">
                        <p style="margin: 0 0 10px; color: #c0392b; font-size: 14px; font-weight: bold;">LICH CU</p>
                        <p style="margin: 0 0 6px; color: #333333; font-size: 14px;">${oldDate}</p>
                        <p style="margin: 0; color: #333333; font-size: 14px;">${appointment.startTime} - ${appointment.endTime}</p>
                      </td>
                      <td style="width: 4%; text-align: center; vertical-align: middle; color: #999999; font-size: 20px;">&#8594;</td>
                      <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #f0fff4; border-radius: 8px; border: 1px solid #b2dfdb;">
                        <p style="margin: 0 0 10px; color: #27ae60; font-size: 14px; font-weight: bold;">LICH MOI</p>
                        <p style="margin: 0 0 6px; color: #333333; font-size: 14px;">${formattedNewDate}</p>
                        <p style="margin: 0; color: #333333; font-size: 14px;">${newStartTime} - ${newEndTime}</p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Vui long chon mot trong cac tuy chon duoi day. Lien ket se het han sau <strong>24 gio</strong>.
                  </p>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #27ae60; margin-right: 10px;">
                        <a href="${acceptUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Chap nhan
                        </a>
                      </td>
                      <td style="width: 16px;"></td>
                      <td style="border-radius: 4px; background-color: #e74c3c;">
                        <a href="${rejectUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Tu choi
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Tran trong,<br>Doi ngu Barberly
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
    to: customer.email,
    subject: 'Yeu cau doi lich hen - Barberly',
    html
  });
};

const sendRescheduleNotificationEmail = async ({ customer, oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime }) => {
  const formattedOldDate = new Date(oldDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedNewDate = new Date(newDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Lich hen da duoc cap nhat</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Xin chao ${customer.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Lich hen cua ban da duoc cap nhat boi quan ly. Duoi day la thong tin thay doi:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #fff0f0; border-radius: 8px; border: 1px solid #ffcccc;">
                        <p style="margin: 0 0 10px; color: #c0392b; font-size: 14px; font-weight: bold;">LICH CU</p>
                        <p style="margin: 0 0 6px; color: #333333; font-size: 14px;">${formattedOldDate}</p>
                        <p style="margin: 0; color: #333333; font-size: 14px;">${oldStartTime} - ${oldEndTime}</p>
                      </td>
                      <td style="width: 4%; text-align: center; vertical-align: middle; color: #999999; font-size: 20px;">&#8594;</td>
                      <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #f0fff4; border-radius: 8px; border: 1px solid #b2dfdb;">
                        <p style="margin: 0 0 10px; color: #27ae60; font-size: 14px; font-weight: bold;">LICH MOI</p>
                        <p style="margin: 0 0 6px; color: #333333; font-size: 14px;">${formattedNewDate}</p>
                        <p style="margin: 0; color: #333333; font-size: 14px;">${newStartTime} - ${newEndTime}</p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5; background-color: #f8f8f8; padding: 15px; border-radius: 4px; border-left: 4px solid #1a1a2e;">
                    Duoc cap nhat boi quan ly
                  </p>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #1a1a2e;">
                        <a href="${CLIENT_URL}/appointments" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Xem lich hen cua toi
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Tran trong,<br>Doi ngu Barberly
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
    to: customer.email,
    subject: 'Lich hen da duoc cap nhat - Barberly',
    html
  });
};

const sendRescheduleResponseEmail = async ({ barber, customer, action, appointment, newDate, newStartTime }) => {
  const isAccepted = action === 'accept';
  const headerColor = isAccepted ? '#27ae60' : '#e74c3c';
  const title = isAccepted ? 'Khach da chap nhan doi lich' : 'Khach da tu choi doi lich';
  const formattedNewDate = new Date(newDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
                <td style="padding: 40px 40px 20px; text-align: center; background-color: ${headerColor}; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Xin chao ${barber.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Khach hang <strong>${customer.name}</strong> da <strong>${isAccepted ? 'chap nhan' : 'tu choi'}</strong> yeu cau doi lich hen cua ban.
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f8f8; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Khach hang:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${customer.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Ngay moi:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${formattedNewDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Gio bat dau:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${newStartTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Trang thai:</td>
                            <td style="padding: 10px 0; font-size: 14px; font-weight: bold; text-align: right; color: ${headerColor};">${isAccepted ? 'Da chap nhan' : 'Da tu choi'}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  ${isAccepted
                    ? '<p style="margin: 20px 0; color: #333333; font-size: 14px; line-height: 1.5;">Lich hen da duoc xac nhan voi thoi gian moi. Vui long chuan bi dung gio.</p>'
                    : '<p style="margin: 20px 0; color: #333333; font-size: 14px; line-height: 1.5;">Khach hang khong dong y doi lich. Lich hen giu nguyen theo lich cu.</p>'
                  }
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Tran trong,<br>Doi ngu Barberly
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
    to: barber.email,
    subject: `${title} - Barberly`,
    html
  });
};

const sendWalkInAccountEmail = async ({ customer, password, appointment }) => {
  const appointmentDate = new Date(appointment.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Chao mung den Barberly!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Xin chao ${customer.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Tai khoan cua ban da duoc tao thanh cong. Duoi day la thong tin dang nhap:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f0f4ff; border-radius: 8px; border: 1px solid #c5d0f5;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Email:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${customer.email}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Mat khau tam thoi:</td>
                            <td style="padding: 10px 0; color: #1a1a2e; font-size: 16px; font-weight: bold; text-align: right; font-family: monospace;">${password}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 20px; color: #e74c3c; font-size: 14px; line-height: 1.5; background-color: #fff0f0; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c;">
                    <strong>Luu y:</strong> Vui long doi mat khau ngay sau khi dang nhap lan dau de bao mat tai khoan cua ban.
                  </p>
                  <p style="margin: 20px 0 10px; color: #333333; font-size: 16px; font-weight: bold;">Thong tin lich hen:</p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 20px; background-color: #f8f8f8; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Dich vu:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.service ? appointment.service.name : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Tho cat toc:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.barber ? appointment.barber.name : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Ngay:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointmentDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Gio:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.startTime} - ${appointment.endTime}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <table role="presentation" style="margin: 30px auto;">
                    <tr>
                      <td style="border-radius: 4px; background-color: #1a1a2e;">
                        <a href="${CLIENT_URL}/login" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                          Dang nhap ngay
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Tran trong,<br>Doi ngu Barberly
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
    to: customer.email,
    subject: 'Chao mung den Barberly - Thong tin tai khoan',
    html
  });
};

const sendWalkInBookingEmail = async ({ customer, appointment }) => {
  const appointmentDate = new Date(appointment.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Lich hen moi</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Xin chao ${customer.name},
                  </p>
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                    Mot lich hen moi da duoc tao cho ban. Duoi day la chi tiet:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f8f8; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Dich vu:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.service ? appointment.service.name : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Tho cat toc:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.barber ? appointment.barber.name : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Ngay:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointmentDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #666666; font-size: 14px;">Gio:</td>
                            <td style="padding: 10px 0; color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${appointment.startTime} - ${appointment.endTime}</td>
                          </tr>
                          ${appointment.totalPrice ? `
                          <tr>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #666666; font-size: 14px;">Tong tien:</td>
                            <td style="padding: 10px 0; border-top: 1px solid #dddddd; color: #27ae60; font-size: 18px; font-weight: bold; text-align: right;">${appointment.totalPrice.toLocaleString('vi-VN')} VND</td>
                          </tr>` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5; background-color: #f8f8f8; padding: 15px; border-radius: 4px; border-left: 4px solid #27ae60;">
                    Duoc dat boi nhan vien
                  </p>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Vui long den dung gio. Neu can thay doi, lien he truc tiep voi cua hang.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Tran trong,<br>Doi ngu Barberly
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
    to: customer.email,
    subject: 'Lich hen moi - Barberly',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendRescheduleRequestEmail,
  sendRescheduleNotificationEmail,
  sendRescheduleResponseEmail,
  sendWalkInAccountEmail,
  sendWalkInBookingEmail
};
