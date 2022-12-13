const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
  try {
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.SMTP_EMAIL,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // });

    // const message = {
    //   from: process.env.FROM_EMAIL,
    //   to: options.email,
    //   subject: options.subject,
    //   text: options.message,
    // };

    // await transporter.sendMail(message);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: options.email, // Change to your recipient
      from: {
        email: process.env.SMTP_EMAIL,
        name: 'Chat App',
      }, // Change to your verified sender
      templateId: 'd-23142240b4b143a583a9de8ced6746c5',
      dynamicTemplateData: {
        inviteLink: options.inviteLink,
      },
    };
    console.log(msg);
    sgMail.send(msg).then(() => {
      console.log('Email sent');
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
