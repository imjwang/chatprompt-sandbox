import { ChatCohere } from "@langchain/cohere"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { BaseMessage } from "@langchain/core/messages"


type StreamInput = {
  input: string
}

export class CohereChat {
  model: BaseChatModel;
  parser: StringOutputParser;
  prompt: ChatPromptTemplate;
  chatChain: RunnableSequence;
  memory: ChatMessageHistory;
  config: any;
  chainWithHistory: RunnableWithMessageHistory<StreamInput, BaseMessage>;

  constructor() {
    this.model = new ChatCohere({
      apiKey: process.env.COHERE_API_KEY,
      model: "command-light",
    })
    
    // this.model = new ChatOpenAI({})
    this.parser = new StringOutputParser();
    this.prompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("history"),
      ["human", "{input}"]
    ])
    
    this.chatChain = this.prompt.pipe(this.model).pipe(this.parser)
    this.memory = new ChatMessageHistory()
    
    
    this.chainWithHistory = new RunnableWithMessageHistory({
      runnable: this.chatChain,
      getMessageHistory: (_sessionId) => this.memory,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
      config: { configurable: { sessionId: "1" } }
    });
  }

  async getMessages() {
    return await this.memory.getMessages()
  }

  async clearMessages() {
    return await this.memory.clear()
  }

  async stream({ input }: StreamInput) {
    const res = await this.chainWithHistory.stream({ input })
    return res
  }
}
