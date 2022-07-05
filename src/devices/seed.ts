import { DeviceType, Value } from './entities/device.entity';

export const makeTri = (): Value[] => {
  return [
    {
      name: 'Status',
      description: 'Device Status',
      accessor: 's',
      unit: '',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Tension 1',
      description: 'Tension 1',
      accessor: 'u1',
      unit: 'V',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Tension 2',
      description: 'Tension 2',
      accessor: 'u2',
      unit: 'V',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Tension 3',
      description: 'Tension 3',
      accessor: 'u3',
      unit: 'V',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Current 1',
      description: 'Current 1',
      accessor: 'i1',
      unit: 'A',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Current 2',
      description: 'Current 2',
      accessor: 'i2',
      unit: 'A',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Current 3',
      description: 'Current 3',
      accessor: 'i3',
      unit: 'A',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Power',
      description: 'Power',
      accessor: 'p',
      unit: 'W',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Energie',
      description: 'Energie',
      accessor: 'e',
      unit: 'kw/h',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
  ];
};

export const makeMono = (): Value[] => {
  return [
    {
      name: 'Status',
      description: 'Device Status',
      accessor: 's',
      unit: '',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Tension',
      description: 'Tension',
      accessor: 'u',
      unit: 'V',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Current',
      description: 'Current',
      accessor: 'i',
      unit: 'A',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Power',
      description: 'Power',
      accessor: 'p',
      unit: 'W',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
    {
      name: 'Energie',
      description: 'Energie',
      accessor: 'e',
      unit: 'kw/h',
      latest_value: {
        value: null,
        timestamp: null,
      },
    },
  ];
};

export const makePv = () => makeMono();

const valuesSeed = (type: DeviceType) => {
  if (type == DeviceType.TRI) {
    return makeTri();
  }
  if (type == DeviceType.PV) {
    return makePv();
  }
  if (type == DeviceType.MONO) {
    return makeMono();
  }
  throw new Error('Unkown device type');
};

export default valuesSeed;
