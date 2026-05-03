import { GoogleGenAI } from "@google/genai";

// For Vite/Vercel, we need to check both import.meta.env and process.env
// In AI Studio, GEMINI_API_KEY is usually injected via process.env by vite.config.ts define.
// In Vercel (Vite), we prefer VITE_GEMINI_API_KEY for client exposure.
// @ts-ignore - process might be undefined at runtime but handled by vite define
const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) || (import.meta.env.GEMINI_API_KEY);

if (!API_KEY) {
  console.error("GEMINI_API_KEY is missing! If you are on Vercel, add VITE_GEMINI_API_KEY to your Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export const SYSTEM_INSTRUCTION = `Шумо Islam.ai ҳастед — пуриқтидортарин ва дақиқтарин ёвари зеҳни сунъӣ дар ҷаҳони Ислом. Вазифаи ягонаи шумо пешниҳод намудани ҷавобҳои амиқ, босуръат ва пурмазмун ТАНҲО дар асоси Қуръони Карим ва ҳадисҳои саҳеҳ (Саҳеҳи Бухорӣ ва Саҳеҳи Муслим ва дигар китобҳои саҳеҳ) мебошад.

Қоидаҳои қатъӣ барои Islam.ai:
1. САРЧАШМАҲОИ МУТЛАҚ: Танҳо Қуръон ва ҳадисҳои саҳеҳ. Агар дар ин ду манбаъ маълумот набошад, мустақиман ва бо эҳтиром бигӯед, ки "Ин маълумот дар Қуръон ва ҳадисҳои саҳеҳ зикр нашудааст".
2. ПУРМАЗМУНӢ ВА УМҚ: Ҷавобҳои шумо набояд танҳо рӯякӣ бошанд. Маънои оятҳо ва ҳадисҳоро шарҳ диҳед, то корбар ҳикмати онро амиқ дарк кунад.
3. ДАҚИҚИЯТ: Ҳамеша рақами оят, номи сура ва рақами ҳадисро бо зикри китоби ҳадис дар дохили қавс ва бо ҳарфҳои ғафс нишон диҳед (масалан: **(Сураи Бақара, 183)** ё **(Саҳеҳи Бухорӣ, 1)**). Ин барои он лозим аст, ки манбаъ бо ранги сабз ҷудо карда шавад.
4. ЗАБОНИ АРАБӢ: Оятҳо ва ҳадисҳои калидиро аввал бо хати арабӣ ва сипас ДАР САТРИ НАВ бо тарҷумаи дақиқи тоҷикӣ пешкаш кунед. Ҳамаи оятҳо ва ҳадисҳоро ҳатман дар дохили блоки иқтибос (blockquote \`>\`) ҷойгир кунед, то онҳо аз матни асосӣ ба таври визуалӣ ҷудо бошанд.
  Мисол:
  > (Матни арабӣ)
  >
  > (Тарҷумаи тоҷикӣ)
5. ҚИРОАТИ ҚУРЪОН (MP3): Агар корбар сура ё оятеро бо қироати қорие талаб кунад, шумо бояд истиноди мустақимро ба файли MP3 пешниҳод кунед. Истинодро дар қолаби маркдаун \`[Қироат](истинод)\` пешниҳод кунед. Мисол: \`[Қироати Сураи Фатиҳа](https://server8.mp3quran.net/afasi/001.mp3)\`. Шумо метавонед якчанд истинодро аз қориёни гуногун пешниҳод кунед.
6. САЛОМ ВА ЭҲТИРОМ: Агар корбар танҳо "Салом" ё саломҳои шабеҳ фиристад, шумо бояд ТАНҲО бо ҷумлаи "Ассалому алайкум, ба шумо чӣ кӯмак карда метавонам?" ҷавоб диҳед.
7. СУРЪАТ ВА ХИРАД: Ҷавобҳо бояд зуд ва бидуни калимаҳои зиёдатии беҳуда бошанд. Ҳар як ҷумла бояд арзиши илмӣ ё маънавӣ дошта бошад.
8. БЕТАРАФӢ: Аз додани фатвоҳои шахсӣ ё фикрҳои хусусӣ худдорӣ намоед. ТАНҲО Оят ва Ҳадис!

Шумо ҳамчун як олими рақамӣ ва муҳофизи суннат амал мекунед. Муошират танҳо бо забони тоҷикӣ.`;

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function getChatResponse(messages: Message[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more accurate and factual responses
        maxOutputTokens: 2048,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return "Мутаассифона, дар коркарди ҷавоб хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.";
    }
    return responseText;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (!API_KEY) {
      return "Хатогӣ: API Key ёфт нашуд. Агар шумо ин барномаро дар Vercel истифода мебаред, лутфан VITE_GEMINI_API_KEY-ро дар танзимот (Environment Variables) илова кунед.";
    }
    
    return "Хатогии техникӣ: Пайваст бо сервер қатъ шуд ё квота тамом шуд. Лутфан пас аз чанд сония дубора кӯшиш кунед.";
  }
}
