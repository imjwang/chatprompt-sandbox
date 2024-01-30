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

  setMessages(messages: BaseMessage[]) {
    this.memory = new ChatMessageHistory(messages)
  }

  async stream({ input }: StreamInput) {
    const res = await this.chainWithHistory.stream({ input })
    return res
  }

  async restoreConversation(id: string) {
    const keys = []
    for await (const k of this.store.yieldKeys(`message:${id}`)) {
      keys.push(k)
    }
    const messages = await this.store.mget(keys)
    this.memory = new ChatMessageHistory(messages)
    return messages
  }

  async saveMessages(id: string) {
    const messages = await this.getMessages()
    if (!messages) return "no messages"
    await this.store.mset(
      messages.map((msg, idx) => [`message:${id}:id:${idx}`, msg])
    )
    return "ok"
  }

  async deleteConversation(id: string) {
    const msgKeys = []
    for await (const msg of this.store.yieldKeys(`message:${id}`)) {
      msgKeys.push(msg)
    }
    await this.store.mdelete(msgKeys)
    await this.clearMessages()
    return msgKeys
  }


  async regenerateAt(idx: number) {
    const messages = await this.getMessages()
    const messageHistory = messages.slice(0, idx)
    const currentMessage = messages[idx]

    this.setMessages(messageHistory)
    return await this.stream({ input: currentMessage.content as string })
  }

  async editAt(idx: number, message: string) {
    const messages = await this.getMessages()
    const historySlice = messages.slice(0, idx)

    this.setMessages(historySlice)
    return await this.stream({input: message})
  }
}
