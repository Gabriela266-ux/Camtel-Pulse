const nodemailer = require('nodemailer');

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isEmailSimulation = isTest || (isDevelopment && process.env.EMAIL_MODE !== 'production');

let transporter;

function getTransporter() {
    if (transporter) return transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    return transporter;
}

function logEmail({ to, subject, text }) {
    console.log('\n========================================');
    console.log('[DEV EMAIL] Mode développement activé');
    console.log('----------------------------------------');
    console.log(`Destinataire : ${to}`);
    console.log(`Sujet       : ${subject}`);
    console.log('----------------------------------------');
    console.log(text);
    console.log('========================================\n');
}

async function sendAccountDecision({ email, name, approved, temporaryPassword }) {
    const subject = approved ?
        'Validation de votre accès - Financial Pulse by Camtel' :
        'Décision concernant votre demande d\u2019accès - Financial Pulse by Camtel';

    const text = approved ?
        `Votre demande a été validée et bienvenue sur Financial Pulse by Camtel. Voici votre mot de passe temporaire pour vous connecter : ${temporaryPassword}.` :
        `Votre demande a été refusée.`;

    if (isEmailSimulation) {
        logEmail({ to: email, subject, text });
        return { sent: true, simulated: true, reason: 'dev_mode' };
    }

    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[EMAIL] SMTP non configure: notification non envoyee pour', email);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EMAIL] Notification failed for', email, error.message);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'send_failed' };
    }
}

async function sendAccountCreated({ email, name, temporaryPassword }) {
    const subject = 'Création de votre compte - Financial Pulse by Camtel';
    const text = `Bonjour ${name || ''},\n\nVotre compte Financial Pulse by Camtel a été créé par l’administration. Votre mot de passe temporaire est : ${temporaryPassword}. Vous devrez le modifier lors de votre première connexion.`;

    if (isEmailSimulation) {
        logEmail({ to: email, subject, text });
        return { sent: true, simulated: true, reason: 'dev_mode' };
    }

    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[EMAIL] SMTP non configure: notification non envoyee pour', email);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EMAIL] Notification failed for', email, error.message);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'send_failed' };
    }
}

async function sendPasswordResetRequested({ email, name }) {
    const subject = 'Demande de réinitialisation reçue - Financial Pulse by Camtel';
    const text = `Bonjour ${name || ''},\n\nNous confirmons la réception de votre demande de réinitialisation de mot de passe. Aucun mot de passe n’a encore été modifié. Un administrateur doit d’abord valider la demande.\n\nSi vous n’êtes pas à l’origine de cette demande, contactez immédiatement l’administration.`;

    if (isEmailSimulation) {
        logEmail({ to: email, subject, text });
        return { sent: true, simulated: true, reason: 'dev_mode' };
    }
    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[EMAIL] SMTP non configure: confirmation non envoyee pour', email);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'smtp_not_configured' };
    }
    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EMAIL] Password reset request notification failed for', email, error.message);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'send_failed' };
    }
}

async function sendPasswordResetCompleted({ email, name, temporaryPassword }) {
    const subject = 'Nouveau mot de passe temporaire - Financial Pulse by Camtel';
    const text = `Bonjour ${name || ''},\n\nVotre demande a été validée par l’administration. Votre nouveau mot de passe temporaire est : ${temporaryPassword}.\n\nVous devrez obligatoirement le modifier lors de votre prochaine connexion. Si vous n’êtes pas à l’origine de cette demande, contactez immédiatement l’administration.`;

    if (isEmailSimulation) {
        logEmail({ to: email, subject, text });
        return { sent: true, simulated: true, reason: 'dev_mode' };
    }
    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[EMAIL] SMTP non configure: mot de passe non envoye pour', email);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'smtp_not_configured' };
    }
    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EMAIL] Password reset completion notification failed for', email, error.message);
        logEmail({ to: email, subject, text });
        return { sent: false, reason: 'send_failed' };
    }
}

// Message libre envoye par l'administrateur a un utilisateur.
async function sendUserMessage({ toEmail, toName, fromName, message }) {
    const subject = `Message de l'administration - Financial Pulse by Camtel`;
    const text = `Bonjour ${toName || ''},\n\n${message}\n\nCordialement,\n${fromName || 'L\'administration'}\nFinancial Pulse by Camtel`;

    if (isEmailSimulation) {
        logEmail({ to: toEmail, subject, text });
        return { sent: true, simulated: true, reason: 'dev_mode' };
    }

    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[EMAIL] SMTP non configure: message non envoye pour', toEmail);
        logEmail({ to: toEmail, subject, text });
        return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            replyTo: process.env.SMTP_FROM || process.env.SMTP_USER,
            subject,
            text,
        });
        return { sent: true };
    } catch (error) {
        console.error('[EMAIL] Message failed for', toEmail, error.message);
        logEmail({ to: toEmail, subject, text });
        return { sent: false, reason: 'send_failed', error: error.message };
    }
}

module.exports = {
    sendAccountDecision,
    sendAccountCreated,
    sendPasswordResetRequested,
    sendPasswordResetCompleted,
    sendUserMessage
};
