import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with the UTC plugin
dayjs.extend(utc);
dayjs.extend(timezone);

export const datetimeDiff = (dateA: dayjs.Dayjs, dateB: dayjs.Dayjs, byUnit: dayjs.QUnitType) => {
  const timePassed = dateA.diff(dayjs.utc(dateB), byUnit);
  return timePassed;
};

export default dayjs;
