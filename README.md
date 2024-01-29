# Message Sandbox
This repo is meant to show how chat history works in langchain.js. It comes with an implementation that uses Cohere model.


### 1. Install bun for runtime.

```shell
npm install -g bun
```

### 2. Run

```shell
git clone https://github.com/imjwang/chatprompt-sandbox.git
cd chatprompt-sandbox
./start.sh
```

### 3. Env vars

You should fill out tokens that you want to use in ./backend/.env.template depending on integration choices and rename to .env


## Backend
Uses [Hono](https://hono.dev/) with [Bun runtime](https://bun.sh/docs/cli/run).

## Frontend
Uses vite
