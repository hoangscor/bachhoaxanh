const { exec } = require('child_process');
const axios = require('axios');

console.log('='.repeat(70));
console.log('🔄 SERVER RESTART SCRIPT');
console.log('='.repeat(70));

async function restartServer() {
    console.log('\n📍 Step 1: Finding process on port 3000...');

    exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
        if (stdout) {
            console.log('   ✅ Found process on port 3000');

            // Extract PID
            const lines = stdout.trim().split('\n');
            const pids = new Set();

            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0') {
                    pids.add(pid);
                }
            });

            console.log(`   📊 PIDs to kill: ${Array.from(pids).join(', ')}`);

            // Kill processes
            console.log('\n🔪 Step 2: Killing processes...');
            pids.forEach(pid => {
                exec(`taskkill /F /PID ${pid}`, (err, out) => {
                    if (!err) {
                        console.log(`   ✅ Killed PID ${pid}`);
                    }
                });
            });

            // Wait then restart
            setTimeout(() => {
                console.log('\n🚀 Step 3: Starting new server...');
                const serverProcess = exec('npm run dev', {
                    cwd: 'k:/CII Gemini/bachhoaxanh'
                });

                serverProcess.stdout.on('data', (data) => {
                    console.log(`   ${data.trim()}`);
                });

                serverProcess.stderr.on('data', (data) => {
                    console.error(`   ❌ ${data.trim()}`);
                });

                // Check if server is up
                setTimeout(async () => {
                    console.log('\n🔍 Step 4: Verifying server...');
                    try {
                        const response = await axios.get('http://localhost:3000');
                        if (response.status === 200) {
                            console.log('   ✅ Server is UP and running!');
                            console.log('\n' + '='.repeat(70));
                            console.log('✅ RESTART COMPLETE!');
                            console.log('='.repeat(70));
                            console.log('🌐 Open: http://localhost:3000');
                            console.log('='.repeat(70));
                        }
                    } catch (e) {
                        console.log('   ⚠️  Server may still be starting...');
                        console.log('   Please check manually: http://localhost:3000');
                    }
                }, 5000);

            }, 3000);

        } else {
            console.log('   ⚠️  No process found on port 3000');
            console.log('\n🚀 Starting server directly...');

            const serverProcess = exec('npm run dev', {
                cwd: 'k:/CII Gemini/bachhoaxanh'
            });

            serverProcess.stdout.on('data', (data) => {
                console.log(`   ${data.trim()}`);
            });
        }
    });
}

restartServer();
