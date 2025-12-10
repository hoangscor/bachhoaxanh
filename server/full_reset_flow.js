const { exec } = require('child_process');

console.log('='.repeat(70));
console.log('🔄 FULL SYSTEM RESET FLOW');
console.log('='.repeat(70));

function execute(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error && !stderr.includes('not found')) { // Ignore valid "not found" errors
                console.warn(`   ⚠️  Command note: ${error.message}`);
                resolve(stdout); // Resolve anyway
                return;
            }
            if (stderr) console.warn(`   ⚠️  Stderr: ${stderr}`);
            console.log(`   ✅ Output: ${stdout.trim().slice(0, 100)}...`);
            resolve(stdout);
        });
    });
}

async function run() {
    // 1. Kill Port 3000
    console.log('\n🛑 Step 1: Stopping Server...');
    await new Promise(resolve => {
        exec('netstat -ano | findstr :3000', (err, stdout) => {
            if (stdout) {
                const pids = stdout.trim().split('\n').map(l => l.trim().split(/\s+/).pop());
                const uniquePids = [...new Set(pids.filter(p => p && p !== '0'))];

                if (uniquePids.length > 0) {
                    console.log(`   Killing PIDs: ${uniquePids.join(', ')}`);
                    uniquePids.forEach(pid => exec(`taskkill /F /PID ${pid}`));
                }
            }
            setTimeout(resolve, 2000); // Verify wait
        });
    });

    // 2. Reset Database
    console.log('\n🗑️  Step 2: Resetting Database...');
    await execute('node server/reset_database.js');

    // 3. Start Server
    console.log('\n🚀 Step 3: Starting Server...');
    const server = exec('npm run dev', { cwd: 'k:/CII Gemini/bachhoaxanh' });

    server.stdout.on('data', (data) => console.log(`   [SERVER] ${data.trim()}`));
    server.stderr.on('data', (data) => console.error(`   [SERVER ERR] ${data.trim()}`));

    console.log('\n✅ DONE! Server is restarting...');
    console.log('🌐 Check http://localhost:3000 in 10 seconds');
}

run();
