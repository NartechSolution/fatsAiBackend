const { exec, spawn } = require('child_process');
const path = require('path');

// Terminal activity monitoring
const terminalActivity = {
  logs: [],
  maxLogs: 1000, // Keep last 1000 log entries
  clients: new Set(), // Active SSE connections
  
  // Add log entry
  addLog(type, message, data = null) {
    const logEntry = {
      type: type, // 'log', 'error', 'warn', 'info'
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Broadcast to all connected clients
    this.broadcast(logEntry);
  },
  
  // Broadcast log to all connected clients
  broadcast(logEntry) {
    const message = `data: ${JSON.stringify(logEntry)}\n\n`;
    this.clients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        // Remove dead connections
        this.clients.delete(client);
      }
    });
  },
  
  // Add client connection
  addClient(res) {
    this.clients.add(res);
    
    // Send existing logs
    this.logs.forEach(log => {
      try {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      } catch (error) {
        this.clients.delete(res);
      }
    });
  },
  
  // Remove client connection
  removeClient(res) {
    this.clients.delete(res);
  }
};

// Override console methods to capture terminal activity
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  terminalActivity.addLog('log', message, args);
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  terminalActivity.addLog('error', message, args);
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  terminalActivity.addLog('warn', message, args);
  originalConsoleWarn.apply(console, args);
};

console.info = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  terminalActivity.addLog('info', message, args);
  originalConsoleInfo.apply(console, args);
};

// Export terminal activity for use in other files
exports.terminalActivity = terminalActivity;

// Helper function to disconnect Prisma client before generation
async function disconnectPrisma() {
  try {
    const prisma = require('../prisma/client');
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
      console.log('Prisma client disconnected');
      return true;
    }
  } catch (error) {
    console.log('Could not disconnect Prisma client:', error.message);
  }
  return false;
}

// Helper to run shell commands sequentially with SSE streaming
async function runCommandWithStreaming(res, options) {
  const {
    step,
    command,
    args = [],
    cwd,
    startMessage,
    successMessage,
    errorMessage,
  } = options;

  // Send step start message
  if (startMessage) {
    res.write(
      `data: ${JSON.stringify({
        type: 'step-start',
        step,
        message: startMessage,
      })}\n\n`
    );
  }

  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let output = '';

    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`${step} stdout:`, text);
      res.write(
        `data: ${JSON.stringify({
          type: 'stdout',
          step,
          data: text,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    });

    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error(`${step} stderr:`, text);
      res.write(
        `data: ${JSON.stringify({
          type: 'stderr',
          step,
          data: text,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        if (successMessage) {
          res.write(
            `data: ${JSON.stringify({
              type: 'step-success',
              step,
              message: successMessage,
              exitCode: code,
            })}\n\n`
          );
        }
        resolve({ code, output });
      } else {
        const msg =
          errorMessage ||
          `Step "${step}" failed with exit code ${code}`;
        console.error(msg);
        res.write(
          `data: ${JSON.stringify({
            type: 'step-error',
            step,
            message: msg,
            exitCode: code,
            output,
          })}\n\n`
        );
        reject(new Error(msg));
      }
    });

    childProcess.on('error', (error) => {
      const msg =
        errorMessage ||
        `Error while running step "${step}": ${error.message}`;
      console.error(msg);
      res.write(
        `data: ${JSON.stringify({
          type: 'step-error',
          step,
          message: msg,
          error: error.message,
        })}\n\n`
      );
      reject(error);
    });
  });
}

