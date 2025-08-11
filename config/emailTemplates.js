export const htmlEmailTemplate = (message) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Email Template</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f7;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background-color:rgb(13, 69, 253);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px 20px;
          color: #333;
          font-size: 16px;
          line-height: 1.8;
        }
        .footer {
          text-align: center;
          font-size: 13px;
          padding: 20px;
          color: #6c757d;
          background-color: #f1f3f5;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #0d6efd;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
        }
        @media (max-width: 600px) {
          .content, .header, .footer {
            padding: 15px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Price Signal | Sharplogicians</h1>
        </div>
        <div class="content">
          ${message}
        </div>
        <div class="footer">
          <p>If you didn't request this email, please disregard it.</p>
          <p>© ${new Date().getFullYear()} Price Signal | Sharplogicians.com All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 
