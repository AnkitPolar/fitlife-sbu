document.addEventListener('DOMContentLoaded', () => {
    // The updateUserMenu method in auth.js will handle everything
    if (window.auth) {
        auth.updateUserMenu();
    }
});

// Update handleLogout function
function handleLogout() {
    if (window.auth) {
        auth.logout();
    }
}