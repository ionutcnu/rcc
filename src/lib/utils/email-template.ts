// src/Utils/email-template.ts
export const generateCatInquiryTemplate = ({
                                               firstName,
                                               lastName,
                                               email,
                                               message,
                                           }: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}) => `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#1C1C21; color:white; padding:20px;">
    <div style="max-width:600px; margin:auto; background-color:#2A2A2E; border-radius:8px; overflow:hidden;">
      <div style="background-color:#7C3AED; padding:20px; text-align:center;">
        <h2 style="margin:0; color:white;">🐱 RCC Cat Inquiry</h2>
      </div>
      <div style="padding:20px;">
        <p style="font-size:16px;">You have a new inquiry from <strong>${firstName} ${lastName}</strong>.</p>
        <p style="font-size:16px;"><strong>Email:</strong> <a style="color:#7C3AED;" href="mailto:${email}">${email}</a></p>
        <p style="font-size:16px;"><strong>Message:</strong></p>
        <p style="font-size:16px; background-color:#3E3E42; padding:10px; border-radius:4px;">${message}</p>
        <a href="mailto:${email}" 
           style="display:inline-block; margin-top:20px; padding:12px 24px; color:white; background-color:#7C3AED; text-decoration:none; border-radius:6px;">
          Reply to Customer
        </a>
      </div>
      <div style="padding:10px; text-align:center; font-size:12px; color:#aaa;">
        © 2025 RCC | All rights reserved
      </div>
    </div>
  </body>
</html>
`;
