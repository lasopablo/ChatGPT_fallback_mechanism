import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { serialize, parse } from 'cookie';
import * as T from '@effect-ts/core/Effect';
import * as E from '@effect-ts/core/Effect/Exit';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

const fetchOpenAI = (options: any) =>
  T.effectAsync<unknown, Error, any>((cb) =>
    fetch(OPENAI_API_URL, options)
      .then(async (response) => {
        const responseBody = await response.text();
        if (!response.ok) {
          const error = JSON.parse(responseBody).error;
          cb(T.fail(new Error(`OpenAI API request failed with status ${response.status}: ${error.message}`)));
        } else {
          cb(T.succeed(JSON.parse(responseBody)));
        }
      })
      .catch((error) => cb(T.fail(error)))
  );

const fetchGemini = (conversation: string) =>
  T.effectAsync<unknown, Error, any>((cb) =>
    fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: conversation }] }] }),
    })
      .then(async (response) => {
        const responseBody = await response.text();
        if (!response.ok) {
          cb(T.fail(new Error(`Gemini API request failed with status ${response.status}: ${responseBody}`)));
        } else {
          cb(T.succeed(JSON.parse(responseBody)));
        }
      })
      .catch((error) => cb(T.fail(error)))
  );

const fetchWithFallback = (options: any, conversation: string) =>
  T.catchAll_(fetchOpenAI(options), () => fetchGemini(conversation));

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { message, newChat, userName, userProblem } = req.body;

  if (newChat) {
    res.setHeader('Set-Cookie', [
      serialize('sessionId', '', { path: '/', expires: new Date(0) }),
      serialize('conversationHistory', '', { path: '/', expires: new Date(0) }),
    ]);
    res.status(200).json({ response: 'Chat reset' });
    return;
  }

  const cookies = parse(req.headers.cookie || '');
  const sessionId = cookies.sessionId || Date.now().toString();
  const conversationHistoryEncoded = cookies[`conversation-${sessionId}`] || '';
  const conversationHistory = conversationHistoryEncoded
    ? Buffer.from(conversationHistoryEncoded, 'base64').toString('utf-8')
    : '';

  const initialMessage = `You are a customer support agent. This consumer identified as ${userName} described their problem as: ${userProblem}. Help them.`;
  const conversation = `${initialMessage}\nUser: ${message}\nAI:`;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: initialMessage }, { role: 'user', content: message }],
    }),
  };

  const program = T.gen(function* (_) {
    const data = yield* _(fetchWithFallback(options, conversation));
    let aiResponse = 'Error: Invalid response structure';
    let specialMessage = null;

    if (data.error) {
      specialMessage = `Error: ${data.error} - Switching to Gemini`;
      if (data.fallback && data.fallback.candidates) {
        aiResponse = data.fallback.candidates[0].content.parts[0].text;
      } else {
        aiResponse = 'Error: Invalid response structure from Gemini';
      }
    } else {
      aiResponse = data.choices?.[0]?.message?.content || 'Error: Invalid response structure';
    }

    const newConversationHistory = `${conversation}\nAI: ${aiResponse}`;
    const newConversationHistoryEncoded = Buffer.from(newConversationHistory).toString('base64');

    res.setHeader('Set-Cookie', [
      serialize('sessionId', sessionId, { path: '/', httpOnly: true }),
      serialize(`conversation-${sessionId}`, newConversationHistoryEncoded, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 }),
    ]);

    res.status(200).json({ response: aiResponse, specialMessage });
  });

  T.runPromise(program).catch((error) => {
    res.status(500).json({ error: error.message });
  });
};
