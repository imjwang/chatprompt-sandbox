import { ChatCohere } from "@langchain/cohere"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { BaseMessage } from "@langchain/core/messages"
import type { InMemoryStore } from "langchain/storage/in_memory";


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
  store: InMemoryStore;

  constructor(store: InMemoryStore, initialMessages: BaseMessage[] = []) {
    this.model = new ChatCohere({
      apiKey: process.env.COHERE_API_KEY,
      model: "command-light",
    })

    this.store = store
    
    // this.model = new ChatOpenAI({})
    this.parser = new StringOutputParser();
    this.prompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("history"),
      ["human", "{input}"]
    ])
    
    this.chatChain = this.prompt.pipe(this.model).pipe(this.parser)

    this.memory = new ChatMessageHistory(initialMessages)
    
    
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

  async loadMessages(uid: string) {
    const keys = []
    for await (const k of this.store.yieldKeys(`message:${uid}`)) {
      keys.push(k)
    }
    const messages = await this.store.mget(keys)
    this.memory = new ChatMessageHistory(messages)
    return messages
  }
}
