import { OpenAI } from 'openai';
import { SMAData } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIRecommendation(symbol: string, smaData: SMAData[]): Promise<string> {
  const prompt = `Based on the Simple Moving Average data for ${symbol}, should an investor buy or sell? 
    Recent SMA values (from newest to oldest):
    ${smaData.slice(0, 10).map(d => `${new Date(d.timestamp).toISOString()}: ${d.value}`).join('\n')}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a financial analyst providing buy/sell recommendations based on technical analysis." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content || '';
}