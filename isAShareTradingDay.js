const { isWorkday } = require('./isWorkday.min.js');

/**金融行业从业者 周末不上班 */
function isWeekend(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return d.getDay() % 6 === 0;
}

function isFinanceWorkDay(date = new Date()) {
    // 周末A股永远不开市，直接短路
    if (isWeekend(date))
        return false;
    return isWorkday(date);
}

module.exports = { isWeekend, isFinanceWorkDay };
