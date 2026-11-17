import http from 'http';

http.get('http://127.0.0.1:5001/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('5001 Response:', data));
}).on('error', (err) => {
  console.log('5001 Error:', err.message);
});

