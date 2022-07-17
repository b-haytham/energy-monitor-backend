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

  public getGroupStage(
    time: string,
    other: Record<string, any>,
    isOverview?: boolean,
  ) {
    switch (time) {
      case '1d':
        return {
          $group: {
            _id: {
              $dateToString: {
                format: isOverview ? '%Y-%m-%d' : "%Y-%m-%d '%H",
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
                format: isOverview ? '%Y-%m' : '%Y-%m-%d',
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
                format: isOverview ? '%Y' : '%Y-%m',
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
                format: isOverview ? '%Y-%m' : '%Y-%m-%d',
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

  private getMatchDate(time: string) {
    switch (time) {
      case '1d':
        return dayjs().subtract(1, 'day').startOf('day').toDate();
      case '1m':
        return dayjs().subtract(1, 'month').startOf('month').toDate();
      case '1y':
        return dayjs().subtract(1, 'year').startOf('year').toDate();
      default:
        return dayjs().subtract(1, 'month').startOf('month').toDate();
    }
  }

  private getDateStringFormat(time: string) {
    switch (time) {
      case '1d':
        return "%Y-%m-%d '%H";
      case '1m':
        return '%Y-%m-%d';
      case '1y':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  private getWidowRangeUnit(time: string) {
    switch (time) {
      case '1d':
        return 'hour';
      case '1m':
        return 'day';
      case '1y':
        return 'month';
      default:
        return 'day';
    }
  }

  getAggregationPipeline(device: string, value: string, time: string) {
    const matchStage = {
      $match: {
        's.d': device,
        's.v': value,
        t: { $gte: this.getMatchDate(time) },
      },
    };

    const setWindowFieldsStage = {
      $setWindowFields: {
        partitionBy: {
          $dateToString: {
            date: '$t',
            format: this.getDateStringFormat(time),
            timezone: 'Africa/Tunis',
          },
        },
        sortBy: { t: 1 },
        output: {
          consumedKilowattHours: {
            $integral: {
              input: '$v',
              unit: 'hour',
            },
            window: {
              range: [-1, 'current'],
              unit: this.getWidowRangeUnit(time),
            },
          },
        },
      },
    };

    const groupStage = {
      $group: {
        _id: {
          $dateToString: {
            date: '$t',
            format: this.getDateStringFormat(time),
            timezone: 'Africa/Tunis',
          },
        },
        consumed: { $last: '$consumedKilowattHours' },
      },
    };

    const sortStage = {
      $sort: {
        _id: 1,
      },
    };

    return [matchStage, setWindowFieldsStage, groupStage, sortStage];
  }
}

/*
$match
{
  "s.v": "p",
  "t":{ $gte:  ISODate('2022-01-01T00:00:00') }
}

$setWindowFields
{
  partitionBy: {
    $dateToString: { date:"$t", format: "%Y-%m", timezone: "Africa/Tunis" }
  },
  sortBy: { t: 1 },    
  output: {
    consumedKilowattHours: {
        "$integral": {
          "input": "$v",
          "unit": "hour",
        },
        "window": {
          "range": [-1, "current"],
          "unit": "day",
        },
      },
    },
}

$group
{
  _id: {
    $dateToString: { date:"$t", format: "%Y-%m-%d" timezone: "Africa/Tunis" }
  },
  c: { $last: "$consumedKilowattHours" }
}

$sort 
{
  _id: 1
}
*/
