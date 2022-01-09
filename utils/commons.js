function createRandomInt (minRandNum, maxRandNum) {
    const randomInteger = Math.floor(Math.random() * (maxRandNum - minRandNum + 1)) + minRandNum;
    return randomInteger;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    createRandomInt,
    sleep
}