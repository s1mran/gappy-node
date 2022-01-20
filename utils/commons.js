function createRandomInt (minRandNum, maxRandNum) {
    const randomInteger = Math.floor(Math.random() * (maxRandNum - minRandNum + 1)) + minRandNum;
    return randomInteger;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function formatDate(date) {
  return `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} ${date.getDay()}`;
}

module.exports = {
    createRandomInt,
    sleep,
    formatDate
}