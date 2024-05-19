import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { serialize, parse } from 'cookie';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

const fetchOpenAI = async (options: any) => {
  const response = await fetch(OPENAI_API_URL, options);
  const responseBody = await response.text();
  console.log('OpenAI API Response Status:', response.status);
  console.log('OpenAI API Response Body:', responseBody);
  if (!response.ok) {
    const error = JSON.parse(responseBody).error;
    throw new Error(`OpenAI API request failed with status ${response.status}: ${error.message}`);
  }
  return JSON.parse(responseBody);
};

const fetchGemini = async (conversation: string) => {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: conversation }] }] }),
  });
  const responseBody = await response.text();
  console.log('Gemini API Response Status:', response.status);
  console.log('Gemini API Response Body:', responseBody);
  if (!response.ok) {
    throw new Error(`Gemini API request failed with status ${response.status}: ${responseBody}`);
  }
  return JSON.parse(responseBody);
};

const fetchWithFallback = async (options: any, conversation: string) => {
  try {
    return await fetchOpenAI(options);
  } catch (error) {
    console.error('Error with OpenAI:', error);
    try {
      return { error: error.message, fallback: await fetchGemini(conversation) };
    } catch (geminiError) {
      console.error('Error with Gemini:', geminiError);
      throw new Error('Both OpenAI and Gemini failed');
    }
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { message, newChat, userName, userProblem } = req.body;

  // If newChat is true, clear the conversation history
  if (newChat) {
    res.setHeader('Set-Cookie', [
      serialize('sessionId', '', { path: '/', expires: new Date(0) }),
      serialize('conversationHistory', '', { path: '/', expires: new Date(0) }),
    ]);
    res.status(200).json({ response: 'Chat reset' });
    return;
  }

  // Get the session id from cookies
  const cookies = parse(req.headers.cookie || '');
  const sessionId = cookies.sessionId || Date.now().toString();

  // Fetch conversation history from session
  const conversationHistoryEncoded = cookies[`conversation-${sessionId}`] || '';
  const conversationHistory = conversationHistoryEncoded
    ? Buffer.from(conversationHistoryEncoded, 'base64').toString('utf-8')
    : '';

  console.log('Session ID:', sessionId);
  console.log('Conversation History Before:', conversationHistory);

  const initialMessage = `You are a customer support agent. This consumer identified as ${userName} described their problem as: ${userProblem}. Help them.`;
  const conversation = `${initialMessage}\nUser: ${message}\nAI:`;

  console.log('Conversation with New Message:', conversation);

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

  try {
    const data = await fetchWithFallback(options, conversation);
    console.log('API Response Data:', data);

    // Check for the expected response structure
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
      aiResponse =
        data.choices?.[0]?.message?.content ||
        'Error: Invalid response structure';
    }

    // Update conversation history
    const newConversationHistory = `${conversation}\nAI: ${aiResponse}`;
    const newConversationHistoryEncoded = Buffer.from(newConversationHistory).toString('base64');

    console.log('Updated Conversation History:', newConversationHistory);

    // Set cookies for session id and conversation history
    res.setHeader('Set-Cookie', [
      serialize('sessionId', sessionId, { path: '/', httpOnly: true }),
      serialize(`conversation-${sessionId}`, newConversationHistoryEncoded, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 }),
    ]);

    res.status(200).json({ response: aiResponse, specialMessage });
  } catch (error) {
    console.error('Final Error:', error);
    res.status(500).json({ error: error.message });
  }
};