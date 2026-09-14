const { execSync } = require('child_process');

const envs = {
  NEXT_PUBLIC_APP_NAME: 'Mudmy',
  NEXT_PUBLIC_APP_URL: 'https://mudmy.app',
  NEXT_PUBLIC_ENABLE_ADMIN_PANEL: 'false',
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
};

const project = 'mudmyapp';
const targets = ['production', 'preview', 'development'];

for (const [key, value] of Object.entries(envs)) {
  for (const target of targets) {
    console.log(`Processing ${key} for ${target}...`);
    
    // First, remove existing env if present
    try {
      execSync(`npx vercel env rm ${key} ${target} --yes --project ${project}`, {
        stdio: 'ignore',
        input: 'y\n',
      });
      console.log(`  Removed old ${key} (${target})`);
    } catch (e) {
      // ignore if didn't exist
    }

    // Add new env cleanly without BOM
    try {
      execSync(`npx vercel env add ${key} ${target} --project ${project}`, {
        stdio: ['pipe', 'inherit', 'inherit'],
        input: Buffer.from(`${value}\n`, 'utf8'),
      });
      console.log(`  Added clean ${key}=${value} (${target})`);
    } catch (e) {
      console.error(`  Failed to add ${key} (${target}):`, e.message);
    }
  }
}

console.log('\nAll environment variables updated clean without BOM!');
