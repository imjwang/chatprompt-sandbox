#!/bin/bash
(cd ./backend && bun install) & (cd ./frontend && bun install)
(cd ./frontend && bun dev) & (cd ./backend && bun dev)