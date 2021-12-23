function createRandomInt (minRandNum, maxRandNum) {
    const randomInteger = Math.floor(Math.random() * (maxRandNum - minRandNum + 1)) + minRandNum;
    return randomInteger;
}

module.exports = {
    createRandomInt
}