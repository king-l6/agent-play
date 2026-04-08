import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  configuration: {
    baseURL: process.env.DASHSCOPE_BASE_URL,
  },
  model: process.env.DASHSCOPE_MODEL ?? "qwen-plus",
  temperature: 0,
});

async function main() {
  const response = await model.invoke([
    new SystemMessage("你是一个有用的AI助手"),
    new HumanMessage("你有多少免费额度"),
  ]);

  console.log(response.content);
}

main();