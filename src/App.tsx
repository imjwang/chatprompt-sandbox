import { useState } from "react";
import { FakeListLLM } from "langchain/llms/fake";
import { ConsoleCallbackHandler } from "langchain/callbacks"
import { PromptTemplate } from "langchain/prompts";
import toast, { Toaster } from 'react-hot-toast';
import { CustomHandler } from "./handlers";


const llm = new FakeListLLM({
  responses: ["Duck", "Duck", "Moose", "Duck"], // responses are chosen at random
  sleep: 5, // sets an increment in ms between chunks of stream or before response
  callbacks: [new ConsoleCallbackHandler()]
});

const llmWithCallbackInConstructor = new FakeListLLM({
  responses: ["Duck Duck Moose Duck Duck Duck Moose Duck Duck Duck Moose Duck Duck Duck Moose Duck"],
  sleep: 10,
  tags: ["test", "fake", "ducks"],
  callbacks: [{
    handleChainEnd: ({tags}) => toast(":')", tags) // using in constructor seems broken as of v0.0.213
  }]
});

const llmwithCustomCallback = new FakeListLLM({
  responses: ["Duck", "Duck", "Moose", "Duck"], // responses are chosen at random
  sleep: 5, // sets an increment in ms between chunks of stream or before response
  callbacks: [new CustomHandler()]
});

function App() {
  const [response, setResponse] = useState<string[]>([]);

  const prompt = PromptTemplate.fromTemplate(`hi`)
  const chain = prompt.pipe(llmWithCallbackInConstructor)

  const handleClick = async () => {
    setResponse([]);
  //   const response = await chain.stream({}, {
  //     tags: ["stream", "tag"], // these don't seem to work atm
  //     callbacks: [{
  //       handleLLMStart: ({tags}) => toast(":') LLM starting..."),
  //       handleLLMEnd: () => toast("LLM ended :["),
  //       handleChainStart: ({id}) => toast(`The Chain Train is entering a ${id ? id[2]: ""} :D`),
  //       handleChainEnd: () => toast(`The Chain Train is leaving :O`)
  //     }]
  //   });
    const response = await llmwithCustomCallback.stream("hi", {
      callbacks: [new CustomHandler()]
    })
    for await (const chunk of response) {
      setResponse(res => [...res, chunk]);
    }
  }

  return (
    <>
    <div className="bg-slate-100 p-12 min-h-[30vh] max-h-[50vh] overflow-auto">
      {response}
    </div>
    <div className="flex align-middle place-content-center py-2">
      <button onClick={handleClick} className="bg-purple-400 px-4 py-2 rounded-sm hover:outline outline-slate-300 text-xl">
        Click to Generate!
      </button>
    </div>
    <Toaster />
    </>
  )
}

export default App
