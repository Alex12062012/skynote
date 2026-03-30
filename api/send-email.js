export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { to, subject, htmlContent } = req.body;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "SkyNote", email: "ton-email@domaine.com" },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
