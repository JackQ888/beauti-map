type EaseFunction = (t: number) => number;

function linear(t: number): number {
    return t;
}

function get(amount: number): EaseFunction {
    if (amount < -1) {
        amount = -1;
    } else if (amount > 1) {
        amount = 1;
    }
    return function (t: number): number {
        if (amount === 0) {
            return t;
        }
        if (amount < 0) {
            return t * (t * -amount + 1 + amount);
        }
        return t * ((2 - t) * amount + (1 - amount));
    };
};

function getPowIn(pow: number): EaseFunction {
    return function (t: number): number {
        return Math.pow(t, pow);
    };
};

function getPowOut(pow: number): EaseFunction {
    return function (t: number): number {
        return 1 - Math.pow(1 - t, pow);
    };
};

function getPowInOut(pow: number): EaseFunction {
    return function (t: number): number {
        if ((t *= 2) < 1) return 0.5 * Math.pow(t, pow);
        return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
    };
};



function sineIn(t: number): number {
    return 1 - Math.cos(t * Math.PI / 2);
};

function sineOut(t: number): number {
    return Math.sin(t * Math.PI / 2);
};

function sineInOut(t: number): number {
    return -0.5 * (Math.cos(Math.PI * t) - 1);
};

function getBackIn(amount: number): EaseFunction {
    return function (t: number): number {
        return t * t * ((amount + 1) * t - amount);
    };
};



function getBackOut(amount: number): EaseFunction {
    return function (t: number): number {
        return (--t * t * ((amount + 1) * t + amount) + 1);
    };
};


function getBackInOut(amount: number): EaseFunction {
    amount *= 1.525;
    return function (t: number): number {
        if ((t *= 2) < 1) return 0.5 * (t * t * ((amount + 1) * t - amount));
        return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
    };
};



function circIn(t: number): number {
    return -(Math.sqrt(1 - t * t) - 1);
};

function circOut(t: number): number {
    return Math.sqrt(1 - (--t) * t);
};

function circInOut(t: number): number {
    if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
    return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
};

function bounceIn(t: number): number {
    return 1 - bounceOut(1 - t);
};

function bounceOut(t: number): number {
    if (t < 1 / 2.75) {
        return (7.5625 * t * t);
    } else if (t < 2 / 2.75) {
        return (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
    } else if (t < 2.5 / 2.75) {
        return (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
    } else {
        return (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
    }
};

function bounceInOut(t: number): number {
    if (t < 0.5) return bounceIn(t * 2) * .5;
    return bounceOut(t * 2 - 1) * 0.5 + 0.5;
};

function getElasticIn(amplitude: number, period: number): EaseFunction {
    let pi2 = Math.PI * 2;
    return function (t: number): number {
        if (t === 0 || t === 1) return t;
        let s = period / pi2 * Math.asin(1 / amplitude);
        return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
    };
};


function getElasticOut(amplitude: number, period: number): EaseFunction {
    let pi2 = Math.PI * 2;
    return function (t: number): number {
        if (t === 0 || t === 1) return t;
        let s = period / pi2 * Math.asin(1 / amplitude);
        return (amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1);
    };
};


function getElasticInOut(amplitude: number, period: number): EaseFunction {
    let pi2 = Math.PI * 2;
    return function (t: number): number {
        let s = period / pi2 * Math.asin(1 / amplitude);
        if ((t *= 2) < 1) return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
        return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
    };
}

interface EaseFunctionsMap {
    [key: string]: EaseFunction;
}

const EaseFunctions: EaseFunctionsMap = {
    linear,
    none: linear,
    quadIn: getPowIn(2),
    quadOut: getPowOut(2),
    quadInOut: getPowInOut(2),
    cubicIn: getPowIn(3),
    cubicOut: getPowOut(3),
    cubicInOut: getPowInOut(3),
    quartIn: getPowIn(4),
    quartOut: getPowOut(4),
    quartInOut: getPowInOut(4),
    quintIn: getPowIn(5),
    quintOut: getPowOut(5),
    quintInOut: getPowInOut(5),
    elasticIn: getElasticIn(1, 0.3),
    elasticOut: getElasticOut(1, 0.3),
    elasticInOut: getElasticInOut(1, 0.3 * 1.5),
    bounceIn,
    bounceOut,
    bounceInOut,
    circIn,
    circOut,
    circInOut,
    backIn: getBackIn(1.7),
    backOut: getBackOut(1.7),
    backInOut: getBackInOut(1.7),
    sineIn,
    sineOut,
    sineInOut
}

export default EaseFunctions;
