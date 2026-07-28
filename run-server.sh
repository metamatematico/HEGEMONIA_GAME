#!/bin/bash
cd /home/z/my-project
NODE_ENV=production nohup node .next/standalone/server.js > /home/z/my-project/server.log 2>&1 &
echo $! > /home/z/my-project/server.pid
disown
