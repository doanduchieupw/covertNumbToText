const ReadingConfig = {
  separator: ' ',
  unit: ['đồng'],
  negativeSign: '-',
  pointSign: '.',
  thousandSign: ',',
  periodSize: 3,
  filledDigit: '0',

  digits: ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'],
  units: [[], ['nghìn'], ['triệu'], ['tỉ'], ['nghìn', 'tỉ'], ['triệu', 'tỉ'], ['tỉ', 'tỉ']],

  negativeText: 'âm',
  pointText: 'chấm',
  oddText: 'lẻ',
  tenText: 'mười',
  hundredText: 'trăm',

  oneToneText: 'mốt',
  fourToneText: 'tư',
  fiveToneText: 'lăm',
  tenToneText: 'mươi',
};

function readLastTwoDigits(config, b, c) {
  const output = [];
  switch (b) {
    case 0: {
      output.push(config.digits[c]);
      break;
    }
    case 1: {
      output.push(config.tenText);
      if (c === 5) {
        output.push(config.fiveToneText);
      } else if (c !== 0) {
        output.push(config.digits[c]);
      }
      break;
    }
    default: {
      output.push(config.digits[b], config.tenToneText);
      if (c === 1) {
        output.push(config.oneToneText);
      } else if (c === 4) {
        output.push(config.fourToneText);
      } else if (c === 5) {
        output.push(config.fiveToneText);
      } else if (c !== 0) {
        output.push(config.digits[c]);
      }
      break;
    }
  }
  return output;
}

function readThreeDigits(config, a, b, c, readZeroHundred) {
  const output = [];
  const hasHundred = a !== 0 || readZeroHundred;
  if (hasHundred) {
    output.push(config.digits[a], config.hundredText);
  }
  if (hasHundred && b === 0) {
    if (c === 0) {
      return output;
    }
    output.push(config.oddText);
  }
  output.push(...readLastTwoDigits(config, b, c));
  return output;
}

function removeThousandsSeparators(config, number) {
  const regex = new RegExp(config.thousandSign, 'g');
  return number.replace(regex, '');
}

function trimRedundantZeros(config, number) {
  return number.includes(config.pointSign)
    ? trimLeft(trimRight(number, config.filledDigit), config.filledDigit)
    : trimLeft(number, config.filledDigit);
}

function addLeadingZerosToFitPeriod(config, number) {
  const newLength = Math.ceil(number.length / config.periodSize) * config.periodSize;
  return number.padStart(newLength, config.filledDigit);
}

function zipIntegralPeriods(config, digits) {
  const output = [];
  const periodCount = Math.ceil(digits.length / config.periodSize);
  for (let i = 0; i < periodCount; i++) {
    const [a, b, c] = digits.slice(i * config.periodSize, (i + 1) * config.periodSize);
    output.push([a, b, c]);
  }
  return output;
}

function parseNumberData(config, number) {
  let numberString = removeThousandsSeparators(config, number);

  const isNegative = numberString[0] === config.negativeSign;
  numberString = isNegative ? numberString.substring(1) : numberString;
  numberString = trimRedundantZeros(config, numberString);

  const pointPos = numberString.indexOf(config.pointSign);
  let integralString = pointPos === -1 ? numberString : numberString.substring(0, pointPos);
  const fractionalString = pointPos === -1 ? '' : numberString.substring(pointPos + 1);
  integralString = addLeadingZerosToFitPeriod(config, integralString);

  const integralDigits = splitToDigits(integralString);
  const fractionalDigits = splitToDigits(fractionalString);

  const integralPart = zipIntegralPeriods(config, integralDigits);
  if (integralPart.length === 0) {
    integralPart.push([0, 0, 0]);
  }
  const fractionalPart = fractionalDigits;
  return { isNegative, integralPart, fractionalPart };
}

function readIntegralPart(config, periods) {
  const output = [];
  const isSinglePeriod = periods.length === 1;
  for (const [index, period] of periods.entries()) {
    const isFirstPeriod = index === 0;
    const [a, b, c] = period;
    if (a !== 0 || b !== 0 || c !== 0 || isSinglePeriod) {
      output.push(...readThreeDigits(config, a, b, c, !isFirstPeriod), ...config.units[periods.length - 1 - index]);
    }
  }
  return output;
}

function readFractionalPart(config, digits) {
  const output = [];
  switch (digits.length) {
    case 2: {
      const [b, c] = digits;
      output.push(...readLastTwoDigits(config, b, c));
      break;
    }
    case 3: {
      const [a, b, c] = digits;
      output.push(...readThreeDigits(config, a, b, c, true));
      break;
    }
    default: {
      for (const digit of digits) {
        output.push(config.digits[digit]);
      }
      break;
    }
  }
  return output;
}

function readNumber(config, numberData) {
  const output = [];
  output.push(...readIntegralPart(config, numberData.integralPart));
  if (numberData.fractionalPart.length !== 0) {
    output.push(config.pointText, ...readFractionalPart(config, numberData.fractionalPart));
  }
  if (numberData.isNegative) {
    output.unshift(config.negativeText);
  }
  output.push(...config.unit);
  return output.join(config.separator);
}

function trimLeft(str, char) {
  if (str === '') {
    return '';
  }
  let pos = 0;
  while (str[pos] === char[0]) {
    pos++;
  }
  return str.substring(pos);
}

function trimRight(str, char) {
  if (str === '') {
    return '';
  }
  let lastPos = str.length - 1;
  while (str[lastPos] === char[0]) {
    lastPos--;
  }
  return str.substring(0, lastPos + 1);
}

function splitToDigits(str) {
  return str.split('').map((digit) => parseInt(digit));
}

function validateNumber(value) {
  switch (typeof value) {
    case 'string': {
      return value;
    }
    case 'bigint': {
      return value.toString();
    }

    default:
      break;
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const number = '3000001';
const validatedNumber = validateNumber(number);
const numberData = parseNumberData(ReadingConfig, validatedNumber);
const result = readNumber(ReadingConfig, numberData);
console.log(capitalizeFirstLetter(result));
