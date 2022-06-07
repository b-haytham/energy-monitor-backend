import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class AggregationUtilitiesService {
  public getMatchStage(time: string, other: Record<string, any>) {
    switch (time) {
      case '1d':
        return {
          $match: {
            t: { $gte: dayjs().subtract(1, 'day').startOf('day').toDate() },
            ...other,
          },
        };
      case '1m':
        return {
          $match: {
            t: { $gte: dayjs().subtract(1, 'month').startOf('month').toDate() },
            ...other,
          },
        };

      case '1y':
        return {
          $match: {
            t: { $gte: dayjs().subtract(1, 'year').startOf('year').toDate() },
            ...other,
          },
        };
      default:
        return {
          $match: {
            t: { $gte: dayjs().subtract(1, 'month').startOf('month').toDate() },
            ...other,
          },
        };
    }
  }

  public getGroupStage(time: string, other: Record<string, any>) {
    switch (time) {
      case '1d':
        return {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d '%H",
                date: '$t',
              },
            },
            ...other,
          },
        };
      case '1m':
        return {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$t',
              },
            },
            ...other,
          },
        };

      case '1y':
        return {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$t',
              },
            },
            ...other,
          },
        };
      default:
        return {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$t',
              },
            },
            ...other,
          },
        };
    }
  }

  public getWindowingStage() {
    return {
      $setWindowFields: {
        sortBy: {
          _id: 1,
        },
        output: {
          prev: {
            $shift: {
              output: '$max',
              by: -1,
              default: 0,
            },
          },
        },
      },
    };
  }

  public getAddFieldsStage() {
    return {
      $addFields: {
        consumed: {
          $subtract: ['$max', '$prev'],
        },
      },
    };
  }
}
