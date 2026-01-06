import socket from 'socket.io-client';


let socketInstance = null;


export const initializeSocket = (projectId) => {

    if (socketInstance) {
        return socketInstance;
    }

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    });

    return socketInstance;

}

export const receiveMessage = (eventName, cb) => {
    socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
    if (socketInstance) {
        socketInstance.emit(eventName, data);
    } else {
        console.warn("Socket not initialized. Cannot send message:", eventName);
    }
}

export const removeListener = (eventName) => {
    if (socketInstance) {
        socketInstance.off(eventName);
    }
}