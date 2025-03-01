// const Groq = require("groq-sdk");

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const { messages } = req.body;

//   try {
//     const chatCompletion = await groq.chat.completions.create({
//       messages: messages || [],
//       model: "llama-3.3-70b-versatile",
//       temperature: 1,
//       max_completion_tokens: 1024,
//       top_p: 1,
//       stream: true,
//       stop: null,
//     });

//     res.writeHead(200, {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     });

//     for await (const chunk of chatCompletion) {
//       const content = chunk.choices[0]?.delta?.content || "";
//       res.write(`data: ${JSON.stringify({ content })}\n\n`);
//     }

//     res.end();
//   } catch (error) {
//     console.error("Groq API error:", error);
//     res.status(500).json({ error: "Failed to process request" });
//   }
// }
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  // Add a system message to guide the model
  const enhancedMessages = [
    {
      role: "system",
      content:
        "You are a helpful AI that formats code snippets in responses using triple backticks (```) when code is provided in the input or when generating code. Ensure the language is specified after the opening backticks (e.g., ```javascript).",
    },
    ...messages,
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: enhancedMessages || [],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null,
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error("Groq API error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
}
