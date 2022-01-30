
export function bodyStringIsNotNullOrEmpty(param) {
    return typeof param !== "undefined" && param != null && param.length > 0;
}

export function isRequestAuthorized(req) {
    if (req == null) {
        return true;
    }
    const secret = req.header('secret');
    if (secret != "test") {
        return false;
    }
    return true;
}
