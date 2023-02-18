
const MARKET_STATUS_URL = require('../constant').MARKET_STATUS_URL;
const INDICES_WATCH_URL = require('../constant').INDICES_WATCH_URL;
const SECTORS_LIST = require('../constant').SECTORS_LIST;
const QUOTE_INFO_URL = require('../constant').QUOTE_INFO_URL;
const GET_QUOTE_URL = require('../constant').GET_QUOTE_URL;
const GAINERS_URL = require('../constant').GAINERS_URL;
const LOSERS_URL = require('../constant').LOSERS_URL;
const ADVANCES_DECLINES_URL = require('../constant').ADVANCES_DECLINES_URL;
const INDEX_STOCKS_URL = require('../constant').INDEX_STOCKS_URL;
const INTRADAY_URL = require('../constant').INTRADAY_URL;
const INDEX_CHARTDATA_URL = require('../constant').INDEX_CHARTDATA_URL;
const SEARCH_URL = require('../constant').SEARCH_URL;
const STOCK_OPTIONS_URL = require('../constant').STOCK_OPTIONS_URL;
const YEAR_HIGH_URL = require('../constant').YEAR_HIGH_URL;
const YEAR_LOW_URL = require('../constant').YEAR_LOW_URL;
const TOP_VALUE_URL = require('../constant').TOP_VALUE_URL;
const TOP_VOLUME_URL = require('../constant').TOP_VOLUME_URL;
const NEW_CHART_DATA_URL = require('../constant').NEW_CHART_DATA_URL;
const fetch = require('node-fetch');

function getTime(periodType, time) {
  if (periodType === 1) {
    switch (time) {
      case 'week':
        return 2;
      case 'month':
        return 3;
      case 'year':
        return 1;
      default:
        return 2;
    }
  } else {
    switch (time) {
      case 1:
        return 1;
      case 5:
        return 2;
      case 15:
        return 3;
      case 30:
        return 4;
      case 60:
        return 5;
      default:
        return 1;
    }
  }
}

function stripTags(string) {
  return string.replace(/<(.|\n)*?>/g, '').trim();
}

function searchTransformer(isIndex) {
  let matcher = '';
  if (isIndex) {
    matcher = /underlying=(.*?)&/;
  } else {
    matcher = /symbol=(.*?)&/;
  }

  return function (data) {
    const matches = data.match(/<li>(.*?)<\/li>/g);
    return matches.map(function (value1) {
      const symbol = value1.match(matcher);
      value1 = stripTags(value1).replace(symbol[1], '');
      return {
        name: value1 || '',
        symbol: symbol[1] || ''
      }
    });
  }
}


function getMarketStatus() {
  return fetch(MARKET_STATUS_URL)
    .then(response => response.text())
    .then(data => ({
      status: JSON.parse(data).NormalMktStatus
    }));
}

function getIndices() {
  return fetch(INDICES_WATCH_URL);
}

function getSectorsList() {
  return fetch(SECTORS_LIST);
}

