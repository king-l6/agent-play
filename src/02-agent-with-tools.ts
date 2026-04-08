import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createAgent } from "langchain";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const envCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../.env")];
const envPath = envCandidates.find((p) => existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
}

// 定义工具 - 使用 Zod 定义参数 schema
const calculatorTool = tool(
  async ({ a, b, operation }) => {
    switch (operation) {
      case "add":
        return `${a} + ${b} = ${a + b}`;
      case "subtract":
        return `${a} - ${b} = ${a - b}`;
      case "multiply":
        return `${a} × ${b} = ${a * b}`;
      case "divide":
        return b !== 0 ? `${a} ÷ ${b} = ${a / b}` : "除数不能为0";
      default:
        return "未知操作";
    }
  },
  {
    name: "calculator",
    description: "执行数学计算。支持加、减、乘、除",
    schema: z.object({
      a: z.number().describe("第一个数字"),
      b: z.number().describe("第二个数字"),
      operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("运算类型"),
    }),
  }
);

const weatherTool = tool(
  async ({ city }) => {
    // 模拟天气API
    const weather = ["晴天", "多云", "小雨", "大雨"];
    const randomWeather = weather[Math.floor(Math.random() * weather.length)];
    return `${city}今天的天气是: ${randomWeather}，温度 ${(20 + Math.random() * 10).toFixed(1)}°C`;
  },
  {
    name: "get_weather",
    description: "获取指定城市的天气信息",
    schema: z.object({
      city: z.string().describe("城市名称"),
    }),
  }
);

async function main() {
  const apiKey = process.env.DASHSCOPE_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "缺少 API Key。请在 .env 中设置 DASHSCOPE_API_KEY（或 OPENAI_API_KEY）后重试。"
    );
  }

  const model = new ChatOpenAI({
    apiKey,
    configuration: {
      baseURL: process.env.DASHSCOPE_BASE_URL,
    },
    model: process.env.DASHSCOPE_MODEL ?? "qwen-plus",
    temperature: 0,
  });

  const tools = [calculatorTool, weatherTool];

  // 创建 Agent（LangChain v1）
  const agent = createAgent({
    model,
    tools,
    systemPrompt: "你是一个有用的助手，可以使用工具帮助用户完成任务。",
  });

  // 测试
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "上海今天天气怎么样？如果温度超过25度，告诉我需要加多少度才能到30度。",
      },
    ],
  });

  console.log("\n=== 最终结果 ===");
  console.log(result.messages[result.messages.length - 1]?.content);
}

main();