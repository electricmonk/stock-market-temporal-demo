import { OpenAI } from 'openai';
import { SMAData } from '../types';

export type AIActivities = ReturnType<typeof createAIActivities>;
export const createAIActivities = (openai: OpenAI) => {
  const getAIRecommendation = async (symbol: string, smaData: SMAData[]) => {
    const prompt = `Based on the Simple Moving Average data for ${symbol}, should an investor buy or sell? 
    Recent SMA values (from newest to oldest):
    ${smaData.map(d => `${new Date(d.timestamp).toISOString()}: ${d.value}`).join('\n')}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a financial analyst providing buy/sell recommendations based on technical analysis." },
        { role: "user", content: prompt }
      ]
    });

    return response.choices[0].message.content || '';
  }

  return {
    getAIRecommendation
  }
}

