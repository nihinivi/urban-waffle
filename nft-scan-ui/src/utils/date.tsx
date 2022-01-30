import moment from "moment";
import { DATETIME_FORMAT } from "../themes/constants";

export function formatUTCTimestamp(timestamp: number, locale: boolean = false, format: string = DATETIME_FORMAT): string {
    if(locale) {
        const offset = new Date(timestamp).getTimezoneOffset() * -1;
        const hours = offset / 60
        let off = hours?.toString()
        if(hours > 0) {
            off = '+' + off
        }
        return moment(timestamp).format(format);
    }
    return moment.utc(timestamp).format(format);
}

export function deltaMinutes(ts1: number, ts2: number) {
    var diffMs = ts1 - ts2
    return Math.round(((diffMs % 86400000) % 3600000) / 60000)
}

export function formatCountdown(days: number, hours: number, minutes: number, seconds: number) {
    let result = ''

    if(days > 0) {
        result += days + ':'
    }
    if(hours <= 9) {
        result += '0' + hours
    } else {
        result += hours
    }
    result += ':'
    if(minutes <= 9) {
        result += '0' + minutes
    } else {
        result += minutes
    }
    result += ':'
    if(seconds <= 9) {
        result += '0' + seconds
    } else {
        result += seconds
    }

    return result
}