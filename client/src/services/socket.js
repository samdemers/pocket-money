import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Listen for new transactions
  onNewTransaction(callback) {
    if (this.socket) {
      this.socket.on('new_transaction', callback);
    }
  }

  // Listen for sync completion
  onSyncComplete(callback) {
    if (this.socket) {
      this.socket.on('sync_complete', callback);
    }
  }

  // Listen for sync start
  onSyncStarted(callback) {
    if (this.socket) {
      this.socket.on('sync_started', callback);
    }
  }

  // Listen for sync errors
  onSyncError(callback) {
    if (this.socket) {
      this.socket.on('sync_error', callback);
    }
  }

  // Request manual sync
  requestManualSync() {
    if (this.socket && this.isConnected) {
      this.socket.emit('manual_sync');
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove specific listener
  removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();