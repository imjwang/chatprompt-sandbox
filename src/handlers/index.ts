import { BaseCallbackHandler } from "langchain/callbacks";
import toast from 'react-hot-toast';
import { Serialized } from "langchain/load/serializable";
import { LLMResult, BaseMessage } from "langchain/schema";
import { ChainValues } from "langchain/schema";
import { AgentAction, AgentFinish } from "langchain/schema";
import { Document } from 'langchain/document';



export class CustomHandler extends BaseCallbackHandler {
  name = "custom handler name";

  handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string | undefined, extraParams?: Record<string, unknown> | undefined, tags?: string[] | undefined, metadata?: Record<string, unknown> | undefined, name?: string | undefined): any {
    toast("LLM starting...")
  };

  handleLLMError(err: any, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("LLM error")
  };

  handleLLMEnd(output: LLMResult, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("LLM ended")
  };

  handleChatModelStart(llm: Serialized, messages: BaseMessage[][], runId: string, parentRunId?: string | undefined, extraParams?: Record<string, unknown> | undefined, tags?: string[] | undefined, metadata?: Record<string, unknown> | undefined, name?: string | undefined): any {
    toast("Chat model starting...")
  };

  handleChainStart(chain: Serialized, inputs: ChainValues, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined, metadata?: Record<string, unknown> | undefined, runType?: string | undefined, name?: string | undefined): any {
    toast("Chain starting...")
  };

  handleChainError(err: any, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined, kwargs?: {
      inputs?: Record<string, unknown> | undefined;
  } | undefined): any {
    toast("Chain error")
  };

  handleChainEnd(outputs: ChainValues, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined, kwargs?: {
      inputs?: Record<string, unknown> | undefined;
  } | undefined): any {
    toast("Chain ended")
  };

  handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined, metadata?: Record<string, unknown> | undefined, name?: string | undefined): any {
    toast("Tool starting...")
  };

  handleToolError(err: any, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("Tool error")
  };

  handleToolEnd(output: string, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("Tool ended")
  };

  handleText(text: string, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): void | Promise<void> {
    toast("Text")
  };

  handleAgentAction(action: AgentAction, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): void | Promise<void> {
    toast("Agent action")
  };

  handleAgentEnd(action: AgentFinish, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): void | Promise<void> {
    toast("Agent ended")
  };

  handleRetrieverStart(retriever: Serialized, query: string, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined, metadata?: Record<string, unknown> | undefined, name?: string | undefined): any {
    toast("Retriever starting...")
  };

  handleRetrieverEnd(documents: Document[], runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("Retriever ended")
  };

  handleRetrieverError(err: any, runId: string, parentRunId?: string | undefined, tags?: string[] | undefined): any {
    toast("Retriever error")
  };

}