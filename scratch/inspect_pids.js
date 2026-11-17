import { execSync } from 'child_process';

const pids = [4856, 5180, 9476, 19324, 20200, 28172];
const netstat = execSync('netstat -ano').toString();

for (const line of netstat.split('\n')) {
  for (const pid of pids) {
    if (line.includes(pid.toString())) {
      console.log(`PID ${pid}: ${line.trim()}`);
    }
  }
}

