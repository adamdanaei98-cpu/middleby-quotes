// app/layout.js
import './globals.css';
export const metadata = { title: 'Middleby QuoteCraft', description: 'Quote Management System' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" /></head>
      <body>{children}</body>
    </html>
  );
}
