
export const emailTemplate = ({ title, message }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px 20px;
                text-align: center;
                color: #ffffff;
            }
            .email-header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .email-body {
                padding: 40px 30px;
            }
            .email-body h2 {
                color: #333;
                margin-top: 0;
                font-size: 22px;
            }
            .email-body p {
                color: #666;
                margin: 15px 0;
                font-size: 16px;
            }
            .cta-button {
                display: inline-block;
                margin: 30px 0;
                padding: 14px 32px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .email-footer {
                background-color: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                font-size: 14px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }
            .email-footer p {
                margin: 5px 0;
            }
            .divider {
                height: 1px;
                background-color: #e9ecef;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>MeetAI</h1>
            </div>
            <div class="email-body">
                <h2>${title}</h2>
                <p>${message}</p>
                
                <div class="divider"></div>
                
            </div>
            <div class="email-footer">
                <p>© ${new Date().getFullYear()} MeetAI. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

