export function setAuthRedirect() {
    if (window.location.pathname === '/auth') return;

    sessionStorage.setItem('postLoginRedirect', window.location.pathname);
}
export function getAuthRedirect() {
    return sessionStorage.getItem('postLoginRedirect');
}
export function clearAuthRedirect() {
    sessionStorage.removeItem('postLoginRedirect');
}