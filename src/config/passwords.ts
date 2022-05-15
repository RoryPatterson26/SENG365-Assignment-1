const hash = async (password: string): Promise<string> => {
    const hashKey = require('crypto').createHash('sha256');
    return hashKey.update(password).digest('hex');
}

export { hash }