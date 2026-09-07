const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function deriveZipEnrolmentFields(value) {
    const enrolment = String(value ?? '');
    const station = enrolment.substring(4, 9);
    const dateNumber = enrolment.substring(14, 22);
    const stationId = /^\d{5}$/.test(station) ? station : '';
    if (!/^\d{8}$/.test(dateNumber)) return { stationId, date: '' };
    const year = dateNumber.substring(0, 4);
    const month = dateNumber.substring(4, 6);
    const day = dateNumber.substring(6, 8);
    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    const valid = parsed.getUTCFullYear() === Number(year) &&
        parsed.getUTCMonth() + 1 === Number(month) && parsed.getUTCDate() === Number(day);
    return { stationId, date: valid ? `${day}-${months[Number(month) - 1]}-${year}` : '' };
}
