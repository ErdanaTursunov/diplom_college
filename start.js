const concurrently = require('concurrently');

concurrently([
  { command: 'npm run start-backend', name: 'backend', prefixColor: 'green' },
  { command: 'npm run start-frontend', name: 'frontend', prefixColor: 'blue' }
])
  .result.then(() => {
    console.log('Both projects started successfully');
  })
  .catch((error) => {
    console.error('Error starting projects:', error);
  });
