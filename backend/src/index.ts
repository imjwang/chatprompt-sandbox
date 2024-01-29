import { Hono } from 'hono'
import { stream, streamText } from "hono/streaming"
import { cors } from 'hono/cors'
import { CohereChat } from './chains'


const app = new Hono()

app.use("/*", cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const Chain = new CohereChat()

app.post('/chat', async (c) => {
  const { message } = await c.req.json()
  const lcstream = await Chain.stream({input: message})
  return stream(c, async (stream) => {
    await stream.pipe(lcstream)
  })
})


app.get('/chat/history', async (c) => {
  const messages = await Chain.getMessages()

  const res = []
  for (const msg of messages) {
   res.push([msg._getType(), msg.content])
  }
  
  return c.json(res)
})

app.delete('/chat/history', async (c) => {
  await Chain.clearMessages()
  return c.json({ status: "ok"})
})

export default {
  port: 3000,
  fetch: app.fetch
}
