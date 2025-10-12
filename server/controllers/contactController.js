import nodemailer from "nodemailer";

export const sendContactQuery = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASSWORD, // your app password
      },
    });

    await transporter.sendMail({
      from: `"YesITryMe Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: `New Contact Query from ${name}`,
      html: `
        <h3>New Contact Query</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    res.json({
      message: "Your message has been sent. We'll get back to you soon!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to send email.", error: error.message });
  }
};
