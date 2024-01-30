import { Hono } from 'hono'
import { stream, streamText } from "hono/streaming"
import { cors } from 'hono/cors'
import { CohereChat } from './chains'
import { InMemoryStore } from "langchain/storage/in_memory";


const app = new Hono()


const store = new InMemoryStore();
const chain = new CohereChat(store)

app.use("/*", cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/chat', async (c) => {
  const { message } = await c.req.json()
  const lcstream = await chain.stream({input: message})
  return stream(c, async (stream) => {
    await stream.pipe(lcstream)
  })
})

app.put('/chat', async (c) => {
  const { uid } = await c.req.json()
  const messages = await chain.getMessages()

  await store.mset(
    messages.map((msg, idx) => [`message:${uid}:id:${idx}`, msg])
  )

  return c.json({ status: "ok" })
})

app.get('/chat/:id', async (c) => {
  const id = c.req.param('id')
  const messages = await chain.loadMessages(id)
  const res = []
  for (const msg of messages) {
   res.push([msg._getType(), msg.content])
  }
  return c.json(res)
})

app.get('/history', async (c) => {
  const messages = await chain.getMessages()

  const res = []
  for (const msg of messages) {
   res.push([msg._getType(), msg.content])
  }
  
  return c.json(res)
})

app.delete('/history', async (c) => {
  await chain.clearMessages()
  return c.json({ status: "ok"})
})

app.get('/ids', async (c) => {
  const yieldedKeys = [];
for await (const key of store.yieldKeys("message")) {
  yieldedKeys.push(key);
}
  return c.json({ yieldedKeys })
})

export default {
  port: 3000,
  fetch: app.fetch
}
