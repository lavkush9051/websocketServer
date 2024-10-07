const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Initialize express app
const app = express();

// Apply CORS middleware
app.use(cors({
  origin: 'https://localhost:44364', // Your ASP.NET client's origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['my-custom-header'],
  credentials: true
}));

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const wsUrl = 'wss://ws.coincap.io/prices?assets=bitcoin'; // Example WebSocket API for Bitcoin prices
const ws = new WebSocket(wsUrl);

// Variable to keep track of the number of records sent
let recordsSent = 0;
let sending = true; // Flag to control when to pause and resume

// ws.on('message', (data) => {
//   try {
//     const decodedData = data.toString();
//     const jsonData = JSON.parse(decodedData);
//     const bitcoinPrice = jsonData.bitcoin;
//     console.log('Bitcoin Price:', bitcoinPrice);

//     // Broadcast the Bitcoin price to all connected WebSocket clients
//     if (sending) {
//       wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({
//             event: 'dataUpdate',
//             price: bitcoinPrice
//           }));
//         }
//       });

//       recordsSent++;

//       // If 50 records have been sent, pause for 10 seconds
//       if (recordsSent >= 50) {
//         console.log('Pausing for 10 seconds...');
//         sending = false;
//         setTimeout(() => {
//           recordsSent = 0; // Reset the counter
//           sending = true; // Resume sending records
//           console.log('Resuming...');
//         }, 10000); // Pause for 10 seconds
//       }
//     }
//   } catch (error) {
//     console.error('Error processing WebSocket message:', error);
//   }
// });

wss.on('connection', (ws) => {
  console.log('A user connected');

  // Listen for userData event
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received data:', data);

      // Broadcast the data to all connected clients
      if (sending) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              event: 'broadcastMessage',
              data: data
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('A user disconnected');
  });
});

// Function to broadcast timestamp to all connected clients every 10 seconds
setInterval(() => {
  if (sending) {
    let utcDate = new Date();
    let timestamp = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    timestamp = timestamp.toISOString().replace('T', ' ').replace('Z', '');
    console.log('Sending timestamp:', timestamp);

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          event: 'timeUpdate',
          timestamp: timestamp
        }));
      }
    });

    recordsSent++;

    // If 50 records have been sent, pause for 10 seconds
    if (recordsSent >= 50) {
      console.log('Pausing for 10 seconds...');
      sending = false;
      setTimeout(() => {
        recordsSent = 0; // Reset the counter
        sending = true; // Resume sending records
        console.log('Resuming...');
      }, 10000); // Pause for 10 seconds
    }
  }
}, 2000); // 10000ms = 10 seconds

// Start the server
server.listen(8080, () => {
  console.log('WebSocket server running at http://localhost:3000');
});
