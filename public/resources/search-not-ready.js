//=============================================================================
// The search index hasn't been built yet, connect to a socket and be notified
// when to refresh.

const socket = io();
socket.on('index-ready', function() {
    // The index is ready, refresh the page.
    window.location.reload(true);
});
