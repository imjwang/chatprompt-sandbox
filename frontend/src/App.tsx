import { useState, useEffect } from "react";
import { FakeListLLM } from "langchain/llms/fake";
import { ConsoleCallbackHandler } from "langchain/callbacks"
import { PromptTemplate } from "langchain/prompts";
import toast, { Toaster } from 'react-hot-toast';


interface MessageProps {
  role: string;
  content: string;
  handleRegenerate: Function;
  idx: number
}

function EdittableMessage({ role, content, handleRegenerate, idx }: MessageProps) {
  const [editmode, setEditmode] = useState(false)
  const [editText, setEditText] = useState(content)
  const [messageContent, setMessageContent] = useState(content)

  const handleEdit = () => {
    setEditmode(false)
    setMessageContent(editText)
    handleRegenerate(idx, messageContent)
  }

  return (
    <div className="p-4">
      <div className="tracking-tighter text-xs font-bold bg-pink-300 rounded-full size-fit py-1 px-2">
        {role.toUpperCase()}
      </div>
      {
        editmode ? (
          <div className="flex flex-col p-3 gap-1">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className={`leading-7 [&:not(:first-child)]:my-2 p-2 resize-none ${editmode ? "border border-zinc-700" : ""}`} />
            <button onClick={handleEdit} className="bg-purple-400 text-black border px-2 rounded-sm hover:outline outline-slate-300 text-sm w-fit py-1">ok</button>
          </div>
        ) : (
          <p className="leading-7 [&:not(:first-child)]:my-2" onClick={() => setEditmode(true)}>
            {messageContent}
          </p>
        )
      }
      <div className="border-b" />
    </div>
  )
}

function Message({ role, content, idx, handleRegenerate }: MessageProps) {
  return (
    <div className="p-4">
      <div className="tracking-tighter text-xs font-bold bg-slate-300 rounded-full size-fit py-1 px-2">
        {role.toUpperCase()}
      </div>
      <p className="leading-7 [&:not(:first-child)]:my-2">
        {content}
      </p>
      <button onClick={() => handleRegenerate(idx - 1)} className="bg-purple-400 text-black border px-1 rounded-sm hover:outline outline-slate-300 text-sm w-fit mb-2">regenerate</button>
      <div className="border-b" />
    </div>
  )
}

function DropDown({ selected, setSelected, options }: any) {
  const [open, setOpen] = useState<boolean>(false)
  if (!options.length) return null

  return (
    <div className="relative inline-block text-left">
      <div>
        <button onClick={() => setOpen(!open)} className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {selected ?? "Options"}
          <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {
        open && (
          <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {
                options.map((o) =>
                  <button onClick={() => { setSelected(o); setOpen(false) }} className="text-justify text-gray-700 block px-4 py-2 text-sm hover:bg-purple-100 w-full">{o}</button>
                )
              }
            </div >
          </div >
        )
      }
    </div >
  )
}


const saveMessages = async (id: string) => {
  await fetch("http://localhost:3000/conversation", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id,
    })
  })
}

const deleteConversation = async (id: string) => {
  const res = await fetch(`http://localhost:3000/conversation/${id}`, {
    method: "DELETE",
  })
  const status = await res.json()
  return status
}

