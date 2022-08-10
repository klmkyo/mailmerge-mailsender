import nodemailer from "nodemailer";
import { prisma } from "./prisma.js";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
    }
});
export const addTracker = (email) => {
    // copiloted
    // const trackedBody = email.body.replace(/\n/g, "<br>");
    const trackedBody = email.body;
    const tracker = `<img src="${process.env.DEPLOY_URL}/api/img/${email.id}" width="1" height="1" style="display:none">`;
    return `${trackedBody}${tracker}`;
};
export async function sendUnsentEmails() {
    const unsentEmails = await prisma.email.findMany({
        where: {
            toBeSentAt: {
                lte: new Date(),
            },
            // don't select userID, since we will be sending all emails, regardless of user
            // user: {
            //   id: ctx.session.user.id,
            // },
            // VERY IMPORTANT: this is to prevent sending the same email twice
            sentAt: null,
        },
    });
    if (unsentEmails.length === 0) {
        console.log("📭 No unsent emails in queue");
        return;
    }
    else {
        console.log(`📬 Sending ${unsentEmails.length} unsent emails...`);
    }
    // double check: if there is an email that has already been sent, throw an error
    // check by seeing if sentAt and sentTo are null
    unsentEmails.forEach((unsentEmail) => {
        if (unsentEmail.sentAt || unsentEmail.sentTo) {
            throw "Spróbowano wysłać wysłane już maile, co nie powinno się zdarzyć";
        }
    });
    // group emails by user
    let emailsByUser = {};
    unsentEmails.forEach((unsentEmail) => {
        // initialize the array for user key if it doesn't exist
        if (!emailsByUser[unsentEmail.userId]) {
            emailsByUser[unsentEmail.userId] = [];
        }
        // add the email to the array
        emailsByUser[unsentEmail.userId].push(unsentEmail);
    });
    // send emails logic
    // for each user
    const sendPromises = Object.entries(emailsByUser).map(async ([userId, emails]) => {
        // get user refresh token and email
        const { refreshToken, email: senderEmail } = await prisma.gmailSettings.findFirstOrThrow({
            where: {
                user: {
                    id: userId,
                },
            },
        });
        console.log(`// User ${userId} has ${emails.length} emails to send`);
        // send emails
        for (const email of emails) {
            // add tracker to email body
            const trackedBody = addTracker(email);
            const mailOptions = {
                from: senderEmail,
                to: email.toBeSentTo,
                subject: email.subject,
                html: trackedBody,
                auth: {
                    user: senderEmail,
                    refreshToken: refreshToken
                }
            };
            // check if the email has not been sent one last time
            const dbEmail = await prisma.email.findUniqueOrThrow({
                where: {
                    id: email.id,
                },
                select: {
                    sentAt: true,
                    sentTo: true,
                },
            });
            if (dbEmail.sentAt || dbEmail.sentTo) {
                throw "Spróbowano wysłać wysłane już maile, co nie powinno się zdarzyć (Check II stopnia)";
            }
            // update the email to indicate it has been sent
            // do it before the email is actually sent (better safe than sorry)
            await prisma.email.update({
                where: {
                    id: email.id,
                },
                data: {
                    sentAt: new Date(),
                    sentTo: email.toBeSentTo,
                },
            });
            console.log(`Sending email from ${senderEmail} to ${email.toBeSentTo} | ${email.subject} | ${email.id}...`);
            await smtpTransport.sendMail(mailOptions);
            console.log(` - sent!`);
        }
    });
    await Promise.all(sendPromises);
    console.log("📬 All emails sent");
}
