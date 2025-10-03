export const metadata = { title: "Global Compliance Copilot" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ 
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        margin: 0, 
        background: "#f8fafc",
        color: "#1f2937"
      }}>
        {children}
      </body>
    </html>
  );
}



