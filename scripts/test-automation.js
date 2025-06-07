const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');

const APP_PORT = 3000;
const APP_URL = `http://localhost:${APP_PORT}`;
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // 1 second

let appProcess = null;
let appStartedByScript = false;

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
}

function waitForServer(url, timeout = MAX_WAIT_TIME) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let consecutiveSuccesses = 0;
    const requiredSuccesses = 3; // Need 3 consecutive successful checks
    
    function checkServer() {
      const timeElapsed = Date.now() - startTime;
      
      if (timeElapsed >= timeout) {
        reject(new Error(`Server failed to start within ${timeout}ms`));
        return;
      }
      
      // Check if the login page is accessible using Node.js http
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/login',
        method: 'GET',
        timeout: 8000
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if ((res.statusCode === 200 || res.statusCode === 302) && data.length > 0) {
            consecutiveSuccesses++;
            console.log(`[CHECK ${consecutiveSuccesses}/${requiredSuccesses}] Server responding...`);
            
            if (consecutiveSuccesses >= requiredSuccesses) {
              console.log('✅ Server and routes are fully ready!');
              resolve();
            } else {
              setTimeout(checkServer, 1500); // Slower check for stability
            }
          } else {
            consecutiveSuccesses = 0;
            console.log(`[WAIT] Server not ready yet... (${Math.round(timeElapsed/1000)}s)`);
            setTimeout(checkServer, CHECK_INTERVAL);
          }
        });
      });
      
      req.on('error', () => {
        consecutiveSuccesses = 0;
        console.log(`[WAIT] Server not ready yet... (${Math.round(timeElapsed/1000)}s)`);
        setTimeout(checkServer, CHECK_INTERVAL);
      });
      
      req.on('timeout', () => {
        req.destroy();
        consecutiveSuccesses = 0;
        console.log(`[WAIT] Server timeout... (${Math.round(timeElapsed/1000)}s)`);
        setTimeout(checkServer, CHECK_INTERVAL);
      });
      
      req.end();
    }
    
    checkServer();
  });
}

function startApp() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting the application...');
    
    // Use bun run dev as specified in package.json
    appProcess = spawn('bun', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    let appReady = false;
    
    appProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[APP] ${output.trim()}`);
      
      // Check if Next.js has started successfully
      if ((output.includes('Ready') || output.includes('started server') || output.includes('Local:')) && !appReady) {
        appReady = true;
        appStartedByScript = true;
        // Wait longer for routes and build to be fully ready
        setTimeout(() => resolve(), 8000);
      }
    });
    
    appProcess.stderr.on('data', (data) => {
      console.error(`[APP ERROR] ${data.toString().trim()}`);
    });
    
    appProcess.on('error', (error) => {
      console.error('Failed to start application:', error);
      reject(error);
    });
    
    appProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Application process exited with code ${code}`);
      }
    });
    
    // Fallback timeout
    setTimeout(() => {
      if (!appStartedByScript) {
        appStartedByScript = true;
        resolve();
      }
    }, 10000);
  });
}

function runCypressTests() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Running Cypress tests...');
    
    // Get command line arguments to determine if we want headed or headless mode
    const args = process.argv.slice(2);
    const isHeadless = args.includes('--headless');
    const shouldRecord = args.includes('--record');
    
    let cypressArgs = isHeadless ? ['run'] : ['run', '--headed'];
      if (shouldRecord) {
      const recordKey = process.env.CYPRESS_RECORD_KEY;
      if (!recordKey) {
        console.error('❌ CYPRESS_RECORD_KEY environment variable is required for recording');
        reject(new Error('Missing CYPRESS_RECORD_KEY'));
        return;
      }
      cypressArgs.push('--record', '--key', recordKey);
    }
    
    const cypressProcess = spawn('bun', ['run', 'cypress:run', ...cypressArgs.slice(1)], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    cypressProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All tests passed!');
        resolve();
      } else {
        console.error(`❌ Tests failed with exit code ${code}`);
        reject(new Error(`Cypress tests failed with exit code ${code}`));
      }
    });
    
    cypressProcess.on('error', (error) => {
      console.error('Failed to run Cypress tests:', error);
      reject(error);
    });
  });
}

function cleanup() {
  if (appProcess && appStartedByScript) {
    console.log('🧹 Cleaning up: stopping the application...');
    appProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if it doesn't stop gracefully
    setTimeout(() => {
      if (appProcess && !appProcess.killed) {
        appProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

function killNodeProcesses() {
  console.log('🔥 Killing Node.js runtime processes...');
  
  // Kill all node processes on Windows
  if (process.platform === 'win32') {
    exec('taskkill /F /IM node.exe', (error) => {
      if (error) {
        console.log('Note: No additional Node.js processes found to kill');
      } else {
        console.log('✅ Node.js processes terminated');
      }
    });
    
    // Also kill bun processes if any
    exec('taskkill /F /IM bun.exe', (error) => {
      if (error) {
        console.log('Note: No Bun processes found to kill');
      } else {
        console.log('✅ Bun processes terminated');
      }
    });
  } else {
    // Kill all node processes on Unix-like systems
    exec('pkill -f node', (error) => {
      if (error) {
        console.log('Note: No additional Node.js processes found to kill');
      } else {
        console.log('✅ Node.js processes terminated');
      }
    });
    
    // Also kill bun processes if any
    exec('pkill -f bun', (error) => {
      if (error) {
        console.log('Note: No Bun processes found to kill');
      } else {
        console.log('✅ Bun processes terminated');
      }
    });
  }
}

async function main() {
  try {
    console.log('🔍 Checking if application is already running...');
    
    const isPortInUse = await checkPortInUse(APP_PORT);
    
    if (isPortInUse) {
      console.log(`✅ Application is already running on port ${APP_PORT}`);
      console.log('🔗 Verifying server is responding...');
      await waitForServer(APP_URL);
    } else {
      console.log(`❌ Application is not running on port ${APP_PORT}`);
      await startApp();
      
      // Wait for the server to be fully ready
      console.log('⏳ Waiting for server to be fully ready...');
      await waitForServer(APP_URL);
    }
    
    console.log('🎬 Starting Cypress tests...');
    console.log(`📍 Testing against: ${APP_URL}`);
    
    // Run Cypress tests
    await runCypressTests();
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    process.exit(1);
  } finally {
    cleanup();
    killNodeProcesses();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  cleanup();
  process.exit(0);
});

// Run the main function
main();