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

app.get('/conversation', async (c) => {
  const yieldedKeys = [];
  for await (const key of store.yieldKeys("message")) {
    yieldedKeys.push(key);
  }
  return c.json({ yieldedKeys })
})

app.put('/conversation', async (c) => {
  const { id } = await c.req.json()
  const status = await chain.saveMessages(id)

  return c.json({ status })
})

app.delete('/conversation/:id', async (c) => {
  const id = await c.req.param('id')
  const delIds = await chain.deleteConversation(id)

  return c.json({ status: "deleted", ids: delIds })
})

app.get('/conversation/:id', async (c) => {
  const id = c.req.param('id')
  const messages = await chain.restoreConversation(id)
  const res = []
  for (const msg of messages) {
   res.push([msg._getType(), msg.content])
  }
  return c.json(res)
})

app.get('/chat/:idx', async (c) => {
  const idx = await c.req.param('idx')
  const lcstream = await chain.regenerateAt(+idx)
  return stream(c, async (stream) => {
    await stream.pipe(lcstream)
  })
})

app.post('/edit/:idx', async (c) => {
  const idx = await c.req.param('idx')
  const { message } = await c.req.json()
  const lcstream = await chain.editAt(+idx, message)
  return stream(c, async (stream) => {
    await stream.pipe(lcstream)
  })
})

export default {
  port: 3000,
  fetch: app.fetch
}