function getQuotes(symbol) {
  return fetch(GET_QUOTE_URL + encodeURIComponent(symbol), {
    headers: {
      Referer: GET_QUOTE_URL + encodeURIComponent(symbol),
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
}
function getQuoteInfo(symbol) {
  return fetch(QUOTE_INFO_URL + encodeURIComponent(symbol), {
    headers: {
      Referer: GET_QUOTE_URL + encodeURIComponent(symbol),
      'X-Requested-With': 'XMLHttpRequest'
    }
  }).then(res => res.json());
}

function getGainers() {
  return fetch(GAINERS_URL).then(res => res.json());
}

function getLosers() {
  return fetch(LOSERS_URL).then(res => res.json());
}

function getInclineDecline() {
  return fetch(ADVANCES_DECLINES_URL).then(res => res.json());
}

function getIndexStocks(slug) {
  return fetch(INDEX_STOCKS_URL + encodeURI(slug) + 'StockWatch.json').then(res => res.json());
}

function getIntraDayData(symbol, time) {
  var periodType = typeof time === 'string' ? 1 : 2;
  var period = getTime(periodType, time);

  return fetch(INTRADAY_URL + encodeURIComponent(symbol) + '&Periodicity=' + period + '&PeriodType=' + periodType).then(res => res.json());
}

function getChartDataNew(symbol, time) {
  var periodType = typeof time === 'string' ? 1 : 2;
  var period = getTime(periodType, time);

  return fetch(NEW_CHART_DATA_URL, {
    method: 'POST',
    body: `Instrument=FUTSTK&CDSymbol=${symbol}&Segment=CM&Series=EQ&CDExpiryMonth=1&FOExpiryMonth=1&IRFExpiryMonth=&CDIntraExpiryMonth=&FOIntraExpiryMonth=&IRFIntraExpiryMonth=&CDDate1=&CDDate2=&PeriodType=${periodType}&Periodicity=${period}&ct0=g1|1|1&ct1=g2|2|1&ctcount=2&time=${new Date().getTime()}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'nseindia.com',
      Referer: 'https://nseindia.com/ChartApp/install/charts/mainpage.jsp'
    }
  }).then(res => res.json());
}

function getIndexChartData(symbol, time) {
  var periodType = typeof time === 'string' ? 1 : 2;
  var period = getTime(periodType, time);

  return fetch(INDEX_CHARTDATA_URL + encodeURIComponent(symbol) + '&Periodicity=' + period + '&PeriodType=' + periodType).then(res => res.json());
}

function searchStocks(searchString) {
  var options = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www1.nseindia.com/ChartApp/install/charts/mainpage.jsp',
      Host: 'www1.nseindia.com'
    },
    transformResponse: searchTransformer(false)
  };

  return fetch(SEARCH_URL + encodeURIComponent(searchString), options).then(res => res.json());
}
function getStockFuturesData(symbol, expiryDate, isIndex) {
  var params = {
    'underlying': symbol,
    'instrument': 'FUTSTK',
    'expiry': expiryDate,
    'type': 'SELECT',
    'strike': 'SELECT'
  };


  if (isIndex === true) {
    params['instrument'] = 'FUTIDX';
  }

  const url = new URL(STOCK_OPTIONS_URL);
  url.search = new URLSearchParams(params);

  return fetch(url, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Host: 'www1.nseindia.com',
      'Referer': 'https://www1.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuoteFO.jsp?underlying=' + symbol + '&instrument=' + params['instrument'] + '&type=SELECT&strike=SELECT&expiry=' + expiryDate,
    }
  });
}

function get52WeekHigh() {
  return fetch(YEAR_HIGH_URL, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Host: 'www1.nseindia.com',
      'Referer': 'https://www1.nseindia.com/products/content/equities/equities/eq_new_high_low.htm'
    }
  });
}

function get52WeekLow() {
  return fetch(YEAR_LOW_URL, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Host: 'www1.nseindia.com',
      'Referer': 'https://nseindia.com/products/content/equities/equities/eq_new_high_low.htm'
    }
  });
}

function getTopValueStocks() {
  return fetch(TOP_VALUE_URL, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Host: 'www1.nseindia.com',
      'Referer': 'https://www1.nseindia.com/live_market/dynaContent/live_analysis/most_active_securities.htm'
    }
  });
}

function getTopVolumeStocks() {
  return fetch(TOP_VOLUME_URL, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Host: 'www1.nseindia.com',
      'Referer': 'https://www1.nseindia.com/live_market/dynaContent/live_analysis/most_active_securities.htm'
    }
  });
}

var NSEAPI = {
  getMarketStatus: getMarketStatus,
  getIndices: getIndices,
  getSectorsList: getSectorsList,
  getQuotes: getQuotes,
  getQuoteInfo: getQuoteInfo,
  getGainers: getGainers,
  getLosers: getLosers,
  getInclineDecline: getInclineDecline,
  getIndexStocks: getIndexStocks,
  getIntraDayData: getIntraDayData,
  getIndexChartData: getIndexChartData,
  searchStocks: searchStocks,
  getStockFuturesData: getStockFuturesData,
  get52WeekHigh: get52WeekHigh,
  get52WeekLow: get52WeekLow,
  getTopValueStocks: getTopValueStocks,
  getTopVolumeStocks: getTopVolumeStocks,
  getChartDataNew: getChartDataNew
};

module.exports = NSEAPI;