function App() {
  const [response, setResponse] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [message, setMessage] = useState<string>("");
  const [conversationId, setconversationId] = useState<string | undefined>(undefined);
  const [conversationOptions, setconversationOptions] = useState<string[]>([])

  const getconversationIds = async () => {
    const res = await fetch("http://localhost:3000/conversation")
    const { yieldedKeys } = await res.json()
    const uniqueKeys = new Set(yieldedKeys.map((k: string) => k.split(":")[1]) as string[])
    setconversationOptions(Array.from(uniqueKeys))
  }

  useEffect(() => {
    getconversationIds()
  }, [])

  const handleMessageChange = (e: React.FocusEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  const handleRegenerate = async (idx: string) => {
    setResponse([]);

    const stream = await fetch(`http://localhost:3000/chat/${idx}`)

    const reader = stream!.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setResponse((prev) => [...prev, decoder.decode(value)])
    }

    const historyData = await fetch("http://localhost:3000/history")
    const historyJson = await historyData.json()
    if (conversationId) await saveMessages(conversationId)

    setHistory(historyJson)
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

    const historyData = await fetch("http://localhost:3000/history")
    const historyJson = await historyData.json()

    if (!conversationId) {
      const newId = Math.floor(Math.random() * 100000) + "" // should be good enough
      setconversationId(newId)
      await saveMessages(newId)
      setconversationOptions((prev) => [...prev, newId])
    } else {
      await saveMessages(conversationId)
    }

    setHistory(historyJson)
  }

  const handleRestore = async () => {
    setResponse([]);

    const data = await fetch(`http://localhost:3000/conversation/${conversationId}`)
    const messages = await data.json()

    setHistory(messages)
    const lastMessageContent = messages[messages.length - 1][1] // message is [role, content] we only want the content of last message
    setResponse(lastMessageContent)
  }

  const handleEdit = async (idx: string, message: string) => {
    setResponse([]);

    const stream = await fetch(`http://localhost:3000/edit/${idx}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
      })
    })

    const reader = stream!.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setResponse((prev) => [...prev, decoder.decode(value)])
    }

    const historyData = await fetch("http://localhost:3000/history")
    const historyJson = await historyData.json()

    if (conversationId) await saveMessages(conversationId)

    setHistory(historyJson)
  }

  const handleDelete = async () => {
    setHistory([])
    setconversationId(undefined)

    if (conversationId) {
      await deleteConversation(conversationId)
      getconversationIds()
      toast.custom(() => (
        <div className="bg-red-500 text-black p-4 rounded-md border-2">
          Conversation deleted!!
        </div>
      ))
    }
  }

  const handleReset = async () => {
    await fetch("http://localhost:3000/history", { method: "DELETE" })

    setHistory([])
    setResponse([])
    setconversationId(undefined)
  }

  return (
    <>
      <div className="grid grid-cols-2 p-4">
        <div>
          <div className="p-12 min-h-[30vh] max-h-[50vh] overflow-auto border shadow text-gray-600 bg-stone-100 font-mono tracking-tighter">
            {response}
          </div>
          <div className="flex gap-2 align-middle place-content-center p-4 border shadow mt-2">
            <input className="hover:bg-slate-100 border-2 border-indigo-500 border-dashed px-4 w-full text-sm font-semibold" onBlur={handleMessageChange} />
            <button onClick={handleClick} className="bg-purple-400 px-4 py-2 rounded-sm hover:outline outline-slate-300">
              Send
            </button>
            {
              history.length > 0 && (
                <button onClick={handleReset} className="bg-amber-400 px-4 py-2 rounded-sm hover:outline outline-slate-300">
                  New
                </button>
              )
            }
          </div>
        </div>
        <div className="p-4">
          <DropDown selected={conversationId} setSelected={setconversationId} options={conversationOptions} />
          {conversationOptions.length > 0 && (
            <button onClick={handleRestore} className="bg-white ml-4 text-black border px-4 py-2 rounded-sm hover:outline outline-slate-300 text-sm w-fit">
              Restore
            </button>
          )}
          {conversationOptions.length > 0 && (
            <button onClick={handleDelete} className="bg-red-700 ml-4 text-white px-4 py-2 rounded-sm hover:outline outline-slate-300 text-sm w-fit">
              Delete
            </button>
          )}
          {
            history.map((h, i) => (
              (h[0] === "human") ? (
                <EdittableMessage key={i} role={h[0]} content={h[1]} idx={i} handleRegenerate={handleEdit} />
              ) : (
                <Message key={i} role={h[0]} content={h[1]} idx={i} handleRegenerate={handleRegenerate} />
              )
            ))
          }
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default App
