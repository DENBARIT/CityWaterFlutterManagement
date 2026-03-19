import nodemailer from 'nodemailer';

function createTransporter() {
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').trim();

  if (!user || !pass) {
    throw new Error(
      'SMTP credentials are missing. Set EMAIL_USER and EMAIL_PASS in updated backend/.env to send OTP emails.'
    );
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(to, subject, text, html) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

export async function sendAnnouncementNotice(to, details = {}) {
  const title = String(details.title || '').trim() || 'City Water Announcement';
  const message = String(details.message || '').trim();
  const targetLabel = String(details.targetLabel || 'Selected recipients').trim();
  const senderName = String(details.senderName || 'Super Admin').trim();
  const senderEmail = String(details.senderEmail || '').trim();

  const subject = `AquaConnect Announcement: ${title}`;
  const text = `Announcement Title: ${title}\n\n${message}\n\nTarget Group: ${targetLabel}\nSent By: ${senderName}${
    senderEmail ? ` (${senderEmail})` : ''
  }`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">${title}</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">CITY WATER SYSTEM ANNOUNCEMENT</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0; color: #2d3e50; font-size: 14px; line-height: 1.65; white-space: pre-wrap;">${message}</p>
          <div style="margin-top: 16px; border: 1px solid #dbeaf8; border-radius: 10px; padding: 12px 14px; background: #f8fbff;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Target Group:</strong> ${targetLabel}</p>
            <p style="margin: 0; font-size: 12px; color: #1f2937;"><strong>Sent By:</strong> ${senderName}${
    senderEmail ? ` (${senderEmail})` : ''
  }</p>
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendScheduleNotice(to, details = {}) {
  const title = String(details.title || 'Water Supply Schedule').trim();
  const summary = String(details.summary || '').trim();
  const woredas = Array.isArray(details.woredas) ? details.woredas : [];
  const blocks = Array.isArray(details.blocks) ? details.blocks : [];

  const dayMap = {
    MONDAY: 'ሰኞ',
    TUESDAY: 'ማክሰኞ',
    WEDNESDAY: 'ረቡዕ',
    THURSDAY: 'ሐሙስ',
    FRIDAY: 'ዓርብ',
    SATURDAY: 'ቅዳሜ',
    SUNDAY: 'እሑድ',
  };

  const describeTimePeriod = (startTime, endTime) => {
    const startHour = Number(String(startTime || '').split(':')[0]);
    const endHour = Number(String(endTime || '').split(':')[0]);

    if (Number.isFinite(startHour) && Number.isFinite(endHour)) {
      if (startHour < 12 && endHour < 12) {
        return 'ቀን';
      }

      if (startHour >= 12 && endHour >= 12) {
        return 'ማታ';
      }
    }

    return 'ቀን / ማታ';
  };

  const to12Hour = (timeValue) => {
    const raw = String(timeValue || '').trim();
    const [hourText, minuteText] = raw.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return raw || 'Not available';
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const formatScheduleBlock = (block) => {
    const startDay =
      dayMap[String(block?.startDay || '').toUpperCase()] ||
      String(block?.startDay || 'Not available');
    const endDay =
      dayMap[String(block?.endDay || '').toUpperCase()] || String(block?.endDay || 'Not available');
    const startTime = String(block?.startTime || '').trim() || 'Not available';
    const endTime = String(block?.endTime || '').trim() || 'Not available';
    const startTimeDisplay = to12Hour(startTime);
    const endTimeDisplay = to12Hour(endTime);
    const timePeriod = describeTimePeriod(startTime, endTime);

    return {
      english: `${String(block?.startDay || 'Not available')} to ${String(
        block?.endDay || 'Not available'
      )} from ${startTimeDisplay} to ${endTimeDisplay}`,
      amharic: `${startDay} እስከ ${endDay} - ${timePeriod} (${startTimeDisplay} - ${endTimeDisplay})`,
    };
  };

  const scheduleBlocks = blocks.length
    ? blocks.map(formatScheduleBlock)
    : [
        {
          english: summary || 'Not available',
          amharic: summary || 'Not available',
        },
      ];

  const scheduleBulletsText = scheduleBlocks
    .map((block) => `- ${block.english}\n  - ${block.amharic}`)
    .join('\n');

  const scheduleBulletsHtml = scheduleBlocks
    .map(
      (block) => `
        <div style="margin: 6px 0; padding: 10px 12px; border-radius: 8px; background: #f8fbff; border: 1px solid #dbeaf8;">
          <p style="margin: 0; color: #1f2937; font-size: 12px;"><strong>Gregorian:</strong> ${block.english}</p>
          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 12px;"><strong>አማርኛ:</strong> ${block.amharic}</p>
        </div>
      `
    )
    .join('');

  const subject = `AquaConnect Schedule Update: ${title}`;
  const text = `Water supply schedule update\n\n${summary}\n\nWoredas: ${
    woredas.join(', ') || 'Not available'
  }\nSchedule Details:\n${scheduleBulletsText}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">${title}</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">WATER DISTRIBUTION NOTICE</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0; color: #2d3e50; font-size: 14px; line-height: 1.65; white-space: pre-wrap;">${summary}</p>
          <div style="margin-top: 16px; border: 1px solid #dbeaf8; border-radius: 10px; padding: 12px 14px; background: #f8fbff;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Woredas:</strong> ${
              woredas.join(', ') || 'Not available'
            }</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Schedule:</strong></p>
            ${scheduleBulletsHtml}
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendOwnershipTransferNotice(to, details = {}) {
  const meterNumber = String(details.meterNumber || '').trim() || 'Not available';
  const previousOwnerName = String(details.previousOwnerName || '').trim() || 'Previous owner';
  const previousOwnerEmail = String(details.previousOwnerEmail || '').trim() || 'Not available';
  const newOwnerName = String(details.newOwnerName || '').trim() || 'New owner';
  const newOwnerEmail = String(details.newOwnerEmail || to || '').trim() || 'Not available';

  const subject = `AquaConnect Meter Ownership Updated (${meterNumber})`;
  const text = `Hello ${newOwnerName},\n\nMeter ownership has been transferred to your account.\n\nMeter Number: ${meterNumber}\nPrevious Owner: ${previousOwnerName} (${previousOwnerEmail})\nNew Owner: ${newOwnerName} (${newOwnerEmail})\n\nYou can now use this account as the active owner for this meter.`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">Meter Ownership Transfer</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">CUSTOMER ACCOUNT UPDATE</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0; color: #2d3e50; font-size: 14px; line-height: 1.65;">Hello <strong>${newOwnerName}</strong>, your meter ownership has been updated successfully.</p>
          <div style="margin-top: 14px; border: 1px solid #dbeaf8; border-radius: 10px; padding: 12px 14px; background: #f8fbff;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Meter Number:</strong> ${meterNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Previous Owner:</strong> ${previousOwnerName} (${previousOwnerEmail})</p>
            <p style="margin: 0; font-size: 12px; color: #1f2937;"><strong>New Owner:</strong> ${newOwnerName} (${newOwnerEmail})</p>
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

function formatBillingEmailDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function sendBillingGeneratedNotice(to, details = {}) {
  const customerName = String(details.customerName || 'Customer').trim();
  const cycleKey = String(details.cycleKey || '').trim() || 'Current cycle';
  const amountDue = Number(details.amountDue || 0);
  const consumption = Number(details.consumption || 0);
  const currentReading = Number(details.currentReading || 0);
  const billGeneratedDate = formatBillingEmailDate(details.billGeneratedDate || new Date());
  const dueDate = formatBillingEmailDate(details.dueDate || null);

  const subject = `AquaConnect Bill Generated (${cycleKey})`;
  const text = `Hello ${customerName},\n\nYour current monthly bill has been generated for ${cycleKey}.\n\nAmount Due: ${amountDue.toFixed(
    2
  )} ETB\nConsumption: ${consumption.toFixed(
    2
  )} m3\nCurrent Month Reading: ${currentReading}\nBill Generated Date: ${billGeneratedDate}\nDue Date: ${dueDate}\n\nWe recommend paying early to avoid delay and keep your service smooth.\n\nThank you,\nAquaConnect Team`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">Your Bill Is Ready</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">CURRENT BILL GENERATED</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0 0 12px 0; color: #2d3e50; font-size: 14px; line-height: 1.65;">Hello <strong>${customerName}</strong>, your bill for <strong>${cycleKey}</strong> is now generated.</p>
          <div style="margin-top: 6px; border: 1px solid #dbeaf8; border-radius: 10px; padding: 12px 14px; background: #f8fbff;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Amount Due:</strong> ${amountDue.toFixed(
              2
            )} ETB</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Consumption:</strong> ${consumption.toFixed(
              2
            )} m3</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Current Month Reading:</strong> ${currentReading}</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Bill Generated Date:</strong> ${billGeneratedDate}</p>
            <p style="margin: 0; font-size: 12px; color: #1f2937;"><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <div style="margin-top: 14px; border-left: 4px solid #1D9E75; background: #f0fdf4; border-radius: 8px; padding: 10px 12px;">
            <p style="margin: 0; font-size: 12px; color: #14532d; line-height: 1.6;"><strong>Recommendation:</strong> Please pay early to avoid delays and keep your account in good standing.</p>
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendBillingPaymentThankYouNotice(to, details = {}) {
  const customerName = String(details.customerName || 'Customer').trim();
  const amountPaid = Number(details.amountPaid || 0);
  const consumption = Number(details.consumption || 0);
  const currentReading = Number(details.currentReading || 0);
  const cycleKey = String(details.cycleKey || '').trim() || 'Current cycle';
  const billGeneratedDate = formatBillingEmailDate(details.billGeneratedDate || null);
  const paymentDate = formatBillingEmailDate(details.paymentDate || new Date());

  const subject = `AquaConnect Payment Received (${cycleKey})`;
  const text = `Hello ${customerName},\n\nThank you. Your payment has been received successfully.\n\nAmount Paid: ${amountPaid.toFixed(
    2
  )} ETB\nConsumption: ${consumption.toFixed(
    2
  )} m3\nCurrent Month Reading: ${currentReading}\nBill Generated Date: ${billGeneratedDate}\nPayment Date: ${paymentDate}\n\nThank you for paying on time.\n\nAquaConnect Team`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">Thank You For Your Payment</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">PAYMENT CONFIRMATION</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0 0 12px 0; color: #2d3e50; font-size: 14px; line-height: 1.65;">Hello <strong>${customerName}</strong>, we have successfully recorded your bill payment for <strong>${cycleKey}</strong>.</p>
          <div style="margin-top: 6px; border: 1px solid #dbeaf8; border-radius: 10px; padding: 12px 14px; background: #f8fbff;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Amount Paid:</strong> ${amountPaid.toFixed(
              2
            )} ETB</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Consumption:</strong> ${consumption.toFixed(
              2
            )} m3</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Current Month Reading:</strong> ${currentReading}</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1f2937;"><strong>Bill Generated Date:</strong> ${billGeneratedDate}</p>
            <p style="margin: 0; font-size: 12px; color: #1f2937;"><strong>Payment Date:</strong> ${paymentDate}</p>
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendBillingPaymentReminderNotice(to, details = {}) {
  const customerName = String(details.customerName || 'Customer').trim();
  const cycleKey = String(details.cycleKey || '').trim() || 'Current cycle';
  const amountDue = Number(details.amountDue || 0);
  const overdueDays = Number(details.overdueDays || 0);
  const stage = Number(details.stage || 1);
  const dueDate = formatBillingEmailDate(details.dueDate || null);
  const penaltyRatePercent = Number(details.penaltyRatePercent || 0);

  const subject =
    stage >= 3
      ? `AquaConnect Final Billing Warning (${cycleKey})`
      : `AquaConnect Billing Reminder (${cycleKey})`;

  const warningLine =
    stage >= 3
      ? 'This is now your third unpaid month. Please pay immediately to avoid administrative actions.'
      : 'Please pay your outstanding bill to keep your account in good standing.';

  const penaltyLine =
    stage >= 3
      ? `Daily late penalty is now active at ${penaltyRatePercent.toFixed(2)}% per day.`
      : 'No late penalty is applied during the first two unpaid months.';

  const text = `Hello ${customerName},\n\nYour bill for ${cycleKey} is still unpaid.\n\nAmount Due: ${amountDue.toFixed(
    2
  )} ETB\nDue Date: ${dueDate}\nOverdue Days: ${overdueDays}\n\n${warningLine}\n${penaltyLine}\n\nThank you,\nAquaConnect Team`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #EF9F27, #E24B4A, #EF9F27);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #fffaf5;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #b45309; font-weight: 800;">AQUACONNECT</p>
          <h2 style="margin: 8px 0 0 0; color: #7c2d12; font-size: 24px; line-height: 1.3;">${
            stage >= 3 ? 'Final Billing Warning' : 'Billing Payment Reminder'
          }</h2>
          <p style="margin: 8px 0 0 0; color: #7a5543; font-size: 12px; letter-spacing: 0.8px;">UNPAID BILL NOTICE</p>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0 0 12px 0; color: #2d3e50; font-size: 14px; line-height: 1.65;">Hello <strong>${customerName}</strong>, your bill for <strong>${cycleKey}</strong> is still unpaid.</p>
          <div style="margin-top: 6px; border: 1px solid #f3d3bf; border-radius: 10px; padding: 12px 14px; background: #fff7ed;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #7c2d12;"><strong>Amount Due:</strong> ${amountDue.toFixed(
              2
            )} ETB</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #7c2d12;"><strong>Due Date:</strong> ${dueDate}</p>
            <p style="margin: 0; font-size: 12px; color: #7c2d12;"><strong>Overdue Days:</strong> ${overdueDays}</p>
          </div>
          <div style="margin-top: 14px; border-left: 4px solid #E24B4A; background: #fff1f2; border-radius: 8px; padding: 10px 12px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #7f1d1d; line-height: 1.6;"><strong>Important:</strong> ${warningLine}</p>
            <p style="margin: 0; font-size: 12px; color: #7f1d1d; line-height: 1.6;">${penaltyLine}</p>
          </div>
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

function renderAquaTemplate({
  title,
  subtitle,
  intro,
  otp,
  otpColor = '#1D9E75',
  sections = [],
  notice,
  supportLine,
}) {
  const logoHtml = `
    <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <div style="width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #1D9E75, #2e86de); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(29, 158, 117, 0.35);">
        <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#ffffff" d="M12 2C9.2 5.2 6 8.6 6 12.1C6 15.5 8.7 18 12 18s6-2.5 6-5.9C18 8.6 14.8 5.2 12 2Zm0 14c-2.1 0-3.8-1.6-3.8-3.6c0-1.5 1-3.1 3.8-6.4c2.8 3.3 3.8 4.9 3.8 6.4c0 2-1.7 3.6-3.8 3.6Z"/>
          <circle cx="12" cy="12" r="2.1" fill="#7FE8FF"/>
        </svg>
      </div>
      <div>
        <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
        <p style="margin: 0; font-size: 11px; color: #5f6f80; letter-spacing: 0.6px;">CITY WATER PLATFORM</p>
      </div>
    </div>
  `;

  const sectionsHtml = sections
    .map(
      (section) => `
        <div style="margin: 14px 0; border: 1px solid ${
          section.borderColor || '#dbeaf8'
        }; border-radius: 10px; overflow: hidden;">
          <div style="height: 4px; background: ${section.barColor || '#2e86de'};"></div>
          <div style="padding: 12px 14px; background: ${
            section.bgColor || '#f8fbff'
          }; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: ${
              section.titleColor || '#1b4f72'
            };">${section.title}</p>
            ${section.bodyHtml}
          </div>
        </div>
      `
    )
    .join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          ${logoHtml}
          <h2 style="margin: 6px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">${title}</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">${subtitle}</p>
        </div>

        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0; color: #2d3e50; font-size: 14px; line-height: 1.6;">${intro}</p>

          <div style="margin: 16px 0; border: 1px dashed ${otpColor}; border-radius: 10px; padding: 16px; text-align: center; background: #fbfeff;">
            <p style="margin: 0; font-size: 12px; color: #607080; letter-spacing: 0.5px;">ONE-TIME PASSWORD</p>
            <p style="margin: 6px 0 0 0; font-size: 34px; font-weight: 800; color: ${otpColor}; letter-spacing: 6px;">${otp}</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #607080;">Valid for 10 minutes</p>
          </div>

          ${sectionsHtml}

          <div style="margin-top: 14px; border-left: 4px solid #f59e0b; background: #fffaef; border-radius: 8px; padding: 10px 12px;">
            <p style="margin: 0; font-size: 12px; color: #5f4a1c; line-height: 1.6;">${notice}</p>
          </div>

          <p style="margin: 14px 0 0 0; font-size: 12px; color: #6a7785;">${supportLine}</p>
        </div>

        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendOtp(to, otp) {
  const subject = 'Your AquaConnect OTP Code';
  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';
  const text = `Your One-Time Password (OTP) is: ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.`;
  const html = renderAquaTemplate({
    title: 'Email Verification',
    subtitle: 'SECURE ACCESS',
    intro: 'Use the OTP below to verify your AquaConnect account and continue securely.',
    otp,
    otpColor: '#1D9E75',
    sections: [
      {
        title: 'Security Reminder',
        bodyHtml:
          '<p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">Never share this OTP with anyone. AquaConnect staff will never ask for your OTP.</p>',
        barColor: '#1D9E75',
        borderColor: '#b9e7d8',
        bgColor: '#f3fdf8',
        titleColor: '#0f6a4d',
      },
    ],
    notice:
      'If you did not request this verification, please ignore this email. No further action is required.',
    supportLine: `Need help? Contact AquaConnect support at ${supportEmail}.`,
  });

  await sendEmail(to, subject, text, html);
}

export async function sendSuperAdminVerificationOtp(to, otpOrDetails) {
  const details =
    typeof otpOrDetails === 'string'
      ? { otp: otpOrDetails }
      : otpOrDetails && typeof otpOrDetails === 'object'
      ? otpOrDetails
      : {};

  const otp = details.otp || '';
  const fullName = details.fullName || '';
  const email = details.email || to;
  const phoneE164 = details.phoneE164 || '';
  const nationalId = details.nationalId || '';
  const password = details.password || '';
  const createdByName = details.createdByName || 'AquaConnect Super Admin';
  const createdByEmail = details.createdByEmail || 'Not available';
  const createdAt = details.createdAt ? new Date(details.createdAt) : new Date();
  const createdAtText = Number.isNaN(createdAt.getTime())
    ? new Date().toISOString()
    : createdAt.toISOString();
  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';

  const subject = 'AquaConnect Super Admin Verification OTP';

  const text = `Hello,

Your One-Time Password (OTP) for AquaConnect Super Admin email verification is: ${otp}

Login credentials and account details:
- Full name: ${fullName || 'Not available'}
- Email: ${email}
- Phone: ${phoneE164 || 'Not available'}
- National ID: ${nationalId || 'Not available'}
- Password: ${password || 'Use the password provided by your creator'}

Created by: ${createdByName} (${createdByEmail})
Created at: ${createdAtText}

This OTP is valid for 10 minutes. Please do not share it with anyone.

Privacy and legal notice: As a Super Admin, you are under legal consideration for all actions performed using your account.
For technical issues, contact support at ${supportEmail}.

This email was sent by AquaConnect. Please do not reply to this email.

Thank you,
AquaConnect Team`;

  const html = renderAquaTemplate({
    title: 'Super Admin Email Verification',
    subtitle: 'SUPER ADMIN PORTAL',
    intro:
      'Welcome to AquaConnect administration. Verify your account using the OTP below before first sign in.',
    otp,
    otpColor: '#2e86de',
    sections: [
      {
        title: 'Login Credentials and Account Details',
        bodyHtml: `
          <p style="margin: 4px 0; color: #1f2937;"><strong>Full name:</strong> ${
            fullName || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Phone:</strong> ${
            phoneE164 || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>National ID:</strong> ${
            nationalId || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Password:</strong> ${
            password || 'Use the password provided by your creator'
          }</p>
        `,
        barColor: '#2e86de',
        borderColor: '#cfe4f8',
        bgColor: '#f5faff',
        titleColor: '#1e6091',
      },
      {
        title: 'Creation Metadata',
        bodyHtml: `
          <p style="margin: 4px 0; color: #1f2937;"><strong>Created by:</strong> ${createdByName} (${createdByEmail})</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Created at:</strong> ${createdAtText}</p>
        `,
        barColor: '#1D9E75',
        borderColor: '#b9e7d8',
        bgColor: '#f3fdf8',
        titleColor: '#0f6a4d',
      },
    ],
    notice:
      'Privacy and Legal Notice: As a Super Admin, you are under legal consideration for all actions performed using your account. For technical issues, contact support.',
    supportLine: `For further details, contact AquaConnect at ${supportEmail}.`,
  });

  await sendEmail(to, subject, text, html);
}

export async function sendAdminVerificationOtp(to, otpOrDetails) {
  const details =
    typeof otpOrDetails === 'string'
      ? { otp: otpOrDetails }
      : otpOrDetails && typeof otpOrDetails === 'object'
      ? otpOrDetails
      : {};

  const otp = details.otp || '';
  const role = details.role || 'SUBCITY_ADMIN';
  const roleLabelMap = {
    WOREDA_ADMINS: 'Woreda Admin',
    SUBCITY_ADMIN: 'Subcity Admin',
    SUBCITY_BILLING_OFFICER: 'Subcity Billing Officer',
    SUBCITY_COMPLAINT_OFFICER: 'Subcity Complaint Officer',
    WOREDA_BILLING_OFFICER: 'Woreda Billing Officer',
    WOREDA_COMPLAINT_OFFICER: 'Woreda Complaint Officer',
  };
  const roleLabel = roleLabelMap[role] || 'Subcity Admin';
  const fullName = details.fullName || '';
  const email = details.email || to;
  const phoneE164 = details.phoneE164 || '';
  const nationalId = details.nationalId || '';
  const password = details.password || '';
  const assignedByName =
    details.assignedByName || details.createdByName || 'AquaConnect Super Admin';
  const assignedByEmail = details.assignedByEmail || details.createdByEmail || 'Not available';
  const assignedByPhone = details.assignedByPhone || 'Not available';
  const assignedByNationalId = details.assignedByNationalId || 'Not available';
  const assignedAt = details.assignedAt || details.createdAt;
  const assignedAtDate = assignedAt ? new Date(assignedAt) : new Date();
  const assignedAtText = Number.isNaN(assignedAtDate.getTime())
    ? new Date().toISOString()
    : assignedAtDate.toISOString();
  const assignedSubCity = details.assignedSubCity || 'Not assigned';
  const assignedWoreda = details.assignedWoreda || 'Not assigned';
  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';

  const subject = `AquaConnect ${roleLabel} Verification OTP`;
  const text = `Hello,

Verification code: ${otp || 'N/A'}

Account details:
- Position: ${roleLabel}
- Full name: ${fullName || 'Not available'}
- Email: ${email}
- Phone: ${phoneE164 || 'Not available'}
- National ID: ${nationalId || 'Not available'}
- Password: ${password || 'Use the password provided by your creator'}
- Assigned subcity: ${assignedSubCity}
- Assigned woreda: ${assignedWoreda}
- Assigned date: ${assignedAtText}

Assigned by: ${assignedByName}
Assigned by email: ${assignedByEmail}
Assigned by phone: ${assignedByPhone}
Assigned by national ID: ${assignedByNationalId}

Terms and conditions:
- You are responsible for all actions done using this account.
- Keep credentials private and change your password after first login.
- Follow AquaConnect operational and data privacy policies.

Next step: proceed to verify your email using this OTP before first sign in.

This OTP is valid for 10 minutes. Please do not share it with anyone.
If this account was not expected, contact support immediately: ${supportEmail}

Thank you,
AquaConnect Team`;

  const html = renderAquaTemplate({
    title: `${roleLabel} Verification`,
    subtitle: 'AQUACONNECT OPERATIONS ACCESS',
    intro:
      'Your admin account has been created successfully. Use the verification code below to activate email verification before your first secure sign-in.',
    otp,
    otpColor: '#0d9488',
    sections: [
      {
        title: `${roleLabel} Account Snapshot`,
        bodyHtml: `
          <p style="margin: 4px 0; color: #1f2937;"><strong>Position:</strong> ${roleLabel}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Full name:</strong> ${
            fullName || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Phone:</strong> ${
            phoneE164 || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>National ID:</strong> ${
            nationalId || 'Not available'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Password:</strong> ${
            password || 'Use the password provided by your creator'
          }</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned subcity:</strong> ${assignedSubCity}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned woreda:</strong> ${assignedWoreda}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned date:</strong> ${assignedAtText}</p>
        `,
        barColor: '#0ea5e9',
        borderColor: '#bae6fd',
        bgColor: '#f0f9ff',
        titleColor: '#075985',
      },
      {
        title: 'Assignment Details',
        bodyHtml: `
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned by:</strong> ${assignedByName}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned by email:</strong> ${assignedByEmail}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned by phone:</strong> ${assignedByPhone}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned by national ID:</strong> ${assignedByNationalId}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Assigned date:</strong> ${assignedAtText}</p>
          <p style="margin: 4px 0; color: #1f2937;"><strong>Platform:</strong> AquaConnect City Water Management</p>
        `,
        barColor: '#14b8a6',
        borderColor: '#99f6e4',
        bgColor: '#f0fdfa',
        titleColor: '#115e59',
      },
      {
        title: 'Terms and Verification',
        bodyHtml: `
          <p style="margin: 4px 0; color: #1f2937;">By using this account, you accept AquaConnect terms and operational responsibility.</p>
          <ul style="margin: 8px 0 0 18px; padding: 0; color: #1f2937;">
            <li style="margin: 4px 0;">Do not share credentials or OTP.</li>
            <li style="margin: 4px 0;">Change your password after first login.</li>
            <li style="margin: 4px 0;">Proceed to verify your email before using the dashboard.</li>
          </ul>
        `,
        barColor: '#f59e0b',
        borderColor: '#fde68a',
        bgColor: '#fffbeb',
        titleColor: '#92400e',
      },
    ],
    notice:
      'Security Notice: This OTP is confidential and expires in 10 minutes. AquaConnect support will never ask for your OTP. Verify your email before first sign in.',
    supportLine: `Need assistance? Contact AquaConnect support at ${supportEmail}.`,
  });

  await sendEmail(to, subject, text, html);
}

export async function sendOcrWindowOpenedNotice(to, details = {}) {
  const startDate = details.startDate ? new Date(details.startDate) : null;
  const closeDate = details.closeDate ? new Date(details.closeDate) : null;

  const isStartValid = startDate && !Number.isNaN(startDate.getTime());
  const isCloseValid = closeDate && !Number.isNaN(closeDate.getTime());

  const formatDate = (value) =>
    value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const openDateLabel = isStartValid ? formatDate(startDate) : 'Scheduled by administrator';
  const closeDateLabel = isCloseValid ? formatDate(closeDate) : 'Scheduled by administrator';
  const openDateEthiopian = String(details.startDateEthiopian || 'Scheduled by administrator');
  const closeDateEthiopian = String(details.closeDateEthiopian || 'Scheduled by administrator');

  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';

  const subject = 'AquaConnect OCR Open Window Time';

  const text = `Dear Valued Customer,

We are pleased to inform you that the OCR meter reading window is now open.

The scanning period will remain active from ${openDateLabel} (${openDateEthiopian}) until ${closeDateLabel} (${closeDateEthiopian}). During this time, you are required to scan and submit your meter reading using the system.

We kindly advise you to complete the scanning process within the designated time window. Prompt submission will help you avoid late penalty charges and ensure efficient service delivery.

Please do not delay or postpone the process, as late submissions may result in inconvenience and additional costs.

ክቡር ደንበኛ,

የOCR የሜትር ንባብ መስኮት አሁን ተከፍቷል።

የስካን ጊዜው ከ ${openDateLabel} (${openDateEthiopian}) እስከ ${closeDateLabel} (${closeDateEthiopian}) ድረስ ይቆያል።

እባክዎ በተወሰነው ጊዜ ውስጥ ንባብዎን ያስገቡ ቅጣትን ለመከላከል።

Thank you for your cooperation.

Sincerely,
Aquaconnect Team`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #1D9E75, #2e86de); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(29, 158, 117, 0.35);">
              <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#ffffff" d="M12 2C9.2 5.2 6 8.6 6 12.1C6 15.5 8.7 18 12 18s6-2.5 6-5.9C18 8.6 14.8 5.2 12 2Zm0 14c-2.1 0-3.8-1.6-3.8-3.6c0-1.5 1-3.1 3.8-6.4c2.8 3.3 3.8 4.9 3.8 6.4c0 2-1.7 3.6-3.8 3.6Z"/>
                <circle cx="12" cy="12" r="2.1" fill="#7FE8FF"/>
              </svg>
            </div>
            <div>
              <p style="margin: 0; font-size: 11px; letter-spacing: 1.6px; color: #1D9E75; font-weight: 800;">AQUACONNECT</p>
              <p style="margin: 0; font-size: 11px; color: #5f6f80; letter-spacing: 0.6px;">CITY WATER PLATFORM</p>
            </div>
          </div>
          <h2 style="margin: 6px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">OCR Open Window Time</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">METER READING SUBMISSION WINDOW</p>
        </div>

        <div style="padding: 20px 24px 24px 24px; color: #2d3e50; font-size: 14px; line-height: 1.65;">
          <p style="margin: 0 0 12px 0;">Dear Valued Customer,</p>
          <p style="margin: 0 0 12px 0;">We are pleased to inform you that the OCR meter reading window is now open.</p>

          <div style="margin: 14px 0; border: 1px solid #d1e9f8; border-radius: 10px; overflow: hidden;">
            <div style="height: 4px; background: #2e86de;"></div>
            <div style="padding: 12px 14px; background: #f8fbff; text-align: left;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #1e6091;">Scanning Period</p>
              <p style="margin: 0; color: #1f2937;"><strong>Start Date (Gregorian):</strong> ${openDateLabel}</p>
              <p style="margin: 4px 0 0 0; color: #1f2937;"><strong>Start Date (Ethiopian):</strong> ${openDateEthiopian}</p>
              <p style="margin: 4px 0 0 0; color: #1f2937;"><strong>Closing Date (Gregorian):</strong> ${closeDateLabel}</p>
              <p style="margin: 4px 0 0 0; color: #1f2937;"><strong>Closing Date (Ethiopian):</strong> ${closeDateEthiopian}</p>
            </div>
          </div>

          <p style="margin: 0 0 12px 0;">The scanning period will remain active from the start date set by the Super Administrator until the specified closing date. During this time, you are required to scan and submit your meter reading using the system.</p>
          <p style="margin: 0 0 12px 0;">We kindly advise you to complete the scanning process within the designated time window. Prompt submission will help you avoid late penalty charges and ensure efficient service delivery.</p>
          <p style="margin: 0 0 12px 0;">Please do not delay or postpone the process, as late submissions may result in inconvenience and additional costs.</p>
          <hr style="border: none; border-top: 1px solid #d7e1ea; margin: 14px 0;" />
          <p style="margin: 0 0 12px 0;">ክቡር ደንበኛ, የOCR የሜትር ንባብ መስኮት አሁን ተከፍቷል።</p>
          <p style="margin: 0 0 12px 0;">የስካን ጊዜው ከ ${openDateLabel} (${openDateEthiopian}) እስከ ${closeDateLabel} (${closeDateEthiopian}) ድረስ ይቆያል።</p>
          <p style="margin: 0 0 12px 0;">እባክዎ በተወሰነው ጊዜ ውስጥ ንባብዎን ያስገቡ ቅጣትን ለመከላከል።</p>
          <p style="margin: 0;">Thank you for your cooperation.</p>

          <p style="margin: 16px 0 0 0;">Sincerely,<br/>Aquaconnect Team</p>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6a7785;">Need help? Contact AquaConnect support at ${supportEmail}.</p>
        </div>

        <div style="padding: 14px 24px; border-top: 1px solid #e8eef4; background: #f9fcff;">
          <p style="margin: 0; font-size: 11px; color: #7a8796;">This email was sent by AquaConnect. Please do not reply directly to this message.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendOcrWindowReminderNotice(to, details = {}) {
  const closeDate = details.closeDate ? new Date(details.closeDate) : null;
  const isCloseValid = closeDate && !Number.isNaN(closeDate.getTime());
  const daysRemaining = Number(details.daysRemaining || 0);

  const closeDateGregorian = isCloseValid
    ? closeDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not available';
  const closeDateEthiopian = String(details.closeDateEthiopian || 'Not available');

  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';

  const subject = `AquaConnect OCR Reminder: ${daysRemaining} day(s) remaining`;

  const text = `Dear Customer,

This is a reminder that the OCR meter reading window will close in ${daysRemaining} day(s).

Closing Date (Gregorian): ${closeDateGregorian}
Closing Date (Ethiopian): ${closeDateEthiopian}

ክቡር ደንበኛ,

የOCR የሜትር ንባብ መስኮት በ${daysRemaining} ቀን(ቀናት) ውስጥ ይዘጋል።

የመዝጊያ ቀን (Gregorian): ${closeDateGregorian}
የመዝጊያ ቀን (Ethiopian): ${closeDateEthiopian}

Please scan and submit your meter reading before the deadline to avoid penalty.
እባክዎ ቅጣት እንዳይደርስብዎ ከመዝጊያው በፊት የሜትር ንባብዎን ያስገቡ።

Support: ${supportEmail}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #1D9E75, #2e86de, #1D9E75);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #f9fcff;">
          <h2 style="margin: 6px 0 0 0; color: #17324d; font-size: 24px; line-height: 1.3;">OCR Reminder / የOCR ማስታወሻ</h2>
          <p style="margin: 8px 0 0 0; color: #526273; font-size: 12px; letter-spacing: 0.8px;">${daysRemaining} DAY(S) REMAINING</p>
        </div>
        <div style="padding: 20px 24px 24px 24px; color: #2d3e50; font-size: 14px; line-height: 1.65;">
          <p style="margin: 0 0 12px 0;">Dear Customer,</p>
          <p style="margin: 0 0 12px 0;">The OCR meter reading window will close in <strong>${daysRemaining}</strong> day(s).</p>
          <p style="margin: 0 0 12px 0;">Closing Date (Gregorian): <strong>${closeDateGregorian}</strong></p>
          <p style="margin: 0 0 12px 0;">Closing Date (Ethiopian): <strong>${closeDateEthiopian}</strong></p>

          <hr style="border: none; border-top: 1px solid #d7e1ea; margin: 14px 0;" />

          <p style="margin: 0 0 12px 0;">ክቡር ደንበኛ,</p>
          <p style="margin: 0 0 12px 0;">የOCR የሜትር ንባብ መስኮት በ<strong>${daysRemaining}</strong> ቀን(ቀናት) ውስጥ ይዘጋል።</p>
          <p style="margin: 0 0 12px 0;">የመዝጊያ ቀን (Gregorian): <strong>${closeDateGregorian}</strong></p>
          <p style="margin: 0 0 12px 0;">የመዝጊያ ቀን (Ethiopian): <strong>${closeDateEthiopian}</strong></p>

          <p style="margin: 0 0 12px 0;">Please scan and submit your meter reading before the deadline to avoid penalty.</p>
          <p style="margin: 0;">እባክዎ ቅጣት እንዳይደርስብዎ ከመዝጊያው በፊት የሜትር ንባብዎን ያስገቡ።</p>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6a7785;">Need help? Contact AquaConnect support at ${supportEmail}.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendOcrWindowClosedNotice(to, details = {}) {
  const closeDate = details.closeDate ? new Date(details.closeDate) : null;
  const isCloseValid = closeDate && !Number.isNaN(closeDate.getTime());

  const closeDateGregorian = isCloseValid
    ? closeDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not available';
  const closeDateEthiopian = String(details.closeDateEthiopian || 'Not available');

  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';

  const subject = 'AquaConnect OCR Window Closed';

  const text = `Dear Customer,

The OCR schedule has expired and the scanning window is now closed.

Closed On (Gregorian): ${closeDateGregorian}
Closed On (Ethiopian): ${closeDateEthiopian}

Please apply for late registration, then scan and pay your bill.

ውድ ደንበኛ,

የOCR ፕሮግራሙ ጊዜ አልፎአል እና የስካን መስኮቱ ተዘግቷል።

የተዘጋበት ቀን (Gregorian): ${closeDateGregorian}
የተዘጋበት ቀን (Ethiopian): ${closeDateEthiopian}

እባክዎ የዘገየ ምዝገባ ያመልክቱ እና ከዚያ ስካን አድርገው ክፍያዎን ይፈጽሙ።

Support: ${supportEmail}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #eef3f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #d7e1ea; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(6, 32, 62, 0.12);">
        <div style="height: 6px; background: linear-gradient(90deg, #f97316, #ef4444, #f97316);"></div>
        <div style="padding: 22px 24px 16px 24px; border-bottom: 1px solid #e8eef4; background: #fff7ed;">
          <h2 style="margin: 6px 0 0 0; color: #7c2d12; font-size: 24px; line-height: 1.3;">OCR Window Closed / የOCR መስኮት ተዘግቷል</h2>
        </div>
        <div style="padding: 20px 24px 24px 24px; color: #2d3e50; font-size: 14px; line-height: 1.65;">
          <p style="margin: 0 0 12px 0;">The OCR schedule has expired and the scanning window is now closed.</p>
          <p style="margin: 0 0 12px 0;">Closed On (Gregorian): <strong>${closeDateGregorian}</strong></p>
          <p style="margin: 0 0 12px 0;">Closed On (Ethiopian): <strong>${closeDateEthiopian}</strong></p>
          <p style="margin: 0 0 12px 0;">Please apply for late registration, then scan and pay your bill.</p>

          <hr style="border: none; border-top: 1px solid #d7e1ea; margin: 14px 0;" />

          <p style="margin: 0 0 12px 0;">የOCR ፕሮግራሙ ጊዜ አልፎአል እና የስካን መስኮቱ ተዘግቷል።</p>
          <p style="margin: 0 0 12px 0;">የተዘጋበት ቀን (Gregorian): <strong>${closeDateGregorian}</strong></p>
          <p style="margin: 0 0 12px 0;">የተዘጋበት ቀን (Ethiopian): <strong>${closeDateEthiopian}</strong></p>
          <p style="margin: 0;">እባክዎ የዘገየ ምዝገባ ያመልክቱ እና ከዚያ ስካን አድርገው ክፍያዎን ይፈጽሙ።</p>

          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6a7785;">Need help? Contact AquaConnect support at ${supportEmail}.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
}

export async function sendPasswordResetOtp(to, otp) {
  const subject = 'AquaConnect Password Reset OTP';
  const supportEmail =
    process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@aquaconnect.com';
  const text = `Your password reset OTP is: ${otp}. This OTP is valid for 10 minutes. If you did not request this, ignore this email.`;
  const html = renderAquaTemplate({
    title: 'Password Reset Request',
    subtitle: 'ACCOUNT SECURITY',
    intro: 'We received a request to reset your AquaConnect password. Use this OTP to continue.',
    otp,
    otpColor: '#d97706',
    sections: [
      {
        title: 'Important',
        bodyHtml:
          '<p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">This OTP can only be used once and will expire in 10 minutes.</p>',
        barColor: '#d97706',
        borderColor: '#f5d0a9',
        bgColor: '#fff8f1',
        titleColor: '#9a4d00',
      },
    ],
    notice:
      'If you did not request a password reset, ignore this email and your current password will remain unchanged.',
    supportLine: `Need help? Contact AquaConnect support at ${supportEmail}.`,
  });

  await sendEmail(to, subject, text, html);
}
