export const metadata = { title: "Global Compliance Copilot" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, Arial, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
