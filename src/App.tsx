import { useState } from "react";
import { FakeListLLM } from "langchain/llms/fake";
import { ConsoleCallbackHandler } from "langchain/callbacks"
import { PromptTemplate } from "langchain/prompts";
import toast, { Toaster } from 'react-hot-toast';


function Message({ role, content }: { role: string, content: string }) {
  const color = role === "human" ? "bg-pink-300" : "bg-slate-300"
  return (
    <div className="p-4">
      <div className={`tracking-tighter text-xs font-bold ${color} rounded-full size-fit py-1 px-2`}>
        {role.toUpperCase()}
      </div>
      <p className="leading-7 [&:not(:first-child)]:my-2">
        {content}
      </p>
      <div className="border-b" />
    </div>
  )
}

function App() {
  const [response, setResponse] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [message, setMessage] = useState<string>("");

  const handleMessageChange = (e: React.FocusEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  const handleClick = async () => {
    setResponse([]);

    const stream = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sessionId: "2"
      })
    })

    const reader = stream!.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setResponse((prev) => [...prev, decoder.decode(value)])
    }

    const historyData = await fetch("http://localhost:3000/chat/history")
    const historyJson = await historyData.json()
    setHistory(historyJson)
  }

  const handleReset = async () => {
    await fetch("http://localhost:3002/chat/history", { method: "DELETE" })

    toast.custom(() => (
      <div className="bg-red-500 text-white p-4 rounded-md">
        Memory cleared!!
      </div>
    ))

    setHistory([])
    setResponse([])
  }

  return (
    <>
      <div className="grid grid-cols-2">
        <div>
          <div className="bg-slate-100 p-12 min-h-[30vh] max-h-[50vh] overflow-auto">
            {response}
          </div>
          <div className="flex gap-2 align-middle place-content-center p-2">
            <input className="hover:bg-slate-100 border-2 border-indigo-500 border-dashed px-4 w-full text-sm font-semibold" onBlur={handleMessageChange} />
            <button onClick={handleClick} className="bg-purple-400 px-4 py-2 rounded-sm hover:outline outline-slate-300 text-xl">
              Send
            </button>
            <button onClick={handleReset} className="bg-red-500 px-4 py-2 rounded-sm hover:outline outline-slate-300 text-xl">
              Reset
            </button>
          </div>
        </div>
        <div className="p-4">
          {
            history.map((h, i) => (
              <Message key={i} role={h[0]} content={h[1]} />
            ))
          }
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default App
