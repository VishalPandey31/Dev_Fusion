try {
    await import('./server.js');
    console.log("Server imported successfully");
} catch (err) {
    console.error("FULL ERROR DETAILS:");
    console.error(err.code);
    console.error(err.message);
    console.error(err.stack);
}