// Generate Prisma Client with real-time terminal output
exports.generatePrisma = async (req, res) => {
  try {
    // Get the project root directory
    const projectRoot = path.join(__dirname, '..');
    
    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Try to disconnect Prisma client first to avoid file locking issues
    res.write(`data: ${JSON.stringify({ type: 'info', message: 'Attempting to disconnect Prisma client to avoid file locking...' })}\n\n`);
    const disconnected = await disconnectPrisma();
    if (disconnected) {
      res.write(`data: ${JSON.stringify({ type: 'info', message: 'Prisma client disconnected successfully' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'warning', message: 'Could not disconnect Prisma client. If generation fails, stop the server first.' })}\n\n`);
    }
    
    // Small delay to allow file handles to release (Windows specific)
    if (process.platform === 'win32') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Send initial message
    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting Prisma client generation...' })}\n\n`);
    
    // Execute npx prisma generate command with spawn for real-time output
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = ['prisma', 'generate'];
    
    const childProcess = spawn(command, args, {
      cwd: projectRoot,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    
    // Stream stdout
    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('Prisma stdout:', text);
      res.write(`data: ${JSON.stringify({ type: 'stdout', data: text })}\n\n`);
    });
    
    // Stream stderr
    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error('Prisma stderr:', text);
      res.write(`data: ${JSON.stringify({ type: 'stderr', data: text })}\n\n`);
    });
    
    // Handle process completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Prisma client generated successfully');
        res.write(`data: ${JSON.stringify({ type: 'success', message: 'Prisma client generated successfully', output: output })}\n\n`);
      } else {
        console.error('Prisma generation failed with code:', code);
        
        // Check for Windows permission error (EPERM)
        const isPermissionError = output.includes('EPERM') || output.includes('operation not permitted');
        
        let errorMessage = 'Failed to generate Prisma client';
        let errorDetails = {
          code: code,
          output: output
        };
        
        if (isPermissionError) {
          errorMessage = 'Permission Error: Cannot generate Prisma client because files are locked. This usually happens when the server is running and using the Prisma client. Please stop the server, generate the client, then restart the server.';
          errorDetails.solution = 'Stop the Node.js server, run the generate command again, then restart the server.';
          errorDetails.isPermissionError = true;
        }
        
        res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage, ...errorDetails })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    });
    
    // Handle process errors
    childProcess.on('error', (error) => {
      console.error('Error generating Prisma client:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate Prisma client', error: error.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('Error in generatePrisma controller:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate Prisma client', error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

// Full deployment flow on /api/prisma/git-pull:
// 1) pm2 stop iot
// 2) git pull origin main
// 3) npm install
// 4) npx prisma generate
// 5) pm2 start iot
exports.gitPull = async (req, res) => {
  try {
    // Get the project root directory
    const projectRoot = path.join(__dirname, '..');
    
    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial message
    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        message:
          'Starting deployment: stop pm2 -> git pull -> npm install -> prisma generate -> start pm2',
      })}\n\n`
    );

    const isWin = process.platform === 'win32';
    const pm2Command = isWin ? 'pm2.cmd' : 'pm2';
    const npmCommand = isWin ? 'npm.cmd' : 'npm';
    const npxCommand = isWin ? 'npx.cmd' : 'npx';

    // 1) Stop PM2 process
    await runCommandWithStreaming(res, {
      step: 'stop-pm2',
      command: pm2Command,
      args: ['stop', 'iot'],
      cwd: projectRoot,
      startMessage: 'Stopping PM2 process "iot"...',
      successMessage: 'PM2 process "iot" stopped successfully.',
      errorMessage: 'Failed to stop PM2 process "iot".',
    });

    // 2) Git pull
    await runCommandWithStreaming(res, {
      step: 'git-pull',
      command: 'git',
      args: ['pull', 'origin', 'main'],
      cwd: projectRoot,
      startMessage: 'Pulling latest code from git (origin/main)...',
      successMessage: 'Git pull completed successfully.',
      errorMessage: 'Failed to pull from git main branch.',
    });

    // 3) npm install
    await runCommandWithStreaming(res, {
      step: 'npm-install',
      command: npmCommand,
      args: ['install'],
      cwd: projectRoot,
      startMessage: 'Running npm install...',
      successMessage: 'npm install completed successfully.',
      errorMessage: 'Failed to run npm install.',
    });

    // 4) npx prisma generate
    await runCommandWithStreaming(res, {
      step: 'prisma-generate',
      command: npxCommand,
      args: ['prisma', 'generate'],
      cwd: projectRoot,
      startMessage: 'Generating Prisma client (npx prisma generate)...',
      successMessage: 'Prisma client generated successfully.',
      errorMessage: 'Failed to generate Prisma client.',
    });

    // 5) Start PM2 process again
    await runCommandWithStreaming(res, {
      step: 'start-pm2',
      command: pm2Command,
      args: ['start', 'iot'],
      cwd: projectRoot,
      startMessage: 'Starting PM2 process "iot"...',
      successMessage: 'PM2 process "iot" started successfully.',
      errorMessage: 'Failed to start PM2 process "iot".',
    });

    // All steps done
    res.write(
      `data: ${JSON.stringify({
        type: 'success',
        message:
          'Deployment completed successfully: pm2 stop -> git pull -> npm install -> prisma generate -> pm2 start',
      })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in gitPull controller:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message:
          'Deployment failed while running one of the steps (pm2 / git / npm / prisma). Check logs for details.',
        error: error.message,
      })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

// NPM install with real-time terminal output
exports.npmInstall = async (req, res) => {
  try {
    // Get the project root directory
    const projectRoot = path.join(__dirname, '..');
    
    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial message
    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting npm install...' })}\n\n`);
    
    // Execute npm install command with spawn for real-time output
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['install'];
    
    const childProcess = spawn(command, args, {
      cwd: projectRoot,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    
    // Stream stdout
    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('NPM stdout:', text);
      res.write(`data: ${JSON.stringify({ type: 'stdout', data: text })}\n\n`);
    });
    
    // Stream stderr
    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error('NPM stderr:', text);
      res.write(`data: ${JSON.stringify({ type: 'stderr', data: text })}\n\n`);
    });
    
    // Handle process completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log('NPM install completed successfully');
        res.write(`data: ${JSON.stringify({ type: 'success', message: 'NPM install completed successfully', output: output })}\n\n`);
      } else {
        console.error('NPM install failed with code:', code);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to run npm install', code: code, output: output })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    });
    
    // Handle process errors
    childProcess.on('error', (error) => {
      console.error('Error running npm install:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to run npm install', error: error.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('Error in npmInstall controller:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to run npm install', error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

// General terminal command execution with real-time output
exports.executeCommand = async (req, res) => {
  try {
    const { command, args, cwd } = req.body;
    
    // Validate command
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }
    
    // Get the project root directory or use provided cwd
    const projectRoot = cwd || path.join(__dirname, '..');
    
    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial message
    const commandString = args && args.length > 0 
      ? `${command} ${args.join(' ')}` 
      : command;
    res.write(`data: ${JSON.stringify({ type: 'start', message: `Starting command: ${commandString}` })}\n\n`);
    
    // Parse command and arguments
    let executableCommand = command;
    let commandArgs = args || [];
    
    // Handle Windows vs Unix commands
    if (process.platform === 'win32') {
      // For Windows, use cmd.exe for shell commands
      if (command.includes(' ') || !command.includes('\\') && !command.includes('/')) {
        // It's a shell command, use cmd
        executableCommand = 'cmd';
        commandArgs = ['/c', command, ...commandArgs];
      }
    }
    
    // Execute command with spawn for real-time output
    const childProcess = spawn(executableCommand, commandArgs, {
      cwd: projectRoot,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    
    // Stream stdout
    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('Terminal stdout:', text);
      res.write(`data: ${JSON.stringify({ type: 'stdout', data: text, timestamp: new Date().toISOString() })}\n\n`);
    });
    
    // Stream stderr
    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error('Terminal stderr:', text);
      res.write(`data: ${JSON.stringify({ type: 'stderr', data: text, timestamp: new Date().toISOString() })}\n\n`);
    });
    
    // Handle process completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Command executed successfully');
        res.write(`data: ${JSON.stringify({ type: 'success', message: 'Command executed successfully', exitCode: code, output: output })}\n\n`);
      } else {
        console.error('Command failed with code:', code);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Command execution failed', exitCode: code, output: output })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'end', exitCode: code })}\n\n`);
      res.end();
    });
    
    // Handle process errors
    childProcess.on('error', (error) => {
      console.error('Error executing command:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to execute command', error: error.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('Error in executeCommand controller:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to execute command', error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

// Get terminal activity logs (for Postman/regular HTTP requests)
exports.getTerminalLogs = async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    
    let logs = terminalActivity.logs;
    
    // Filter by type if provided
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    // Get last N logs
    const limitedLogs = logs.slice(-parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: limitedLogs.length,
      total: terminalActivity.logs.length,
      data: limitedLogs
    });
  } catch (error) {
    console.error('Error in getTerminalLogs controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get terminal logs',
      error: error.message
    });
  }
};

// Stream terminal activity (console logs) in real-time (for browser/SSE clients)
exports.getTerminalActivity = async (req, res) => {
  try {
    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to terminal activity stream', timestamp: new Date().toISOString() })}\n\n`);
    
    // Send a keep-alive comment every 30 seconds
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch (error) {
        clearInterval(keepAliveInterval);
        terminalActivity.removeClient(res);
      }
    }, 30000);
    
    // Add client to terminal activity monitor
    terminalActivity.addClient(res);
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      terminalActivity.removeClient(res);
      console.log('Terminal activity client disconnected');
    });
    
    // Handle request abort
    req.on('aborted', () => {
      clearInterval(keepAliveInterval);
      terminalActivity.removeClient(res);
    });
    
  } catch (error) {
    console.error('Error in getTerminalActivity controller:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to stream terminal activity', error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  }
};

