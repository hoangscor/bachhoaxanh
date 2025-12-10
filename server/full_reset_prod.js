const { exec } = require('child_process');

console.log('='.repeat(70));
console.log('🔄 FULL SYSTEM UPDATE (Use after Crawl completes)');
console.log('='.repeat(70));

const RESET_SCRIPT = 'server/reset_database.js';

// Update reset_database.js to use FULL catalog
const fs = require('fs');
let content = fs.readFileSync(RESET_SCRIPT, 'utf8');
content = content.replace(
    /const CATALOG_FILE = .*/,
    "const CATALOG_FILE = 'server/data/bhx_browser_full.json';"
);
fs.writeFileSync(RESET_SCRIPT, content);
console.log('✅ Configured database reset to use FULL CRAWL data.');

// Execute Flow
function execute(cmd) {
    return new Promise(resolve => {
        exec(cmd, (err, stdout) => {
            if (err) console.log(`   ⚠️ ${err.message}`);
            else console.log(`   ✅ ${stdout.trim().split('\n').pop()}`);
            resolve();
        });
    });
}

async function run() {
    // 1. Kill Server
    console.log('\n🛑 Step 1: Stopping Server...');
    await new Promise(r => {
        exec('netstat -ano | findstr :3000', (err, stdout) => {
            if (stdout) {
                const pid = stdout.split(/\s+/).pop();
                if (pid && pid !== '0') exec(`taskkill /F /PID ${pid}`);
            }
            setTimeout(r, 2000);
        });
    });

    // 2. Reset DB
    console.log('\n🗑️  Step 2: Resetting Database...');
    const { spawn } = require('child_process');
    const reset = spawn('node', ['server/reset_database.js']);
    reset.stdout.on('data', d => process.stdout.write(`   ${d}`));

    reset.on('close', () => {
        // 3. Start Server
        console.log('\n🚀 Step 3: Starting Server...');
        const server = spawn('npm', ['run', 'dev'], { cwd: 'k:/CII Gemini/bachhoaxanh', shell: true });
        server.stdout.on('data', d => console.log(`   [SERVER] ${d}`));
        console.log('\n✅ DONE! Server restarting...');
    });
}

run();
